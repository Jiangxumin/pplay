import React from 'react';
import { TouchableOpacity, Image, Text, View, StyleSheet } from 'react-native';
import type { Series } from '../types';

interface Props {
  series: Series;
  baseURL: string;
  lastEpisodeId: string | null;
  onPress: () => void;
  testID?: string;
}

export default function SeriesCard({ series, baseURL, lastEpisodeId, onPress, testID }: Props) {
  const progressText = lastEpisodeId
    ? `看到: ${series.episodes.find(e => e.id === lastEpisodeId)?.title ?? lastEpisodeId}`
    : '未开始';

  return (
    <TouchableOpacity testID={testID} onPress={onPress} style={styles.card} activeOpacity={0.8}>
      <Image
        source={{ uri: `${baseURL}/${series.cover}` }}
        style={styles.cover}
        resizeMode="cover"
      />
      <Text style={styles.title} numberOfLines={2}>{series.title}</Text>
      <Text style={styles.progress}>{progressText}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#1c1c1e', marginBottom: 4 },
  cover: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#2c2c2e' },
  title: { color: '#fff', fontSize: 13, fontWeight: '600', paddingHorizontal: 6, paddingTop: 4 },
  progress: { color: '#8e8e93', fontSize: 11, paddingHorizontal: 6, paddingBottom: 6 },
});
