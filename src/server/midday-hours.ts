type Model = "gfs" | "ecmwf";

const GFS_MAX_HOUR = 240;
const ECMWF_STEPS = [0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240];

export function getMiddayForecastHours(model: Model, runHourUtc: number): number[] {
  if (model === "ecmwf") {
    return ECMWF_STEPS;
  }

  const firstMiddayOffset = (12 - runHourUtc + 24) % 24;
  const hours: number[] = [];
  for (let h = firstMiddayOffset; h <= GFS_MAX_HOUR; h += 24) {
    hours.push(h);
  }
  return hours;
}
