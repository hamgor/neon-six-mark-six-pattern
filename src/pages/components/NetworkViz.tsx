import React, { useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Line } from 'recharts';
import { motion } from 'framer-motion';
import type { PairMatrix } from '@/lib/lottery-utils';
interface NetworkVizProps {
  num: number;
  pair: PairMatrix;
}
const NEON_COLORS = {
  pink: '#FF2972',
  cyan: '#00FFE1',
  orange: '#FFB84D',
};
const NetworkViz: React.FC<NetworkVizProps> = ({ num, pair }) => {
  const { nodes, edges } = useMemo(() => {
    if (!pair || !pair[num]) return { nodes: [], edges: [] };
    const connectedPairs = Object.entries(pair[num])
      .map(([pairNum, count]) => ({
        num: parseInt(pairNum),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const nodeSet = new Set([num, ...connectedPairs.map(p => p.num)]);
    const nodeList = Array.from(nodeSet);
    const nodes = nodeList.map((n, i) => {
      const angle = (i / nodeList.length) * 2 * Math.PI;
      const radius = n === num ? 0 : 100;
      return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        z: pair[num]?.[n] || 5, // Size based on connection strength
        num: n,
        isCenter: n === num,
      };
    });
    const centerNode = nodes.find(n => n.isCenter);
    if (!centerNode) return { nodes: [], edges: [] };
    const edges = nodes
      .filter(n => !n.isCenter)
      .map(n => ({
        x1: centerNode.x,
        y1: centerNode.y,
        x2: n.x,
        y2: n.y,
        strength: pair[num]?.[n] || 1,
      }));
    return { nodes, edges };
  }, [num, pair]);
  if (nodes.length === 0) {
    return <div className="center h-64 text-muted-foreground">No significant pair data to display.</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ width: '100%', height: 300 }}
    >
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis type="number" dataKey="x" hide domain={[-120, 120]} />
          <YAxis type="number" dataKey="y" hide domain={[-120, 120]} />
          <ZAxis type="number" dataKey="z" range={[100, 500]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
            }}
            formatter={(value, name, props) => {
              if (name === 'z') return [`Connection Strength: ${props.payload.z}`, ''];
              return [props.payload.num, 'Number'];
            }}
            labelFormatter={() => ''}
          />
          {edges.map((edge, i) => (
            <Line
              key={`line-${i}`}
              points={[{ x: edge.x1, y: edge.y1 }, { x: edge.x2, y: edge.y2 }]}
              stroke={NEON_COLORS.cyan}
              strokeWidth={edge.strength}
              opacity={0.3}
              isAnimationActive={false}
            />
          ))}
          <Scatter data={nodes} fill={NEON_COLORS.pink}>
            {nodes.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isCenter ? NEON_COLORS.pink : NEON_COLORS.orange}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
export default React.memo(NetworkViz);