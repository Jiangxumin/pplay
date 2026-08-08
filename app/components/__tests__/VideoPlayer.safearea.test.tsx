import React from 'react';
import { render } from '@testing-library/react-native';

// Override the global (zero-inset) mock from jest.setup with a notched device:
// a 44dp status bar/cutout at top, gesture-nav inset at bottom, and an 11dp
// cutout on the left edge (as happens in landscape).
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 11, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

import VideoPlayer from '../VideoPlayer';

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

it('offsets back button left edge clear of a side cutout (top handled by PlayerScreen)', () => {
  const { getByTestId } = render(
    <VideoPlayer uri="http://server/ep01.mp4" onBack={jest.fn()} />,
  );
  const style = flattenStyle(getByTestId('back-button').props.style);
  // Top is a constant — the screen container owns the top/notch offset, so the
  // button must NOT add safeTop again (that would double-count).
  expect(style.top).toBe(12);
  // Left edge still avoids a side cutout (e.g. landscape with camera on left).
  expect(style.left).toBe(23); // 12 + 11
});
