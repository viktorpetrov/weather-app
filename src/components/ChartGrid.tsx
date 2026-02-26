import { useState } from "react";
import { useCharts } from "../hooks/useCharts";
import ChartCard from "./ChartCard";
import Lightbox from "./Lightbox";

interface ChartGridProps {
  model: "gfs" | "ecmwf";
}

export default function ChartGrid({ model }: ChartGridProps) {
  const { data, loading, error, retry } = useCharts(model);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="text-gray-400 text-center py-12">Loading charts...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Charts unavailable: {error}</p>
        <button
          onClick={retry}
          className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.charts.length === 0) {
    return (
      <div className="text-gray-400 text-center py-12">No charts available</div>
    );
  }

  return (
    <>
      <p className="text-gray-500 text-sm mb-4">
        Run: {data.run} — {data.charts.length} forecast days
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.charts.map((chart) => (
          <ChartCard
            key={chart.hour}
            date={chart.date}
            hour={chart.hour}
            imageUrl={chart.imageUrl}
            onClick={() => setLightboxUrl(chart.imageUrl)}
          />
        ))}
      </div>
      {lightboxUrl && (
        <Lightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </>
  );
}
