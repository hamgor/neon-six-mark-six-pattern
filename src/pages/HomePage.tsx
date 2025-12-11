import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Wand2, BrainCircuit, History } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { MARKSIX_DRAWS } from '@shared/mock-data';
import { computeScores, generateSets, DEFAULT_WEIGHTS, Weights, Frequency } from '@/lib/lottery-utils';
import { ResultsCard } from './components/ResultsCard';
const NEON_COLORS = {
  pink: '#FF2972',
  cyan: '#00FFE1',
  orange: '#FFB84D',
};
type GeneratedSets = { setA: number[], setB: number[], setC: number[] } | null;
export function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [generatedSets, setGeneratedSets] = useState<GeneratedSets>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { scores, freq, pair } = useMemo(() => computeScores(MARKSIX_DRAWS, weights), [weights]);
  const frequencyData = useMemo(() => {
    return Object.entries(freq)
      .map(([num, count]) => ({ num: parseInt(num), count }))
      .sort((a, b) => b.count - a.count);
  }, [freq]);
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGenerate();
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  const handleGenerate = () => {
    setIsGenerating(true);
    toast.info('Generating new sets with current rules...');
    setTimeout(() => {
      const { scores: newScores, freq: newFreq, pair: newPair } = computeScores(MARKSIX_DRAWS, weights);
      const sets = generateSets(newScores, newFreq, newPair);
      setGeneratedSets(sets);
      setIsGenerating(false);
      toast.success('New sets generated!');
    }, 300);
  };
  const handleWeightChange = (key: keyof Weights, value: number[]) => {
    setWeights(prev => ({ ...prev, [key]: value[0] / 100 }));
  };
  return (
    <>
      <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(39,39,42,0.8),rgba(255,255,255,0))] pointer-events-none" />
        <ThemeToggle className="fixed top-4 right-4" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <header className="text-center space-y-4 mb-12">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-5xl md:text-7xl font-display font-bold"
                style={{ textShadow: `0 0 10px ${NEON_COLORS.pink}55, 0 0 20px ${NEON_COLORS.cyan}55` }}
              >
                Neon Six
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
              >
                A visually outstanding, retro-styled Mark Six analyzer and candidate-generator.
              </motion.p>
            </header>
            <main className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="lg:col-span-2 space-y-8"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><History className="text-primary" /> Recent Draws</CardTitle>
                      <CardDescription>The last {MARKSIX_DRAWS.length} draws used for analysis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {MARKSIX_DRAWS.slice(0, 5).map((draw, i) => (
                          <div key={i} className="flex gap-1 p-2 border rounded-md bg-secondary/50">
                            {draw.map(n => <span key={n} className="font-mono text-sm">{n}</span>)}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><BarChart className="text-primary" /> Number Frequency</CardTitle>
                      <CardDescription>How many times each number appeared in the dataset.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                          <BarChart data={frequencyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="num" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {frequencyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index < 5 ? NEON_COLORS.pink : index < 15 ? NEON_COLORS.cyan : NEON_COLORS.orange} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <Card className="sticky top-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><BrainCircuit className="text-primary" /> Analysis Engine</CardTitle>
                      <CardDescription>Tune the heuristics and generate new sets.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <SlidersHorizontal className="mr-2 size-4" /> Adjust Rules
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Rule Configuration</SheetTitle>
                            <SheetDescription>Adjust the weights for each heuristic to influence the number selection.</SheetDescription>
                          </SheetHeader>
                          <div className="space-y-4 py-4">
                            {Object.entries(weights).map(([key, value]) => (
                              <div key={key} className="space-y-2">
                                <Label htmlFor={key} className="capitalize">{key} ({(value * 100).toFixed(0)}%)</Label>
                                <Slider
                                  id={key}
                                  defaultValue={[value * 100]}
                                  max={100}
                                  step={1}
                                  onValueChange={(v) => handleWeightChange(key as keyof Weights, v)}
                                />
                              </div>
                            ))}
                          </div>
                        </SheetContent>
                      </Sheet>
                      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-gradient-primary text-primary-foreground hover:scale-105 transition-transform duration-200">
                        <Wand2 className="mr-2 size-4" /> {isGenerating ? 'Generating...' : 'Generate Sets'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
              <Separator />
              <section className="space-y-4">
                <h2 className="text-3xl font-bold text-center">Generated Candidate Sets</h2>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-48 rounded-lg" />
                    <Skeleton className="h-48 rounded-lg" />
                    <Skeleton className="h-48 rounded-lg" />
                  </div>
                ) : generatedSets ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ResultsCard title="Set A" description="Conservative" numbers={generatedSets.setA} color={NEON_COLORS.pink} delay={0} />
                    <ResultsCard title="Set B" description="Spread" numbers={generatedSets.setB} color={NEON_COLORS.cyan} delay={0.1} />
                    <ResultsCard title="Set C" description="Exploratory" numbers={generatedSets.setC} color={NEON_COLORS.orange} delay={0.2} />
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Click "Generate Sets" to begin.</p>
                )}
              </section>
            </main>
            <footer className="text-center text-muted-foreground/80 mt-16">
              <p>Built with ❤️ at Cloudflare</p>
            </footer>
          </div>
        </div>
      </div>
      <Toaster richColors closeButton />
    </>
  );
}