import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
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
  (AsyncStorage.getItem as jest.Mock)
    .mockResolvedValueOnce('http://192.168.1.1:8080')
    .mockResolvedValue('http://192.168.1.1:8080');
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => MANIFEST })
    .mockResolvedValueOnce({ ok: true, json: async () => MANIFEST });
  const { result } = renderHook(() => useSeriesList(), { wrapper });
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.series).toHaveLength(1);
  });
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
  (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ series: [] }) });
  const { result } = renderHook(() => useSeriesList(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.series).toHaveLength(0);
  expect(result.current.error).toBeNull();
});

it('sets error on non-200 HTTP response', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.1:8080');
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: async () => ({ error: 'not found' }),
  });
  const { result } = renderHook(() => useSeriesList(), { wrapper });
  await waitFor(() => expect(result.current.error).toBe('无法连接服务器'));
  expect(result.current.series).toHaveLength(0);
});

it('refetch triggers a second fetch', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.1:8080');
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ series: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => MANIFEST });
  const { result } = renderHook(() => useSeriesList(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.series).toHaveLength(0);
  act(() => result.current.refetch());
  await waitFor(() => expect(result.current.series).toHaveLength(1));
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

it('cache-busts the manifest URL so repeated fetches are never stale', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('http://192.168.1.1:8080');
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ series: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ series: [] }) });
  // Make Date.now() return a fresh value each call so the two fetches get
  // distinct cache-bust params (deterministic; avoids same-ms collisions).
  let t = 1_000_000;
  const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => (t += 1000));
  const { result } = renderHook(() => useSeriesList(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => result.current.refetch());
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  dateSpy.mockRestore();
  const urls = (global.fetch as jest.Mock).mock.calls.map((c: unknown[]) => c[0] as string);
  expect(urls[0]).toMatch(/\/manifest\.json\?t=\d+$/);
  expect(urls[1]).toMatch(/\/manifest\.json\?t=\d+$/);
  expect(urls[0]).not.toBe(urls[1]); // distinct URLs → defeats URL-keyed caching
});
