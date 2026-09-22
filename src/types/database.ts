export type Profile = {
  id: string;
  handle: string;
  avatar_url: string | null;
  is_owner: boolean;
  karma: number;
  streak_count: number;
  last_posted_on: string | null;
  created_at: string;
};

export type Board = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type Thread = {
  id: string;
  board_id: string;
  author_id: string | null;
  title: string;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
};

export type ThreadWithMomentum = Thread & {
  board_slug: string;
  board_name: string;
  momentum: number;
};

export type Post = {
  id: string;
  thread_id: string;
  board_id: string;
  author_id: string | null;
  display_name: string;
  body: string;
  image_url: string | null;
  vote_score: number;
  created_at: string;
};

export type Vote = {
  post_id: string;
  voter_id: string;
  value: 1 | -1;
  created_at: string;
};

export type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
};

export type Spotlight = {
  id: true;
  image_url: string | null;
  caption: string | null;
  updated_at: string;
};
