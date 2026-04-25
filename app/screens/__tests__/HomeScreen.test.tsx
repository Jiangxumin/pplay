import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from '../HomeScreen';
import { ServerProvider } from '../../context/ServerContext';

// usePlaybackState is implemented in Task 10; mock it here
jest.mock('../../hooks/usePlaybackState', () => ({
  usePlaybackState: () => ({ lastEpisodeId: null, saveProgress: jest.fn() }),
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
  expect(await findByText('重试')).toBeTruthy();
});

it('shows empty state when manifest series is empty', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.1:8080');
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ series: [] }) });
  const { findByText } = wrap(<HomeScreen navigation={nav} route={route} />);
  expect(await findByText('暂无视频')).toBeTruthy();
});
