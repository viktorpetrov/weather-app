interface ChartCardProps {
  date: string;
  hour: number;
  imageUrl: string;
  onClick: () => void;
}

export default function ChartCard({ date, hour, imageUrl, onClick }: ChartCardProps) {
  const dayLabel = new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-colors cursor-pointer"
    >
      <div className="p-2 text-sm text-gray-300 flex justify-between">
        <span className="font-medium">{dayLabel}</span>
        <span className="text-gray-500">+{hour}h</span>
      </div>
      <img
        src={imageUrl}
        alt={`Forecast for ${date}`}
        className="w-full"
        loading="lazy"
      />
    </button>
  );
}
