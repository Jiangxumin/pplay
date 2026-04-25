import { useState, useEffect, useCallback } from 'react';
import { useServer } from '../context/ServerContext';
import type { Series } from '../types';

interface UseSeriesListResult {
  series: Series[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSeriesList(): UseSeriesListResult {
  const { baseURL } = useServer();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!baseURL) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${baseURL}/manifest.json`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setSeries(data.series ?? []); })
      .catch(() => { if (!cancelled) setError('无法连接服务器'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [baseURL, revision]);

  const refetch = useCallback(() => setRevision(r => r + 1), []);
  return { series, loading, error, refetch };
}
