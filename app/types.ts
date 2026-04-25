export interface Episode {
  id: string;
  title: string;
  file: string; // relative path: "series-id/ep01.mp4"
}

export interface Series {
  id: string;
  title: string;
  cover: string; // relative path: "series-id/cover.jpg"
  episodes: Episode[];
}

export interface Manifest {
  series: Series[];
}
