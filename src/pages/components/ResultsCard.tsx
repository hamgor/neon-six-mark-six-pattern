import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Scores } from '@/lib/lottery-utils';
interface ResultsCardProps {
  title: string;
  description: string;
  numbers: number[];
  scores: Scores;
  color: string;
  delay?: number;
  onRegenerate?: () => void;
}
export function ResultsCard({ title, description, numbers, scores, color, delay = 0, onRegenerate }: ResultsCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(numbers.join(', '));
    toast.success(`Set "${title}" copied to clipboard!`);
  };
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + numbers.join(',');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `neon-six_${title.toLowerCase().replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info(`Exporting Set "${title}" as CSV.`);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="p-4 flex justify-between items-center" style={{ background: `linear-gradient(135deg, ${color} 0%, hsl(var(--primary)) 100%)` }}>
            <div>
              <CardTitle className="text-primary-foreground">{title}</CardTitle>
              <p className="text-sm text-primary-foreground/80">{description}</p>
            </div>
            {onRegenerate && (
              <Button size="icon" variant="ghost" onClick={onRegenerate} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
                <RefreshCw className="size-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {numbers.map((num) => (
              <HoverCard key={num} openDelay={100} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <div
                    className="center size-12 rounded-full font-mono font-bold text-lg bg-secondary text-secondary-foreground shadow-inner cursor-help"
                    style={{
                      color,
                      boxShadow: `0 0 10px ${color}33, inset 0 2px 4px #00000033`,
                    }}
                  >
                    {num}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2 text-xs">
                  Score: {(scores[num] * 100).toFixed(1)}
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="w-full" onClick={handleCopy}>
              <Copy className="mr-2 size-4" /> Copy
            </Button>
            <Button variant="outline" size="sm" className="w-full" onClick={handleExport}>
              <Download className="mr-2 size-4" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}