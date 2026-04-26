import React, { useCallback } from 'react';
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import type { Episode } from '../types';

interface Props {
  episodes: Episode[];
  currentEpisodeId: string;
  onSelect: (episode: Episode) => void;
}

function EpisodeSidebar({ episodes, currentEpisodeId, onSelect }: Props) {
  const renderItem = useCallback(({ item }: { item: Episode }) => {
    const active = item.id === currentEpisodeId;
    return (
      <TouchableOpacity
        testID={`episode-${item.id}-${active ? 'active' : 'inactive'}`}
        style={[styles.item, active && styles.activeItem]}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.itemText, active && styles.activeText]} numberOfLines={2}>
          {active ? '▶ ' : ''}{item.title}
        </Text>
      </TouchableOpacity>
    );
  }, [currentEpisodeId, onSelect]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>选集</Text>
      <FlatList
        data={episodes}
        keyExtractor={(ep, index) => `${ep.id}-${index}`}
        renderItem={renderItem}
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
  item: { padding: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2c2c2e' },
  activeItem: { backgroundColor: '#0a2540' },
  itemText: { color: '#8e8e93', fontSize: 12 },
  activeText: { color: '#0a84ff', fontWeight: '600' },
  emptyText: { color: '#636366', fontSize: 12, textAlign: 'center', marginTop: 20 },
});
