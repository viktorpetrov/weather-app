interface ChartCardProps {
  date: string;
  hour: number;
  runHour: number;
  imageUrl: string;
  onClick: () => void;
}

export default function ChartCard({ date, hour, runHour, imageUrl, onClick }: ChartCardProps) {
  const validTimeUtc = (runHour + hour) % 24;
  // Brussels is UTC+1 (CET) or UTC+2 (CEST). Approximate: CEST from last Sun in Mar to last Sun in Oct.
  const utcDate = new Date(date + "T00:00:00Z");
  utcDate.setUTCHours(validTimeUtc);
  const brusselsOffset = isCEST(utcDate) ? 2 : 1;
  const brusselsHour = (validTimeUtc + brusselsOffset) % 24;
  const timeLabel = `${String(brusselsHour).padStart(2, "0")}:00`;

  const dayDate = new Date(date + "T12:00:00Z");
  const dayOfWeek = dayDate.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const dayLabel = dayDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className={`rounded-lg overflow-hidden border hover:border-blue-500 transition-colors cursor-pointer shadow-sm ${
        isWeekend
          ? "bg-green-50 border-green-200"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="p-2 text-sm text-gray-600 flex justify-between">
        <span className="font-medium text-gray-800">{dayLabel} {timeLabel}</span>
        <span className="text-gray-400">+{hour}h</span>
      </div>
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: "100%" }}>
        <img
          src={imageUrl}
          alt={`Forecast for ${date}`}
          className="absolute inset-0 w-[250%] h-[250%]"
          style={{ objectFit: "cover", objectPosition: "52% 15%" }}
          loading="lazy"
        />
      </div>
    </button>
  );
}

function isCEST(date: Date): boolean {
  const year = date.getUTCFullYear();
  const marchLast = lastSunday(year, 2);
  const octLast = lastSunday(year, 9);
  // CEST starts last Sunday of March at 01:00 UTC, ends last Sunday of Oct at 01:00 UTC
  const cestStart = new Date(Date.UTC(year, 2, marchLast, 1));
  const cestEnd = new Date(Date.UTC(year, 9, octLast, 1));
  return date >= cestStart && date < cestEnd;
}

function lastSunday(year: number, month: number): number {
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  return lastDay.getUTCDate() - lastDay.getUTCDay();
}
