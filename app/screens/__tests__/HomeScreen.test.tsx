import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from '../HomeScreen';
import { ServerProvider } from '../../context/ServerContext';
import { stopLittleEars } from '../../utils/littleEars';

// usePlaybackState is implemented in Task 10; mock it here
jest.mock('../../hooks/usePlaybackState', () => ({
  usePlaybackState: () => ({ lastEpisodeId: null, saveProgress: jest.fn() }),
}));

jest.mock('../../utils/littleEars', () => ({
  stopLittleEars: jest.fn().mockResolvedValue(undefined),
}));

const MANIFEST = {
  series: [
    { id: 'nb-s1', title: 'Number Blocks S1', cover: 'nb-s1/cover.jpg',
      episodes: [{ id: 'ep01', title: '第 01 集', file: 'nb-s1/ep01.mp4' }] },
  ],
};

const nav = { navigate: jest.fn() } as any;
const route = {} as any;

const wrap = (ui: React.ReactElement) =>
  render(<NavigationContainer><ServerProvider>{ui}</ServerProvider></NavigationContainer>);

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockReset();
  (AsyncStorage.getItem as jest.Mock).mockReset();
  (stopLittleEars as jest.Mock).mockClear();
});

it('shows setup prompt when no server IP is configured', () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
  const { getByText } = wrap(<HomeScreen navigation={nav} route={route} />);
  expect(getByText(/请先设置服务器地址/)).toBeTruthy();
});

it('shows series card when manifest loads successfully', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.1:8080');
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => MANIFEST });
  const { findByText } = wrap(<HomeScreen navigation={nav} route={route} />);
  expect(await findByText('Number Blocks S1')).toBeTruthy();
});

it('shows error and retry button on fetch failure', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.1:8080');
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('fail'));
  const { findByText } = wrap(<HomeScreen navigation={nav} route={route} />);
  expect(await findByText(/无法连接服务器/)).toBeTruthy();
  const retryBtn = await findByText('重试');
  expect(retryBtn).toBeTruthy();
  // Press retry — verify a second fetch attempt is made
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => MANIFEST });
  fireEvent.press(retryBtn);
  expect(await findByText('Number Blocks S1')).toBeTruthy();
});

it('shows empty state when manifest series is empty', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.1:8080');
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ series: [] }) });
  const { findByText } = wrap(<HomeScreen navigation={nav} route={route} />);
  expect(await findByText('暂无视频')).toBeTruthy();
});

it('refetches the manifest when the app returns to the foreground', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.1:8080');
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => MANIFEST });

  const changeHandlers: Array<(state: string) => void> = [];
  const addSpy = jest.spyOn(AppState, 'addEventListener').mockImplementation(
    (event: any, handler: any) => {
      if (event === 'change') changeHandlers.push(handler);
      return { remove: jest.fn() } as any;
    },
  );

  const { unmount } = wrap(<HomeScreen navigation={nav} route={route} />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1)); // initial load

  // Simulate the app coming back to the foreground (regained focus / lock-unlock).
  act(() => {
    changeHandlers.forEach(h => h('active'));
  });
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2)); // initial + foreground refresh
  expect(stopLittleEars).toHaveBeenCalledWith('http://192.168.1.1:8080'); // stop LittleEars on foreground

  unmount();
  addSpy.mockRestore();
});

it('stops LittleEars on cold start when already active (no change event)', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.1:8080');
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => MANIFEST });
  // App launched directly into the foreground: AppState is 'active' with no 'change'.
  const orig = AppState.currentState;
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true, writable: true });
  try {
    wrap(<HomeScreen navigation={nav} route={route} />);
    await waitFor(() => expect(stopLittleEars).toHaveBeenCalledWith('http://192.168.1.1:8080'));
  } finally {
    Object.defineProperty(AppState, 'currentState', { value: orig, configurable: true, writable: true });
  }
});
