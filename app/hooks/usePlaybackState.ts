import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (seriesId: string) => `@last_episode_${seriesId}`;

interface UsePlaybackStateResult {
  lastEpisodeId: string | null;
  saveProgress: (episodeId: string) => Promise<void>;
}

export function usePlaybackState(seriesId: string): UsePlaybackStateResult {
  const [lastEpisodeId, setLastEpisodeId] = useState<string | null>(null);
  const lastEpisodeIdRef = useRef<string | null>(null);
  lastEpisodeIdRef.current = lastEpisodeId; // sync during render — no lag

  useEffect(() => {
    let cancelled = false;
    setLastEpisodeId(null); // reset immediately on seriesId change

    AsyncStorage.getItem(storageKey(seriesId))
      .then(v => {
        if (!cancelled && v) setLastEpisodeId(v);
      })
      .catch(err => {
        if (!cancelled) console.warn('[usePlaybackState] Failed to load progress:', err);
      });

    return () => { cancelled = true; };
  }, [seriesId]);

  const saveProgress = useCallback(async (episodeId: string) => {
    const previous = lastEpisodeIdRef.current;
    setLastEpisodeId(episodeId);
    try {
      await AsyncStorage.setItem(storageKey(seriesId), episodeId);
    } catch (err) {
      setLastEpisodeId(previous); // rollback on failure
      console.warn('[usePlaybackState] Failed to save progress:', err);
    }
  }, [seriesId]);

  return { lastEpisodeId, saveProgress };
}
