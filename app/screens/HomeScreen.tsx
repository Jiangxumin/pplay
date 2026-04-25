import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  useWindowDimensions, StyleSheet, SafeAreaView,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Series } from '../types';
import { useServer } from '../context/ServerContext';
import { useSeriesList } from '../hooks/useSeriesList';
import { usePlaybackState } from '../hooks/usePlaybackState';
import SeriesCard from '../components/SeriesCard';
import SettingsModal from '../components/SettingsModal';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

function numColumns(width: number): number {
  if (width > 900) return 4;
  if (width > 600) return 3;
  return 2;
}

function CardWithProgress({ series, baseURL, onPress }: {
  series: Series; baseURL: string; onPress: () => void;
}) {
  const { lastEpisodeId } = usePlaybackState(series.id);
  return (
    <SeriesCard series={series} baseURL={baseURL} lastEpisodeId={lastEpisodeId} onPress={onPress} />
  );
}

export default function HomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const cols = numColumns(width);
  const { baseURL } = useServer();
  const { series, loading, error, refetch } = useSeriesList();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const renderItem = useCallback(({ item }: { item: Series }) => (
    <View style={{ flex: 1, padding: 6 }}>
      <CardWithProgress
        series={item}
        baseURL={baseURL}
        onPress={() => navigation.navigate('Player', { series: item })}
      />
    </View>
  ), [baseURL, navigation]);

  const renderBody = () => {
    if (!baseURL) return (
      <View style={styles.center}>
        <Text style={styles.hint}>请先设置服务器地址</Text>
        <Text style={styles.hintSub}>点击右上角 ⚙️ 进行设置</Text>
      </View>
    );
    if (loading) return (
      <View style={styles.center}><Text style={styles.hint}>加载中…</Text></View>
    );
    if (error) return (
      <View style={styles.center}>
        <Text style={styles.hint}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
    if (series.length === 0) return (
      <View style={styles.center}><Text style={styles.hint}>暂无视频</Text></View>
    );
    return (
      <FlatList
        data={series}
        keyExtractor={item => item.id}
        numColumns={cols}
        key={cols}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎬 PPlay</Text>
        <TouchableOpacity onPress={() => setSettingsVisible(true)}>
          <Text style={styles.gear}>⚙️</Text>
        </TouchableOpacity>
      </View>
      {renderBody()}
      <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  gear: { fontSize: 22 },
  grid: { padding: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hint: { color: '#8e8e93', fontSize: 16, textAlign: 'center' },
  hintSub: { color: '#636366', fontSize: 13 },
  retryBtn: { backgroundColor: '#0a84ff', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
});
