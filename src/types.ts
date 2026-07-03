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
