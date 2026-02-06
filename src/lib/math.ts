import type uPlot from "uplot";
import type { CropGroup, Model } from "./models.ts";
import { type Dataset, datasetsByName } from "./datasets.ts";

export type ModelPlot = {
  xs: number[];
  series: uPlot.Series[];
  data: number[][];
  q: number;
};

export type DatasetPlot = {
  xs: number[];
  ys: number[];
  n: number;
};

export type DatasetImport = {
  label: string;
  group: CropGroup;
  g: number;
  cropKeys: string[];
  json: unknown;
};

// binomial tail CDF
//
// explained by GPT:
// n = number of Bernoulli trials (ticks / attempts), not a count of "time" per se.
// q = per-trial success probability (per tick stage-up chance).
// k = success threshold (required stage-ups).
export function p100ByTick(n: number, q: number, k: number): number {
  if (k <= 0) return 1;
  if (n < k || q <= 0) return 0;
  if (q >= 1) return 1;

  const omq = 1 - q;

  if (k === 1) return 1 - Math.pow(omq, n);
  if (k === 2) {
    const p0 = Math.pow(omq, n);
    const p1 = n * q * Math.pow(omq, n - 1);
    return 1 - (p0 + p1);
  }

  let p = Math.pow(omq, n); // pmf(0)
  let s = p;
  const ratio = q / omq;

  for (let i = 0; i < k - 1; i++) {
    p *= ((n - i) / (i + 1)) * ratio;
    s += p;
  }

  return 1 - s;
}

function buildStepXs(maxTick: number, step: number): number[] {
  const xs: number[] = [];
  for (let t = 0; t <= maxTick; t += step) {
    xs.push(t);
  }
  return xs;
}

function unionSorted(a: number[], b: number[]): number[] {
  const set = new Set<number>();

  for (const x of a) {
    set.add(x);
  }

  for (const x of b) {
    set.add(x);
  }

  return Array.from(set).sort((x, y) => x - y);
}

function interpolateOnto(unionXs: number[], xs: number[], ys: number[]): number[] {
  const out = new Array<number>(unionXs.length).fill(0);
  const n = xs.length;

  if (n === 0) return out;

  const xMin = xs[0];
  const xMax = xs[n - 1];

  let j = 0; // points into empirical xs/ys

  for (let i = 0; i < unionXs.length; i++) {
    const x = unionXs[i];

    if (x < xMin) {
      continue;
    } else if (x >= xMax) {
      out[i] = 100.0;
    }

    while (j + 1 < n && xs[j + 1] < x) {
      j += 1;
    }

    // exact hit
    if (xs[j] === x) {
      out[i] = ys[j];
      continue;
    }

    // between j and j+1
    if (j + 1 < n) {
      const x0 = xs[j], y0 = ys[j];
      const x1 = xs[j + 1], y1 = ys[j + 1];
      const t = (x - x0) / (x1 - x0);
      out[i] = y0 + (y1 - y0) * t;
    }
  }

  return out;
}

function maxTick(group: CropGroup): number {
  switch (group) {
    case "WHEAT_POTATO_CARROT":
      return 25000;
    case "WART":
      return 25000;
    case "COCOA":
      return 40000;
    case "CANE":
      return 34000;
    case "CACTUS":
      return 38000;
    case "MELON_PUMPKIN":
      return 40000;
    case "MUSHROOM":
      return 26000;
    case "SUNFLOWER_ROSE":
      return 25000;
  }
}

