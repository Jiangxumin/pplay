import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SeriesCard from '../SeriesCard';
import type { Series } from '../../types';

const series: Series = {
  id: 'nb-s1',
  title: 'Number Blocks S1',
  cover: 'nb-s1/cover.jpg',
  episodes: [
    { id: 'ep01', title: '第 01 集', file: 'nb-s1/ep01.mp4' },
    { id: 'ep02', title: '第 02 集', file: 'nb-s1/ep02.mp4' },
  ],
};

it('renders series title', () => {
  const { getByText } = render(
    <SeriesCard series={series} baseURL="http://server:8080" lastEpisodeId={null} onPress={() => {}} />
  );
  expect(getByText('Number Blocks S1')).toBeTruthy();
});

it('shows 未开始 when no progress', () => {
  const { getByText } = render(
    <SeriesCard series={series} baseURL="http://server:8080" lastEpisodeId={null} onPress={() => {}} />
  );
  expect(getByText('未开始')).toBeTruthy();
});

it('shows episode title as progress hint when lastEpisodeId is set', () => {
  const { getByText } = render(
    <SeriesCard series={series} baseURL="http://server:8080" lastEpisodeId="ep02" onPress={() => {}} />
  );
  expect(getByText('看到: 第 02 集')).toBeTruthy();
});

it('calls onPress when tapped', () => {
  const onPress = jest.fn();
  const { getByTestId } = render(
    <SeriesCard series={series} baseURL="http://server:8080" lastEpisodeId={null} onPress={onPress} testID="card" />
  );
  fireEvent.press(getByTestId('card'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('falls back to raw id when lastEpisodeId is not in episodes', () => {
  const { getByText } = render(
    <SeriesCard series={series} baseURL="http://server:8080" lastEpisodeId="ep99" onPress={() => {}} />
  );
  expect(getByText('看到: ep99')).toBeTruthy();
});
