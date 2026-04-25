import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ServerProvider } from '../../context/ServerContext';
import { useSeriesList } from '../useSeriesList';

const MANIFEST = {
  series: [
    { id: 's1', title: 'Show S1', cover: 's1/cover.jpg',
      episodes: [{ id: 'ep01', title: '第 01 集', file: 's1/ep01.mp4' }] },
  ],
};

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ServerProvider, null, children);

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockReset();
  (AsyncStorage.getItem as jest.Mock).mockReset();
});

it('returns empty series and no error when baseURL is empty', () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
  const { result } = renderHook(() => useSeriesList(), { wrapper });
  expect(result.current.loading).toBe(false);
  expect(result.current.series).toHaveLength(0);
  expect(result.current.error).toBeNull();
});

it('fetches and returns series when baseURL is set', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.1:8080');
  (global.fetch as jest.Mock).mockResolvedValueOnce({ json: async () => MANIFEST });
  const { result } = renderHook(() => useSeriesList(), { wrapper });
  await waitFor(() => expect(result.current.series).toHaveLength(1));
  expect(result.current.series[0].id).toBe('s1');
});

it('sets error on fetch failure', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.1:8080');
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
  const { result } = renderHook(() => useSeriesList(), { wrapper });
  await waitFor(() => expect(result.current.error).toBe('无法连接服务器'));
  expect(result.current.series).toHaveLength(0);
});

it('returns empty array when manifest series is empty', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.1:8080');
  (global.fetch as jest.Mock).mockResolvedValueOnce({ json: async () => ({ series: [] }) });
  const { result } = renderHook(() => useSeriesList(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.series).toHaveLength(0);
  expect(result.current.error).toBeNull();
});
