import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (seriesId: string) => `@last_episode_${seriesId}`;

interface UsePlaybackStateResult {
  lastEpisodeId: string | null;
  saveProgress: (episodeId: string) => Promise<void>;
}

export function usePlaybackState(seriesId: string): UsePlaybackStateResult {
  const [lastEpisodeId, setLastEpisodeId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(storageKey(seriesId)).then(v => {
      if (v) setLastEpisodeId(v);
    });
  }, [seriesId]);

  const saveProgress = useCallback(async (episodeId: string) => {
    setLastEpisodeId(episodeId);
    await AsyncStorage.setItem(storageKey(seriesId), episodeId);
  }, [seriesId]);

  return { lastEpisodeId, saveProgress };
}
