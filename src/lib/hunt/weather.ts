import type { Region, WeatherNormals } from "./types";

/** Typical monthly climate when NASA POWER is unreachable. High/low °F, wind mph, precip inches, RH %. */
const FALLBACK: Record<string, [number, number, number, number, number][]> = {
  // indexed 0 = Jan … 11 = Dec: high, low, wind, precip, rh
  westHigh: [
    [28, 5, 10, 1.4, 55],
    [32, 8, 10, 1.3, 54],
    [40, 16, 11, 1.6, 50],
    [48, 24, 11, 1.8, 48],
    [58, 32, 10, 1.7, 50],
    [69, 40, 9, 1.2, 45],
    [75, 45, 8, 1.6, 48],
    [73, 44, 8, 1.5, 50],
    [65, 36, 8, 1.4, 48],
    [53, 26, 9, 1.3, 50],
    [38, 14, 10, 1.2, 55],
    [29, 6, 10, 1.3, 56],
  ],
  westSage: [
    [32, 10, 12, 0.4, 55],
    [36, 14, 12, 0.4, 52],
    [46, 22, 13, 0.5, 48],
    [55, 28, 13, 0.8, 42],
    [66, 36, 12, 1.2, 40],
    [78, 44, 12, 0.8, 35],
    [88, 52, 11, 0.5, 30],
    [86, 50, 11, 0.4, 30],
    [74, 40, 11, 0.6, 35],
    [60, 30, 12, 0.6, 40],
    [44, 18, 12, 0.4, 50],
    [33, 10, 12, 0.4, 55],
  ],
  midwest: [
    [34, 14, 11, 0.7, 70],
    [39, 18, 11, 0.8, 68],
    [51, 28, 12, 1.6, 64],
    [63, 39, 12, 2.6, 60],
    [73, 50, 11, 4.0, 64],
    [83, 60, 10, 3.8, 66],
    [87, 65, 9, 3.4, 68],
    [85, 63, 9, 3.2, 68],
    [77, 53, 10, 2.6, 66],
    [64, 40, 11, 2.0, 64],
    [49, 28, 11, 1.2, 68],
    [36, 16, 11, 0.8, 72],
  ],
  alaska: [
    [4, -12, 8, 0.6, 70],
    [10, -8, 8, 0.5, 68],
    [24, 2, 9, 0.4, 64],
    [42, 22, 9, 0.4, 58],
    [58, 38, 9, 0.7, 55],
    [68, 48, 8, 1.4, 58],
    [70, 52, 7, 2.0, 65],
    [66, 48, 7, 2.2, 70],
    [55, 38, 8, 1.6, 72],
    [36, 20, 8, 1.0, 74],
    [16, 0, 8, 0.8, 74],
    [6, -10, 8, 0.7, 72],
  ],
};

function bucketFor(region: Region): keyof typeof FALLBACK {
  if (region.theater === "alaska") return "alaska";
  if (region.theater === "midwest") return "midwest";
  if (region.elevFt >= 8000 || /alpine|high|uinta|san juan|snowy/i.test(region.name)) return "westHigh";
  if (/desert|sage|prairie|plains|breaks|book/i.test(region.name)) return "westSage";
  return "westHigh";
}

function windChillF(tempF: number, windMph: number): number {
  if (tempF > 50 || windMph < 3) return tempF;
  const v = Math.pow(windMph, 0.16);
  return 35.74 + 0.6215 * tempF - 35.75 * v + 0.4275 * tempF * v;
}

function round(n: number) {
  return Math.round(n);
}