export function modelToPlot(
  S: number,
  R: number,
  G: number,
  model: Model,
  overlays: { label: string; series: DatasetPlot; stroke?: string; dash?: number[] }[] = [],
): ModelPlot {
  const step = 10;
  const max = maxTick(model.group);

  // shared xs = union(model grid, overlay xs...)
  let xs = buildStepXs(max, step);
  for (const o of overlays) xs = unionSorted(xs, o.series.xs);

  // model params
  const k = model.K;
  const pStage = model.P;

  const g = model.group === "CANE" || model.group === "CACTUS" ? 0 : G;

  // model q
  const pTickBase = 1 - Math.pow(1 - 1 / S, R);
  const q = pTickBase * pStage * (100 + g) / 100;

  // build uPlot data arrays
  const yModel = xs.map((t) => p100ByTick(t, q, k) * 100);
  const data: number[][] = [xs, yModel];

  for (const o of overlays) {
    data.push(interpolateOnto(xs, o.series.xs, o.series.ys));
  }

  const palette = [
    "#e056fd",
    "#2ecc71",
    "#ff9f43",
    "#feca57",
    "#48dbfb",
    "#ff6b6b",
    "#a29bfe",
  ];

  const series: uPlot.Series[] = [
    { label: "T" },
    {
      label: `predicted`,
      stroke: "#4aa3ff",
      width: 4,
    },
  ];

  for (let i = 0; i < overlays.length; i++) {
    const o = overlays[i];
    series.push({
      label: o.label,
      stroke: o.stroke ?? palette[i % palette.length],
      width: 3,
      alpha: 1,
      spanGaps: true,
      dash: [8, 4],
    });
  }

  return { xs, series, data, q };
}

export function datasetToPlot(dataset: Dataset): { label: string; xs: number[]; ys: number[]; n: number } {
  const json = datasetsByName[dataset.name];

  const cropKeysByGroup: Record<Dataset["group"], string[]> = {
    WHEAT_POTATO_CARROT: ["WHEAT", "POTATO", "CARROT"],
    WART: ["WART"],
    COCOA: ["COCOA"],
    CANE: ["CANE"],
    CACTUS: ["CACTUS"],
    MELON_PUMPKIN: ["MELON", "PUMPKIN"],
    MUSHROOM: ["MUSHROOM"],
    SUNFLOWER_ROSE: ["SUNFLOWER", "WILD_ROSE"],
  };

  const keys = cropKeysByGroup[dataset.group];
  const map = json as Record<string, unknown>;

  let array: unknown[] = [];
  for (const key of keys) {
    const value = map[key];
    if (Array.isArray(value) && value.length > 0) {
      array = value;
      break;
    }
  }

  const times = array as number[];
  times.sort((a, b) => a - b);

  const xs: number[] = [];
  const ys: number[] = [];
  const N = times.length;

  let i = 0;
  while (i < N) {
    const t = times[i];
    let j = i + 1;

    while (j < N && times[j] === t) {
      j += 1;
    }

    xs.push(t);
    ys.push((j / N) * 100);
    i = j;
  }

  return { label: dataset.name, xs, ys, n: N };
}

// per-game-tick probability that a given block is selected at least once by random ticks
function pSelectPerTick(S: number, R: number): number {
  if (S <= 0) return 0;
  if (R <= 0) return 0;
  return -Math.expm1(R * Math.log1p(-1 / S));
}

// (selected for random tick) * (conditional stage-up chance) * (growth bonus multiplier)
function qPerTick(S: number, R: number, G: number, P: number): number {
  const sel = pSelectPerTick(S, R);
  const gMul = (100 + G) / 100;
  const q = sel * P * gMul;
  return q <= 0 ? 0 : q >= 1 ? 1 : q;
}

// given target percentile (0..100), return the minimum ticks needed to reach it.
export function ticksForPercentile(
  S: number,
  R: number,
  G: number,
  K: number,
  P: number,
  targetPct: number,
): number {
  const target = targetPct / 100;

  if (target <= 0) return 0;
  if (K <= 0) return 0;

  const q = qPerTick(S, R, G, P);

  if (q <= 0) return Infinity;
  if (q >= 1) return K;
  if (target >= 1) return Infinity;

  let lo = 0;
  let hi = Math.max(K, 1);

  const MAX_TICK = 1_000_000_000;

  while (hi <= MAX_TICK && p100ByTick(hi, q, K) < target) {
    lo = hi;
    hi *= 2;
  }

  if (hi > MAX_TICK) {
    return Infinity;
  }

  while (lo + 1 < hi) {
    const mid = (lo + hi) >>> 1;
    if (p100ByTick(mid, q, K) >= target) hi = mid;
    else lo = mid;
  }

  return hi;
}

// given ticks, return the percentile regrown by then (0..100)
export function percentileByTicks(
  S: number,
  R: number,
  G: number,
  K: number,
  P: number,
  ticks: number,
): number {
  const q = qPerTick(S, R, G, P);
  const n = ticks <= 0 ? 0 : Math.floor(ticks);
  return p100ByTick(n, q, K) * 100;
}
