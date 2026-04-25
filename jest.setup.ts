import '@testing-library/jest-native/extend-expect';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn((_source: unknown, setup?: (p: any) => void) => {
    const player = {
      play: jest.fn(),
      pause: jest.fn(),
      playing: false,
      currentTime: 0,
      duration: 0,
      seekBy: jest.fn(),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      enterFullscreen: jest.fn(),
    };
    setup?.(player);
    return player;
  }),
}));
