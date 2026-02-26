import { useState, useEffect } from "react";

interface ChartEntry {
  hour: number;
  date: string;
  imageUrl: string;
}

interface ChartData {
  model: string;
  run: string;
  charts: ChartEntry[];
}

interface UseChartsResult {
  data: ChartData | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useCharts(model: "gfs" | "ecmwf"): UseChartsResult {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/charts/${model}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [model, retryCount]);

  return { data, loading, error, retry: () => setRetryCount((c) => c + 1) };
}
