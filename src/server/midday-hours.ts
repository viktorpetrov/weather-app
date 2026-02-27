type Model = "gfs" | "ecmwf";

const MAX_HOURS: Record<Model, number> = {
  gfs: 240,
  ecmwf: 360,
};

export function getMiddayForecastHours(model: Model, runHourUtc: number): number[] {
  const maxHour = MAX_HOURS[model];
  const firstMiddayOffset = (12 - runHourUtc + 24) % 24;
  const hours: number[] = [];
  for (let h = firstMiddayOffset; h <= maxHour; h += 24) {
    hours.push(h);
  }
  return hours;
}
