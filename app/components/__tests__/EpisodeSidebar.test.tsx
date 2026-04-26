import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EpisodeSidebar from '../EpisodeSidebar';
import type { Episode } from '../../types';

const episodes: Episode[] = [
  { id: 'ep01', title: '第 01 集', file: 'show/ep01.mp4' },
  { id: 'ep02', title: '第 02 集', file: 'show/ep02.mp4' },
  { id: 'ep03', title: '第 03 集', file: 'show/ep03.mp4' },
];

it('renders all episode titles', () => {
  const { queryByText } = render(
    <EpisodeSidebar episodes={episodes} currentEpisodeId="ep01" onSelect={() => {}} />
  );
  // Current episode has "▶ " prefix, so search for that
  expect(queryByText(/▶ 第 01 集/)).toBeTruthy();
  // Inactive episodes don't have prefix
  expect(queryByText('第 02 集')).toBeTruthy();
  expect(queryByText('第 03 集')).toBeTruthy();
});

it('marks current episode as active', () => {
  const { getByTestId } = render(
    <EpisodeSidebar episodes={episodes} currentEpisodeId="ep02" onSelect={() => {}} />
  );
  expect(getByTestId('episode-ep02-active')).toBeTruthy();
  expect(getByTestId('episode-ep01-inactive')).toBeTruthy();
});

it('calls onSelect with the tapped episode', () => {
  const onSelect = jest.fn();
  const { getByText } = render(
    <EpisodeSidebar episodes={episodes} currentEpisodeId="ep01" onSelect={onSelect} />
  );
  fireEvent.press(getByText('第 03 集'));
  expect(onSelect).toHaveBeenCalledWith(episodes[2]);
});

it('shows empty state when episodes list is empty', () => {
  const { getByText } = render(
    <EpisodeSidebar episodes={[]} currentEpisodeId="" onSelect={() => {}} />
  );
  expect(getByText('暂无选集')).toBeTruthy();
});
