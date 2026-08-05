// Direction heuristic shared by explore_trends and quick_check: compare the
// average of the most recent quarter of the series against the quarter before.

export interface TrendVerdict {
  direction: "rising" | "falling" | "stable" | "unknown";
  recentAvg: number | null;
  priorAvg: number | null;
  /** Percent change from priorAvg to recentAvg, rounded. Null when undefined. */
  pctChange: number | null;
}

export function trendDirection(values: number[]): TrendVerdict {
  const quarter = Math.max(1, Math.floor(values.length / 4));
  const avg = (arr: number[]) =>
    arr.length === 0 ? null : arr.reduce((a, b) => a + b, 0) / arr.length;
  const recentAvg = avg(values.slice(-quarter));
  const priorAvg = avg(values.slice(-2 * quarter, -quarter));
  if (recentAvg === null || priorAvg === null) {
    return { direction: "unknown", recentAvg, priorAvg, pctChange: null };
  }
  const direction =
    recentAvg > priorAvg * 1.15
      ? "rising"
      : recentAvg < priorAvg * 0.85
        ? "falling"
        : "stable";
  const pctChange =
    priorAvg === 0 ? null : Math.round(((recentAvg - priorAvg) / priorAvg) * 100);
  return { direction, recentAvg, priorAvg, pctChange };
}
