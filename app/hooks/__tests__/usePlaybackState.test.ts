import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlaybackState } from '../usePlaybackState';

beforeEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockReset();
  (AsyncStorage.setItem as jest.Mock).mockReset();
});

it('returns null initially', () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
  const { result } = renderHook(() => usePlaybackState('nb-s1'));
  expect(result.current.lastEpisodeId).toBeNull();
});

it('loads persisted episode ID from AsyncStorage', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('ep03');
  const { result } = renderHook(() => usePlaybackState('nb-s1'));
  await act(async () => { await Promise.resolve(); });
  expect(result.current.lastEpisodeId).toBe('ep03');
});

it('saveProgress updates state and writes to AsyncStorage', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
  const { result } = renderHook(() => usePlaybackState('nb-s1'));
  await act(async () => { await result.current.saveProgress('ep05'); });
  expect(result.current.lastEpisodeId).toBe('ep05');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('@last_episode_nb-s1', 'ep05');
});

it('handles getItem rejection gracefully', async () => {
  (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('storage error'));
  const { result } = renderHook(() => usePlaybackState('nb-s1'));
  await act(async () => { await Promise.resolve(); });
  expect(result.current.lastEpisodeId).toBeNull();
});

it('rolls back state if setItem rejects', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('ep01');
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
  const { result } = renderHook(() => usePlaybackState('nb-s1'));
  await act(async () => { await Promise.resolve(); }); // load ep01
  expect(result.current.lastEpisodeId).toBe('ep01');
  await act(async () => {
    await result.current.saveProgress('ep05');
  });
  expect(result.current.lastEpisodeId).toBe('ep01'); // rolled back
});

it('ignores stale getItem if seriesId changes before it resolves', async () => {
  let resolveFirst!: (v: string | null) => void;
  (AsyncStorage.getItem as jest.Mock)
    .mockImplementationOnce(() => new Promise(r => { resolveFirst = r; }))
    .mockResolvedValueOnce('ep-series-b');

  const { result, rerender } = renderHook(
    ({ id }: { id: string }) => usePlaybackState(id),
    { initialProps: { id: 'series-a' } }
  );

  rerender({ id: 'series-b' });
  await act(async () => { await Promise.resolve(); }); // flush series-b load

  // Now let the stale series-a promise resolve
  await act(async () => { resolveFirst('ep-series-a-stale'); });

  expect(result.current.lastEpisodeId).toBe('ep-series-b'); // not stale
});
