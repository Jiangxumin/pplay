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
