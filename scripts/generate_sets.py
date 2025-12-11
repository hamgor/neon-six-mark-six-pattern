# scripts/generate_sets.py
from collections import Counter, defaultdict
from itertools import combinations
import math
DRAWS = [
    [8,14,16,18,26,48,44],
    [13,21,33,41,44,46,43],
    [15,17,19,23,24,34,33],
    [1,3,24,31,39,45,7],
    [5,6,18,19,30,39,7],
    [3,15,17,24,32,44,20],
    [2,11,32,40,43,48,12],
    [5,13,17,18,31,44,2],
    [1,8,9,11,18,32,13],
    [4,19,24,25,26,46,39],
    [6,7,27,36,39,43,1],
    [4,7,15,21,45,46,24],
    [19,20,26,28,39,44,4],
    [10,17,22,33,40,41,31],
    [7,9,16,17,33,46,49],
    [18,20,28,37,38,40,41],
    [10,11,28,30,37,39,15],
    [2,11,13,28,38,47,7],
    [2,4,10,26,28,36,23],
    [19,26,33,35,36,39,5],
    [1,2,17,35,37,48,8],
    [6,18,29,34,37,38,39],
    [4,6,26,28,34,40,25],
]
NUMBERS = range(1,50)
# Parameters (weights) - these can be tuned
W = {
    'freq': 0.28,
    'recency': 0.18,
    'pair': 0.12,
    'overdue': 0.10,
    'lastdigit': 0.06,
    'range': 0.12,
    'parity': 0.06,
    'sumrange': 0.08,
}
# Helpers
def counts_and_recency(draws):
    freq = Counter()
    recency_score = defaultdict(float)
    total = len(draws)
    for idx, draw in enumerate(draws):
        age = total - idx  # more recent = smaller age
        for n in draw:
            freq[n] += 1
            # recency: exponential decay favoring recent draws
            recency_score[n] += math.exp(-0.3 * (age - 1))
    return freq, recency_score
def pair_matrix(draws):
    pair = defaultdict(Counter)
    for draw in draws:
        for a, b in combinations(sorted(draw), 2):
            pair[a][b] += 1
            pair[b][a] += 1
    return pair
def last_digit_counts(freq):
    ld = Counter()
    for n, c in freq.items():
        ld[n % 10] += c
    return ld
def range_bucket(n):
    if n <= 17:
        return 0
    if n <= 34:
        return 1
    return 2
# Compute base features
freq, recency_score = counts_and_recency(DRAWS)
pair = pair_matrix(DRAWS)
lastdigit = last_digit_counts(freq)
# Overdue: inverse of recency presence — numbers not appearing get small bump
max_freq = max(freq.values()) if freq else 1
scores = {}
for n in NUMBERS:
    f = freq.get(n, 0)
    r = recency_score.get(n, 0)
    # pair score uses co-occurrence with top numbers
    pair_score = sum(pair[n].values())
    ld = lastdigit.get(n % 10, 0)
    overdue = (1 if f == 0 else 0) * 0.5
    # range parity penalties computed later at set-level; here we give neutral score
    # Normalize raw features roughly
    s_freq = f / (max_freq or 1)
    s_recency = r / (sum(recency_score.values()) or 1) if sum(recency_score.values()) > 0 else 0
    max_pair_sum = max(1, max((sum(c.values()) for c in pair.values()), default=0))
    s_pair = pair_score / max_pair_sum
    s_ld = ld / (max(lastdigit.values()) or 1)
    s_overdue = overdue
    raw = (
        W['freq'] * s_freq +
        W['recency'] * s_recency +
        W['pair'] * s_pair +
        W['overdue'] * s_overdue +
        W['lastdigit'] * s_ld
    )
    scores[n] = raw
# Normalize final scores to 0..1
min_s = min(scores.values())
max_s = max(scores.values())
for n in scores:
    if max_s - min_s > 1e-9:
        scores[n] = (scores[n] - min_s) / (max_s - min_s)
    else:
        scores[n] = 0.0
# Top pool
pool = sorted(NUMBERS, key=lambda x: scores[x], reverse=True)[:12]
# Utility to assemble sets with constraints
import random
random.seed(42)
def finalize_set(cand):
    # Ensure unique, sorted; adjust for spread parity and soft sum range
    cand = list(dict.fromkeys(cand))[:7]
    # Force size 7, fill from pool if short
    i = 0
    pool_copy = pool[:]
    while len(cand) < 7 and i < len(pool_copy):
        pick = pool_copy[i]
        if pick not in cand:
            cand.append(pick)
        i += 1
    # Soft fixes: sum range
    s = sum(cand)
    # target sum window (empirical from draws)
    MIN_SUM, MAX_SUM = 120, 240
    if s < MIN_SUM or s > MAX_SUM:
        # try swap extremes with next best to approach window
        for i in range(len(cand)):
            for candidate in pool:
                if candidate in cand: continue
                new = cand[:i] + [candidate] + cand[i+1:]
                new_s = sum(new)
                if MIN_SUM <= new_s <= MAX_SUM:
                    cand = new
                    s = new_s
                    break
            if MIN_SUM <= s <= MAX_SUM:
                break
    return sorted(cand)
# Set A: Conservative (top 6 + 1 overdue from pool if exists else top)
setA = pool[:6]
# prefer one overdue from top 12
overdue_candidates = [n for n in pool if freq.get(n, 0) == 0]
if overdue_candidates:
    setA.append(overdue_candidates[0])
else:
    setA.append(pool[6])
setA = finalize_set(setA)
# Set B: Spread (enforce bucket spread)
b = []
buckets = {0: [], 1: [], 2: []}
for n in pool:
    buckets[range_bucket(n)].append(n)
# pick best from each bucket first
for k in (0,1,2):
    if buckets[k]:
        b.append(buckets[k][0])
# fill remaining ensuring parity balance
while len(b) < 7:
    for n in pool:
        if n not in b:
            b.append(n)
            if len(b) == 7: break
setB = finalize_set(b)
# Set C: Exploratory (top 4 + 3 highest pair-cooccurrence with top4)
top4 = pool[:4]
c = top4[:]
# compute co-occurrence sum with top4
pair_score_with_top4 = []
for n in pool:
    if n in top4: continue
    s = sum(pair[n][t] for t in top4)
    pair_score_with_top4.append((s, n))
pair_score_with_top4.sort(reverse=True)
for _, n in pair_score_with_top4[:3]:
    if len(c) < 7:
        c.append(n)
setC = finalize_set(c)
# Output
print('Top pool (12):', pool)
print('\nScores (top 15):')
for n in sorted(scores, key=scores.get, reverse=True)[:15]:
    print(f'{n:2d}: {scores[n]:.3f} (freq={freq.get(n, 0)})')
print('\nPredicted Sets:')
print('Set A (Conservative):', setA)
print('Set B (Spread):     ', setB)
print('Set C (Exploratory):', setC)