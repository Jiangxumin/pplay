import React, { useCallback } from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Episode } from '../types';
import { useServer } from '../context/ServerContext';
import { usePlaybackState } from '../hooks/usePlaybackState';
import VideoPlayer from '../components/VideoPlayer';
import EpisodeSidebar from '../components/EpisodeSidebar';

type Props = StackScreenProps<RootStackParamList, 'Player'>;

export default function PlayerScreen({ route, navigation }: Props) {
  const { series } = route.params;
  const { baseURL } = useServer();
  const { lastEpisodeId, saveProgress } = usePlaybackState(series.id);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const currentEpisodeId = lastEpisodeId ?? series.episodes[0]?.id ?? '';
  const currentEpisode = series.episodes.find(e => e.id === currentEpisodeId) ?? series.episodes[0];
  const videoUri = currentEpisode ? `${baseURL}/${currentEpisode.file}` : '';

  const handleSelectEpisode = useCallback(async (episode: Episode) => {
    await saveProgress(episode.id);
  }, [saveProgress]);

  const handleBack = useCallback(async () => {
    await saveProgress(currentEpisodeId);
    navigation.goBack();
  }, [saveProgress, currentEpisodeId, navigation]);

  if (isLandscape) {
    return (
      <View style={styles.landscape}>
        <View style={styles.videoArea}>
          <VideoPlayer uri={videoUri} onBack={handleBack} />
        </View>
        <View style={styles.sidebar}>
          <EpisodeSidebar
            episodes={series.episodes}
            currentEpisodeId={currentEpisodeId}
            onSelect={handleSelectEpisode}
          />
        </View>
      </View>
    );
  }

  // Portrait: video top (16:9), sidebar below
  return (
    <View style={styles.portrait}>
      <View style={styles.videoAreaPortrait}>
        <VideoPlayer uri={videoUri} onBack={handleBack} />
      </View>
      <View style={styles.sidebarPortrait}>
        <EpisodeSidebar
          episodes={series.episodes}
          currentEpisodeId={currentEpisodeId}
          onSelect={handleSelectEpisode}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  landscape: { flex: 1, flexDirection: 'row', backgroundColor: '#000' },
  videoArea: { flex: 3 },
  sidebar: { flex: 1 },
  portrait: { flex: 1, flexDirection: 'column', backgroundColor: '#000' },
  videoAreaPortrait: { width: '100%', aspectRatio: 16 / 9 },
  sidebarPortrait: { flex: 1 },
});
