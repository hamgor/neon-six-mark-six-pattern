import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { BarChart2, Users, Clock, Hash } from 'lucide-react';
import { MARKSIX_DRAWS } from '@shared/mock-data';
import type { Scores, Frequency, PairMatrix } from '@/lib/lottery-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  numberData: {
    num: number;
    scores: Scores;
    freq: Frequency;
    pair: PairMatrix;
  } | null;
}
const NEON_COLORS = {
  pink: '#FF2972',
  cyan: '#00FFE1',
  orange: '#FFB84D',
};
const CHART_COLORS = ['#FF2972', '#00FFE1', '#FFB84D', '#8884d8', '#82ca9d', '#ffc658', '#a4de6c', '#d0ed57', '#ff8042', '#00C49F'];
const getTimelineData = (num: number) => {
  return MARKSIX_DRAWS.map((draw, index) => ({
    draw: `Draw ${MARKSIX_DRAWS.length - index}`,
    present: draw.includes(num) ? 1 : 0,
  })).reverse();
};
const getPairData = (num: number, pair: PairMatrix, freq: Frequency) => {
  if (!pair || !pair[num]) return [];
  return Object.entries(pair[num])
    .map(([pairNum, count]) => ({
      num: parseInt(pairNum),
      count,
      totalFreq: freq[parseInt(pairNum)] || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};
const getLastDigitDistribution = () => {
    const counts: Record<number, number> = {};
    MARKSIX_DRAWS.flat().forEach(n => {
        const digit = n % 10;
        counts[digit] = (counts[digit] || 0) + 1;
    });
    return Object.entries(counts).map(([digit, count]) => ({
        name: `Ends in ${digit}`,
        value: count,
        digit: parseInt(digit),
    })).sort((a,b) => a.digit - b.digit);
}
export function DetailModal({ isOpen, onClose, numberData }: DetailModalProps) {
  const { num, scores, freq, pair } = numberData || {};
  const timelineData = useMemo(() => (num ? getTimelineData(num) : []), [num]);
  const pairData = useMemo(() => (num && pair && freq ? getPairData(num, pair, freq) : []), [num, pair, freq]);
  const lastDigitData = useMemo(() => getLastDigitDistribution(), []);
  if (!numberData || !num) return null;
  const score = scores ? (scores[num] * 100).toFixed(1) : 'N/A';
  const frequency = freq ? freq[num] || 0 : 0;
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-background/80 backdrop-blur-sm border-primary/20">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <DialogHeader>
            <DialogTitle className="text-3xl font-display flex items-center gap-3">
              <div className="center size-12 rounded-full font-mono font-bold text-2xl bg-secondary text-secondary-foreground shadow-inner" style={{ color: NEON_COLORS.pink }}>
                {num}
              </div>
              Analysis for Number {num}
            </DialogTitle>
            <DialogDescription>
              Score: {score} | Total Appearances: {frequency}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Tabs defaultValue="timeline">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timeline"><Clock className="size-4 mr-2" />Timeline</TabsTrigger>
                <TabsTrigger value="pairs"><Users className="size-4 mr-2" />Co-occurrence</TabsTrigger>
                <TabsTrigger value="distribution"><Hash className="size-4 mr-2" />Distribution</TabsTrigger>
              </TabsList>
              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Occurrence Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer>
                        <LineChart data={timelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="draw" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                          <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                          <Line type="monotone" dataKey="present" stroke={NEON_COLORS.pink} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="pairs" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top 10 Paired Numbers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Number</TableHead>
                          <TableHead>Paired Count</TableHead>
                          <TableHead>Total Freq.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pairData.map(p => (
                          <TableRow key={p.num}>
                            <TableCell className="font-medium">{p.num}</TableCell>
                            <TableCell>{p.count}</TableCell>
                            <TableCell>{p.totalFreq}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="distribution" className="mt-4">
                 <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Last Digit Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={lastDigitData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label>
                                    {lastDigitData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke={entry.digit === num % 10 ? 'hsl(var(--foreground))' : 'transparent'} strokeWidth={3} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}