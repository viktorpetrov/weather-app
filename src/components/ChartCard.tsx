interface ChartCardProps {
  date: string;
  hour: number;
  runHour: number;
  imageUrl: string;
  onClick: () => void;
}

export default function ChartCard({ date, hour, runHour, imageUrl, onClick }: ChartCardProps) {
  const validTimeUtc = (runHour + hour) % 24;
  const timeLabel = `${String(validTimeUtc).padStart(2, "0")}:00 UTC`;

  const dayLabel = new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer shadow-sm"
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
