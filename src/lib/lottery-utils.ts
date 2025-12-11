import { produce } from 'immer';
export type Weights = {
    freq: number;
    recency: number;
    pair: number;
    overdue: number;
    lastdigit: number;
    range: number;
    parity: number;
    sumrange: number;
};
export type Scores = Record<number, number>;
export type Frequency = Record<number, number>;
export type PairMatrix = Record<number, Record<number, number>>;
const NUMBERS = Array.from({ length: 49 }, (_, i) => i + 1);
export const DEFAULT_WEIGHTS: Weights = {
    freq: 0.28,
    recency: 0.18,
    pair: 0.12,
    overdue: 0.10,
    lastdigit: 0.06,
    range: 0.12,
    parity: 0.06,
    sumrange: 0.08,
};
// --- Feature Calculation ---
export function getFrequencyAndRecency(draws: number[][]): { freq: Frequency; recency: Record<number, number> } {
    const freq: Frequency = {};
    const recency: Record<number, number> = {};
    const total = draws.length;
    draws.forEach((draw, idx) => {
        const age = total - idx;
        draw.forEach(n => {
            freq[n] = (freq[n] || 0) + 1;
            recency[n] = (recency[n] || 0) + Math.exp(-0.3 * (age - 1));
        });
    });
    return { freq, recency };
}
export function getPairMatrix(draws: number[][]): PairMatrix {
    const pair: PairMatrix = {};
    draws.forEach(draw => {
        const sorted = [...draw].sort((a, b) => a - b);
        for (let i = 0; i < sorted.length; i++) {
            for (let j = i + 1; j < sorted.length; j++) {
                const a = sorted[i];
                const b = sorted[j];
                if (!pair[a]) pair[a] = {};
                if (!pair[b]) pair[b] = {};
                pair[a][b] = (pair[a][b] || 0) + 1;
                pair[b][a] = (pair[b][a] || 0) + 1;
            }
        }
    });
    return pair;
}
export function getLastDigitCounts(freq: Frequency): Record<number, number> {
    const ld: Record<number, number> = {};
    Object.entries(freq).forEach(([n, c]) => {
        const digit = parseInt(n) % 10;
        ld[digit] = (ld[digit] || 0) + c;
    });
    return ld;
}
export function rangeBucket(n: number): 0 | 1 | 2 {
    if (n <= 17) return 0;
    if (n <= 34) return 1;
    return 2;
}
// --- Scoring ---
export function computeScores(draws: number[][], weights: Weights): { scores: Scores, freq: Frequency, pair: PairMatrix } {
    const { freq, recency } = getFrequencyAndRecency(draws);
    const pair = getPairMatrix(draws);
    const lastdigit = getLastDigitCounts(freq);
    const maxFreq = Math.max(1, ...Object.values(freq));
    const totalRecency = Object.values(recency).reduce((s, v) => s + v, 0);
    const maxPairSum = Math.max(1, ...Object.values(pair).map(c => Object.values(c).reduce((s, v) => s + v, 0)));
    const maxLastDigit = Math.max(1, ...Object.values(lastdigit));
    const rawScores: Scores = {};
    NUMBERS.forEach(n => {
        const f = freq[n] || 0;
        const r = recency[n] || 0;
        const p = Object.values(pair[n] || {}).reduce((s, v) => s + v, 0);
        const ld = lastdigit[n % 10] || 0;
        const overdue = f === 0 ? 0.5 : 0;
        const sFreq = f / maxFreq;
        const sRecency = totalRecency > 0 ? r / totalRecency : 0;
        const sPair = p / maxPairSum;
        const sLd = ld / maxLastDigit;
        rawScores[n] =
            weights.freq * sFreq +
            weights.recency * sRecency +
            weights.pair * sPair +
            weights.overdue * overdue +
            weights.lastdigit * sLd;
    });
    const minS = Math.min(...Object.values(rawScores));
    const maxS = Math.max(...Object.values(rawScores));
    const range = maxS - minS;
    const scores: Scores = {};
    if (range < 1e-9) {
        NUMBERS.forEach(n => scores[n] = 0);
    } else {
        NUMBERS.forEach(n => {
            scores[n] = (rawScores[n] - minS) / range;
        });
    }
    return { scores, freq, pair };
}
// --- Set Generation ---
function finalizeSet(candidate: number[], pool: number[]): number[] {
    let finalSet = Array.from(new Set(candidate)).slice(0, 7);
    let i = 0;
    while (finalSet.length < 7 && i < pool.length) {
        if (!finalSet.includes(pool[i])) {
            finalSet.push(pool[i]);
        }
        i++;
    }
    const MIN_SUM = 120, MAX_SUM = 240;
    let currentSum = finalSet.reduce((a, b) => a + b, 0);
    if (currentSum < MIN_SUM || currentSum > MAX_SUM) {
        for (let i = 0; i < finalSet.length; i++) {
            for (const p of pool) {
                if (finalSet.includes(p)) continue;
                const newSet = produce(finalSet, draft => { draft[i] = p; });
                const newSum = newSet.reduce((a, b) => a + b, 0);
                if (newSum >= MIN_SUM && newSum <= MAX_SUM) {
                    finalSet = newSet;
                    currentSum = newSum;
                    break;
                }
            }
            if (currentSum >= MIN_SUM && currentSum <= MAX_SUM) break;
        }
    }
    return finalSet.sort((a, b) => a - b);
}
export function generateSets(scores: Scores, freq: Frequency, pair: PairMatrix): { setA: number[], setB: number[], setC: number[] } {
    const pool = NUMBERS.sort((a, b) => scores[b] - scores[a]).slice(0, 12);
    // Set A: Conservative
    let setA = pool.slice(0, 6);
    const overdueInPool = pool.find(n => (freq[n] || 0) === 0);
    setA.push(overdueInPool || pool[6]);
    // Set B: Spread
    let setB: number[] = [];
    const buckets: Record<number, number[]> = { 0: [], 1: [], 2: [] };
    pool.forEach(n => buckets[rangeBucket(n)].push(n));
    [0, 1, 2].forEach(k => {
        if (buckets[k].length > 0) setB.push(buckets[k][0]);
    });
    // Set C: Exploratory
    const top4 = pool.slice(0, 4);
    let setC = [...top4];
    const pairCandidates = pool
        .filter(n => !top4.includes(n))
        .map(n => {
            const pairScore = top4.reduce((s, t) => s + (pair[n]?.[t] || 0), 0);
            return { n, pairScore };
        })
        .sort((a, b) => b.pairScore - a.pairScore);
    pairCandidates.slice(0, 3).forEach(c => setC.push(c.n));
    return {
        setA: finalizeSet(setA, pool),
        setB: finalizeSet(setB, pool),
        setC: finalizeSet(setC, pool),
    };
}