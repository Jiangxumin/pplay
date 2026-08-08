import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlayerScreen from '../PlayerScreen';
import { ServerProvider } from '../../context/ServerContext';
import type { Series } from '../../types';

// All insets nonzero so we can tell which sides each orientation applies.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 11, right: 22 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mutable so one file can exercise both the portrait and landscape branches.
const mockDims = { width: 390, height: 844 };
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockDims,
}));

const series: Series = {
  id: 's1',
  title: 'S1',
  cover: 's1/cover.jpg',
  episodes: [{ id: 'ep01', title: '第 01 集', file: 's1/ep01.mp4' }],
};
const nav = { goBack: jest.fn() } as any;
const route = { params: { series } } as any;

/** Flatten RN style arrays/objects into a single object for assertion. */
function flattenStyle(style: unknown): Record<string, number | string> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, number | string>>(
      (acc, s) => ({ ...acc, ...((s || {}) as Record<string, number | string>) }),
      {},
    );
  }
  return (style as Record<string, number | string>) ?? {};
}

function renderScreen() {
  return render(
    <NavigationContainer>
      <ServerProvider>
        <PlayerScreen navigation={nav} route={route} />
      </ServerProvider>
    </NavigationContainer>,
  );
}

beforeEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockReset();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  mockDims.width = 390;
  mockDims.height = 844;
});

it('portrait: applies top + bottom insets (notch above, gesture nav below)', () => {
  const { getByTestId } = renderScreen();
  const style = flattenStyle(getByTestId('player-portrait').props.style);
  expect(style.paddingTop).toBe(44);
  expect(style.paddingBottom).toBe(34);
});

it('landscape: applies all four insets (side cutout + status/gesture bars)', () => {
  mockDims.width = 844;
  mockDims.height = 390;
  const { getByTestId } = renderScreen();
  const style = flattenStyle(getByTestId('player-landscape').props.style);
  expect(style.paddingTop).toBe(44);
  expect(style.paddingBottom).toBe(34);
  expect(style.paddingLeft).toBe(11);
  expect(style.paddingRight).toBe(22);
});
