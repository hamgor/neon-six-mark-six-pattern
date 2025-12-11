export interface DemoItem {
  id: string;
  name: string;
  value: number;
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface Weights {
  freq: number;
  recency: number;
  pair: number;
  overdue: number;
  lastdigit: number;
  range: number;
  parity: number;
  sumrange: number;
}
export interface Preset {
  id: string;
  name: string;
  weights: Weights;
}