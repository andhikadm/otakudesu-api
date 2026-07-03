export interface AnimeCard {
  title: string;
  slug: string;
  url: string;
  image_url: string | null;
  episode?: string | null;
  release_day?: string | null;
  release_date?: string | null;
  total_episodes?: string | null;
  score?: string | null;
  completed_date?: string | null;
}

export interface LinkItem {
  title: string;
  slug: string;
  url: string;
}

export interface ScheduleGroup {
  day: string;
  anime: LinkItem[];
}

export interface SearchResult {
  title: string;
  slug: string;
  url: string;
  type: "anime" | "episode" | "unknown";
  episode: number | null;
  status: string | null;
  rating: string | null;
}

export interface DownloadLink {
  provider: string;
  url: string;
}

export interface DownloadQuality {
  quality: string;
  size: string | null;
  links: DownloadLink[];
}

export interface EpisodeListItem extends LinkItem {
  episode: number | null;
  date: string | null;
}

export interface AnimeDetail {
  title: string;
  slug: string;
  url: string;
  image_url: string | null;
  japanese: string | null;
  score: string | null;
  producer: string | null;
  type: string | null;
  status: string | null;
  total_episodes: string | null;
  duration: string | null;
  release_date: string | null;
  studio: string | null;
  genres: LinkItem[];
  synopsis: string;
  batch: EpisodeListItem | null;
  complete_download: EpisodeListItem | null;
  episodes: EpisodeListItem[];
}

export interface StreamMirror {
  quality: string;
  providers: Array<{
    name: string;
    data_content: string | null;
    is_default: boolean;
  }>;
}

export interface EpisodeDetail {
  title: string;
  slug: string;
  url: string;
  episode: number | null;
  anime: LinkItem | null;
  stream_url: string | null;
  mirrors: StreamMirror[];
  downloads: DownloadQuality[];
  episode_selector: EpisodeListItem[];
  previous_episode: EpisodeListItem | null;
  next_episode: EpisodeListItem | null;
  all_episodes: EpisodeListItem | null;
}

export interface BatchDetail {
  title: string;
  slug: string;
  url: string;
  anime: LinkItem | null;
  image_url: string | null;
  metadata: Record<string, string>;
  downloads: DownloadQuality[];
}

export interface CompleteDownloadEpisode {
  episode: number | null;
  title: string;
  is_final: boolean;
  downloads: DownloadQuality[];
}

export interface CompleteDownloadsDetail {
  title: string;
  slug: string;
  url: string;
  anime: LinkItem | null;
  metadata: Record<string, string>;
  episodes: CompleteDownloadEpisode[];
  batch: DownloadQuality[];
}
