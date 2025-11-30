export type Distribution = { labels: string[]; values: number[] };
export type AgeIncome = { ages: number[]; incomes: number[] };

export type PredictionStats = {
  meanIncome: number;
  medianIncome: number;
  minIncome: number;
  maxIncome: number;
  totalUsers: number;
};

export type Metrics = {
  incomeDistribution: Distribution;
  genderDistribution: Distribution;
  cityDistribution: Distribution;
  ageVsIncome: AgeIncome;
  predictionStats: PredictionStats;
};

export function reservoirSample<T>(arr: T[], k: number) {
  if (arr.length <= k) return arr.slice();
  const reservoir = arr.slice(0, k);
  for (let i = k; i < arr.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    if (j < k) reservoir[j] = arr[i];
  }
  return reservoir;
}

export const formatNumber = (n: number) => {
  if (!isFinite(n)) return String(n);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(Math.round(n));
};

export function setupCanvas(canvas: HTMLCanvasElement | null, width: number, height: number) {
  if (!canvas) return null;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

export const CHART_COLORS = ['#ef4444', '#dc2626', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1'];

