import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlayerScreen from '../PlayerScreen';
import { ServerProvider } from '../../context/ServerContext';
import type { Series } from '../../types';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 390, height: 844 }), // portrait phone
}));

const series: Series = {
  id: 'nb-s1',
  title: 'Number Blocks S1',
  cover: 'nb-s1/cover.jpg',
  episodes: [
    { id: 'ep01', title: '第 01 集', file: 'nb-s1/ep01.mp4' },
    { id: 'ep02', title: '第 02 集', file: 'nb-s1/ep02.mp4' },
  ],
};

const nav = { goBack: jest.fn() } as any;
const route = { params: { series } } as any;

const wrap = (ui: React.ReactElement) =>
  render(<NavigationContainer><ServerProvider>{ui}</ServerProvider></NavigationContainer>);

beforeEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockReset();
  // ServerContext also calls AsyncStorage.getItem for @server_ip key
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
});

it('renders all episode titles in sidebar', () => {
  const { getByText } = wrap(<PlayerScreen navigation={nav} route={route} />);
  expect(getByText('第 01 集', { exact: false })).toBeTruthy();
  expect(getByText('第 02 集', { exact: false })).toBeTruthy();
});

it('defaults to first episode when no progress saved', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
  const { findByTestId } = wrap(<PlayerScreen navigation={nav} route={route} />);
  expect(await findByTestId('episode-ep01-active')).toBeTruthy();
});

it('resumes from last saved episode', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('ep02');
  const { findByTestId } = wrap(<PlayerScreen navigation={nav} route={route} />);
  expect(await findByTestId('episode-ep02-active')).toBeTruthy();
});

it('saves progress when episode selected in sidebar', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
  const { getByText } = wrap(<PlayerScreen navigation={nav} route={route} />);
  await act(async () => { fireEvent.press(getByText('第 02 集')); });
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('@last_episode_nb-s1', 'ep02');
});

it('saves progress when back button pressed', async () => {
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('ep02');
  const { findByTestId } = wrap(<PlayerScreen navigation={nav} route={route} />);
  await findByTestId('episode-ep02-active'); // wait for state to settle
  await act(async () => { fireEvent.press(await findByTestId('back-button')); });
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('@last_episode_nb-s1', 'ep02');
  expect(nav.goBack).toHaveBeenCalled();
});
