import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Wand2, BrainCircuit, History, Save, FolderDown } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MARKSIX_DRAWS } from '@shared/mock-data';
import { computeScores, generateSets, DEFAULT_WEIGHTS, Weights, Scores, Frequency, PairMatrix } from '@/lib/lottery-utils';
import { ResultsCard } from './components/ResultsCard';
import { DetailModal } from './components/DetailModal';
import type { Preset, ApiResponse } from '@shared/types';
const NEON_COLORS = {
  pink: '#FF2972',
  cyan: '#00FFE1',
  orange: '#FFB84D',
};
type GeneratedSets = { setA: number[], setB: number[], setC: number[] } | null;
type DetailNumberData = { num: number; scores: Scores; freq: Frequency; pair: PairMatrix; } | null;
async function fetchPresets(): Promise<Preset[]> {
  // Mocking API for Phase 1
  // In a real scenario, this would fetch from the DO.
  const presets = localStorage.getItem('lottery_presets_v1');
  return presets ? JSON.parse(presets) : [];
}
async function savePreset(preset: Omit<Preset, 'id'>): Promise<Preset[]> {
  // Mocking API for Phase 1
  const presets = await fetchPresets();
  const newPreset = { ...preset, id: crypto.randomUUID() };
  const updatedPresets = [...presets, newPreset];
  localStorage.setItem('lottery_presets_v1', JSON.stringify(updatedPresets));
  return updatedPresets;
}
export function HomePage() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [generatedSets, setGeneratedSets] = useState<GeneratedSets>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [detailNumberData, setDetailNumberData] = useState<DetailNumberData>(null);
  const { data: presets, isLoading: isLoadingPresets } = useQuery({
    queryKey: ['presets'],
    queryFn: fetchPresets,
  });
  const savePresetMutation = useMutation({
    mutationFn: savePreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      toast.success('Preset saved successfully!');
      setPresetName('');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const { scores, freq, pair } = useMemo(() => computeScores(MARKSIX_DRAWS, weights), [weights]);
  const frequencyData = useMemo(() => {
    return Object.entries(freq)
      .map(([num, count]) => ({ num: parseInt(num), count }))
      .sort((a, b) => b.count - a.count);
  }, [freq]);
  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    toast.info('Generating new sets with current rules...');
    setTimeout(() => {
      const { scores: newScores, freq: newFreq, pair: newPair } = computeScores(MARKSIX_DRAWS, weights);
      const sets = generateSets(newScores, newFreq, newPair);
      setGeneratedSets(sets);
      setIsGenerating(false);
      toast.success('New sets generated!');
    }, 300);
  }, [weights]);
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGenerate();
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [handleGenerate]);
  const handleWeightChange = (key: keyof Weights, value: number[]) => {
    setWeights(prev => ({ ...prev, [key]: value[0] / 100 }));
  };
  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a name for the preset.');
      return;
    }
    savePresetMutation.mutate({ name: presetName, weights });
  };
  const handleLoadPreset = (presetId: string) => {
    const preset = presets?.find(p => p.id === presetId);
    if (preset) {
      setWeights(preset.weights);
      toast.success(`Preset "${preset.name}" loaded.`);
    }
  };
  const openDetailModal = useCallback((num: number) => {
    setDetailNumberData({ num, scores, freq, pair });
  }, [scores, freq, pair]);
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
                      <CardDescription>How many times each number appeared in the dataset. Click a bar for details.</CardDescription>
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
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={(data) => openDetailModal(data.num)} className="cursor-pointer">
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
                            <SlidersHorizontal className="mr-2 size-4" /> Adjust Rules & Presets
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px]">
                          <SheetHeader>
                            <SheetTitle>Configuration</SheetTitle>
                            <SheetDescription>Adjust weights or manage presets to influence number selection.</SheetDescription>
                          </SheetHeader>
                          <div className="py-4 space-y-6">
                            <div className="space-y-4 p-4 border rounded-lg">
                              <h3 className="font-semibold flex items-center gap-2"><FolderDown className="size-4" /> Presets</h3>
                              {isLoadingPresets ? <Skeleton className="h-10 w-full" /> : (
                                <Select onValueChange={handleLoadPreset}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Load a preset..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {presets?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              )}
                              <div className="flex gap-2">
                                <Input placeholder="New preset name..." value={presetName} onChange={e => setPresetName(e.target.value)} />
                                <Button onClick={handleSavePreset} disabled={savePresetMutation.isPending}>
                                  <Save className="mr-2 size-4" /> {savePresetMutation.isPending ? 'Saving...' : 'Save'}
                                </Button>
                              </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                              <h3 className="font-semibold">Rule Weights</h3>
                              {Object.entries(weights).map(([key, value]) => (
                                <div key={key} className="space-y-2">
                                  <Label htmlFor={key} className="capitalize">{key} ({(value * 100).toFixed(0)}%)</Label>
                                  <Slider
                                    id={key}
                                    value={[value * 100]}
                                    max={100}
                                    step={1}
                                    onValueChange={(v) => handleWeightChange(key as keyof Weights, v)}
                                  />
                                </div>
                              ))}
                            </div>
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
                    <Skeleton className="h-56 rounded-lg" />
                    <Skeleton className="h-56 rounded-lg" />
                    <Skeleton className="h-56 rounded-lg" />
                  </div>
                ) : generatedSets ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ResultsCard title="Set A" description="Conservative" numbers={generatedSets.setA} scores={scores} color={NEON_COLORS.pink} delay={0} onRegenerate={handleGenerate} onNumberClick={openDetailModal} />
                    <ResultsCard title="Set B" description="Spread" numbers={generatedSets.setB} scores={scores} color={NEON_COLORS.cyan} delay={0.1} onRegenerate={handleGenerate} onNumberClick={openDetailModal} />
                    <ResultsCard title="Set C" description="Exploratory" numbers={generatedSets.setC} scores={scores} color={NEON_COLORS.orange} delay={0.2} onRegenerate={handleGenerate} onNumberClick={openDetailModal} />
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
      <DetailModal isOpen={!!detailNumberData} onClose={() => setDetailNumberData(null)} numberData={detailNumberData} />
      <Toaster richColors closeButton />
    </>
  );
}