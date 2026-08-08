import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlayerScreen from '../PlayerScreen';
import { ServerProvider } from '../../context/ServerContext';
import type { Series } from '../../types';

// Notched device: 44dp top inset (status bar + punch-hole camera).
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

// Portrait phone so the portrait branch renders.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 390, height: 844 }),
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

beforeEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockReset();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
});

it('pushes the portrait video below the top notch (paddingTop = safeTop)', () => {
  const { getByTestId } = render(
    <NavigationContainer>
      <ServerProvider>
        <PlayerScreen navigation={nav} route={route} />
      </ServerProvider>
    </NavigationContainer>,
  );
  const style = flattenStyle(getByTestId('player-portrait').props.style);
  expect(style.paddingTop).toBe(44);
});
