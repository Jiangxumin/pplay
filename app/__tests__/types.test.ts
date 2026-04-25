import type { Episode, Series, Manifest } from '../types';

it('Series shape is correct', () => {
  const ep: Episode = { id: 'ep01', title: '第 01 集', file: 'show/ep01.mp4' };
  const series: Series = { id: 's1', title: 'Show S1', cover: 'show/cover.jpg', episodes: [ep] };
  const manifest: Manifest = { series: [series] };
  expect(manifest.series[0].episodes[0].id).toBe('ep01');
});