function hazards(high: number, low: number, wind: number, precip: number, region: Region, month: number): string[] {
  const out: string[] = [];
  const pack = round(windChillF(low - 5, Math.max(wind, 15)));
  if (pack <= 0) out.push("Sub-zero wind chill possible at dawn");
  else if (pack <= 20) out.push("Bitter morning wind chill");
  if (wind >= 12) out.push("Sustained wind");
  if (precip >= 2.5 && month >= 9 && month <= 11) out.push("Wet month — rain or wet snow");
  if (region.elevFt >= 9000 && month >= 9 && month <= 11) out.push("Alpine storms, snow possible any day");
  if (region.theater === "alaska") out.push("Rapid weather swings");
  if (high - low >= 30) out.push("Wide day/night swing");
  if (high >= 75) out.push("Warm afternoons — heat and thermals");
  if (region.theater === "midwest" && month >= 11) out.push("Ice on stands and metal steps");
  if (out.length === 0) out.push("Quiet, typical conditions");
  return out.slice(0, 4);
}

function fromTuple(region: Region, month: number, t: [number, number, number, number, number], source: WeatherNormals["source"]): WeatherNormals {
  const [highF, lowF, windMph, precipIn, rh] = t;
  const feelHighF = round(windChillF(highF, windMph));
  const feelLowF = round(windChillF(lowF, windMph));
  const packForF = round(windChillF(lowF - 8, Math.max(windMph, 18)));
  return {
    source,
    month,
    highF: round(highF),
    lowF: round(lowF),
    windMph: round(windMph),
    precipIn: Math.round(precipIn * 10) / 10,
    rh: round(rh),
    feelHighF,
    feelLowF,
    packForF,
    hazards: hazards(highF, lowF, windMph, precipIn, region, month),
  };
}

export function fallbackWeather(region: Region, month: number): WeatherNormals {
  const table = FALLBACK[bucketFor(region)];
  return fromTuple(region, month, table[month - 1], "fallback");
}

export async function fetchWeather(region: Region, month: number): Promise<WeatherNormals> {
  const fallback = fallbackWeather(region, month);
  const key = `M${String(month).padStart(2, "0")}`;
  const url =
    `https://power.larc.nasa.gov/api/temporal/climatology/point` +
    `?parameters=T2M,T2M_MAX,T2M_MIN,WS2M,PRECTOTCORR,RH2M` +
    `&community=ag&longitude=${region.lon}&latitude=${region.lat}&format=JSON`;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return fallback;
    const json = (await res.json()) as {
      properties?: { parameter?: Record<string, Record<string, number>> };
    };
    const p = json.properties?.parameter;
    if (!p?.T2M_MAX?.[key] || !p?.T2M_MIN?.[key]) return fallback;
    const cToF = (c: number) => (c * 9) / 5 + 32;
    const msToMph = (ms: number) => ms * 2.23694;
    const mmToIn = (mm: number) => mm / 25.4;
    const highF = cToF(p.T2M_MAX[key]);
    const lowF = cToF(p.T2M_MIN[key]);
    const windMph = msToMph(p.WS2M?.[key] ?? 3);
    const precipIn = mmToIn(p.PRECTOTCORR?.[key] ?? 20);
    const rh = p.RH2M?.[key] ?? 55;
    return fromTuple(region, month, [highF, lowF, windMph, precipIn, rh], "nasa-power");
  } catch {
    return fallback;
  }
}

export function realFeelFallback(w: WeatherNormals, region: Region): string {
  const cold = w.feelLowF <= 15;
  const swing = w.highF - w.lowF >= 25;
  const wet = w.precipIn >= 2;
  const alpine = region.elevFt >= 8500;
  if (cold && alpine) return `Dawn feels like ${w.feelLowF}°. Frost, thin air, and a wind that finds any gap in your layers.`;
  if (cold) return `Mornings feel like ${w.feelLowF}°. Quiet cold. Metal bites. You sit still or you suffer.`;
  if (wet) return `Typical month carries ${w.precipIn}" of precip. Wet brush, slick bark, and a shell that has to actually work.`;
  if (swing) return `${w.lowF}° at first light, ${w.highF}° by afternoon. You will overdress the walk if you pack for the sit.`;
  return `Days near ${w.highF}°, nights ${w.lowF}°. Wind makes the low feel like ${w.feelLowF}°.`;
}
