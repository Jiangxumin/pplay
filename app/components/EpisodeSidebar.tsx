import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import type { Episode } from '../types';

interface Props {
  episodes: Episode[];
  currentEpisodeId: string;
  onSelect: (episode: Episode) => void;
}

const ITEM_HEIGHT = 40;

const getItemLayout = (_: ArrayLike<Episode> | null | undefined, index: number) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});

function EpisodeSidebar({ episodes, currentEpisodeId, onSelect }: Props) {
  const listRef = useRef<FlatList<Episode>>(null);

  useEffect(() => {
    const index = episodes.findIndex(ep => ep.id === currentEpisodeId);
    if (index < 0) return;
    // Defer to ensure FlatList has completed its initial render
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, [currentEpisodeId, episodes]);

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({
        offset: ITEM_HEIGHT * info.index,
        animated: false,
      });
    },
    []
  );

  const renderItem = useCallback(({ item }: { item: Episode }) => {
    const active = item.id === currentEpisodeId;
    return (
      <TouchableOpacity
        testID={`episode-${item.id}-${active ? 'active' : 'inactive'}`}
        style={[styles.item, active && styles.activeItem]}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.itemText, active && styles.activeText]} numberOfLines={1}>
          {active ? '▶ ' : ''}{item.title}
        </Text>
      </TouchableOpacity>
    );
  }, [currentEpisodeId, onSelect]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>选集</Text>
      <FlatList
        ref={listRef}
        data={episodes}
        keyExtractor={(ep, index) => `${ep.id}-${index}`}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        ListEmptyComponent={
          <Text style={styles.emptyText}>暂无选集</Text>
        }
      />
    </View>
  );
}

export default React.memo(EpisodeSidebar);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c1e' },
  header: { color: '#fff', fontWeight: '700', fontSize: 13, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#3a3a3c' },
  item: { padding: 10, height: ITEM_HEIGHT, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2c2c2e' },
  activeItem: { backgroundColor: '#0a2540' },
  itemText: { color: '#8e8e93', fontSize: 12 },
  activeText: { color: '#0a84ff', fontWeight: '600' },
  emptyText: { color: '#636366', fontSize: 12, textAlign: 'center', marginTop: 20 },
});
