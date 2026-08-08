import { useState, useEffect, useCallback } from 'react';
import { useServer } from '../context/ServerContext';
import type { Series, Manifest } from '../types';

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
    if (!baseURL) {
      setSeries([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Cache-bust with a timestamp so repeated fetches (e.g. on foreground
    // refresh) always hit the network instead of a stale cached response —
    // some Android ROMs (e.g. HarmonyOS) cache GETs by URL.
    fetch(`${baseURL}/manifest.json?t=${Date.now()}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: unknown) => {
        if (!cancelled) {
          const manifest = data as Manifest;
          setSeries(Array.isArray(manifest?.series) ? manifest.series : []);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.warn('[useSeriesList] fetch failed:', err);
          setError('无法连接服务器');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [baseURL, revision]);

  const refetch = useCallback(() => setRevision(r => r + 1), []);
  return { series, loading, error, refetch };
}
