import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import VideoPlayer from '../VideoPlayer';

it('renders back button', () => {
  const { getByTestId } = render(
    <VideoPlayer uri="http://server/ep01.mp4" onBack={jest.fn()} />
  );
  expect(getByTestId('back-button')).toBeTruthy();
});

it('calls onBack when back button pressed', () => {
  const onBack = jest.fn();
  const { getByTestId } = render(<VideoPlayer uri="http://server/ep01.mp4" onBack={onBack} />);
  fireEvent.press(getByTestId('back-button'));
  expect(onBack).toHaveBeenCalled();
});

it('renders play/pause button in controls', () => {
  const { getByTestId } = render(
    <VideoPlayer uri="http://server/ep01.mp4" onBack={jest.fn()} />
  );
  expect(getByTestId('play-pause-button')).toBeTruthy();
});

it('shows error message when uri is empty', () => {
  const { getByText } = render(<VideoPlayer uri="" onBack={jest.fn()} />);
  expect(getByText('无法播放视频')).toBeTruthy();
});
