import '@testing-library/jest-native/extend-expect';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockPlayer = () => ({
  play: jest.fn(),
  pause: jest.fn(),
  playing: false,
  currentTime: 0,
  duration: 0,
  seekBy: jest.fn(),
  replace: jest.fn(),
  replaceAsync: jest.fn().mockResolvedValue(undefined),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  enterFullscreen: jest.fn(),
  exitFullscreen: jest.fn(),
});

jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  createVideoPlayer: jest.fn((_source: unknown) => mockPlayer()),
  useVideoPlayer: jest.fn((_source: unknown, setup?: (p: any) => void) => {
    const player = mockPlayer();
    setup?.(player);
    return player;
  }),
}));
