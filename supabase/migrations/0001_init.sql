-- addictive-board: initial schema
-- 匿名スレッド（5ch的）＋ 板/投票（Reddit的）＋ 勢いランキング ＋ ゲーミフィケーション ＋ オーナー写真の常時ピン留め

create extension if not exists "pgcrypto";

-- ============================================================
-- profiles: Supabase Auth の匿名サインインも含めた全ユーザーの人格
-- ============================================================
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null default ('名無しさん' || substr(md5(random()::text), 1, 4)),
  avatar_url text,
  is_owner boolean not null default false,
  karma int not null default 0,
  streak_count int not null default 0,
  last_posted_on date,
  created_at timestamptz not null default now()
);

-- 新規ユーザー（匿名含む）が auth.users に作られたら profiles を自動作成
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- boards: 板（カテゴリ）
-- ============================================================
create table boards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- threads: スレッド
-- ============================================================
create table threads (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards (id) on delete cascade,
  author_id uuid references profiles (id) on delete set null,
  title text not null,
  reply_count int not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index threads_board_activity_idx on threads (board_id, last_activity_at desc);

-- ============================================================
-- posts: レス（スレッド内の投稿）
-- ============================================================
create table posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads (id) on delete cascade,
  board_id uuid not null references boards (id) on delete cascade,
  author_id uuid references profiles (id) on delete set null,
  display_name text not null default '名無しさん',
  body text not null check (char_length(body) between 1 and 2000),
  image_url text,
  vote_score int not null default 0,
  created_at timestamptz not null default now()
);

create index posts_thread_created_idx on posts (thread_id, created_at asc);

-- レス投稿時にスレッドの reply_count / last_activity_at を更新
create function bump_thread_on_post()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update threads
    set reply_count = reply_count + 1,
        last_activity_at = new.created_at
    where id = new.thread_id;
  return new;
end;
$$;

create trigger on_post_created
  after insert on posts
  for each row execute procedure bump_thread_on_post();

-- ============================================================
-- votes: レスへの投票（いいね/よくないね）。匿名プロフィール単位で1票
-- ============================================================
create table votes (
  post_id uuid not null references posts (id) on delete cascade,
  voter_id uuid not null references profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, voter_id)
);

create function apply_vote_delta()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_post uuid;
  delta int;
  author uuid;
begin
  if tg_op = 'INSERT' then
    target_post := new.post_id;
    delta := new.value;
  elsif tg_op = 'DELETE' then
    target_post := old.post_id;
    delta := -old.value;
  else
    target_post := new.post_id;
    delta := new.value - old.value;
  end if;

  update posts set vote_score = vote_score + delta
    where id = target_post
    returning author_id into author;

  if author is not null then
    update profiles set karma = karma + delta where id = author;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger on_vote_change
  after insert or update or delete on votes
  for each row execute procedure apply_vote_delta();

-- ============================================================
-- badges: ゲーミフィケーション用の称号
-- ============================================================
create table badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text not null
);

create table profile_badges (
  profile_id uuid not null references profiles (id) on delete cascade,
  badge_id uuid not null references badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (profile_id, badge_id)
);

insert into badges (slug, name, description, icon) values
  ('first_post', '初投稿', '初めてレスを投稿した', '🎉'),
  ('karma_100', '人気者', 'karmaが100を超えた', '⭐'),
  ('streak_7', '常連', '7日連続で投稿した', '🔥'),
  ('night_owl', '夜型', '深夜0時〜5時に投稿した', '🦉');

-- ============================================================
-- spotlight: 常に一番上に表示されるオーナーのピン留め投稿
-- ============================================================
create table spotlight (
  id boolean primary key default true check (id),
  image_url text,
  caption text,
  updated_at timestamptz not null default now()
);

insert into spotlight (id) values (true);

-- ============================================================
-- 勢いランキング用ビュー（Redditのhotアルゴリズム風の減衰スコア）
-- ============================================================
create view threads_with_momentum as
select
  t.*,
  b.slug as board_slug,
  b.name as board_name,
  (t.reply_count / power(
    extract(epoch from (now() - t.created_at)) / 3600.0 + 2, 1.5
  ))::numeric(12, 4) as momentum
from threads t
join boards b on b.id = t.board_id;

-- ============================================================
-- RLS
-- ============================================================
alter table profiles enable row level security;
alter table boards enable row level security;
alter table threads enable row level security;
alter table posts enable row level security;
alter table votes enable row level security;
alter table badges enable row level security;
alter table profile_badges enable row level security;
alter table spotlight enable row level security;

create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users update own profile" on profiles for update using (auth.uid() = id);

create policy "boards are publicly readable" on boards for select using (true);

create policy "threads are publicly readable" on threads for select using (true);
create policy "authenticated users create threads" on threads for insert with check (auth.uid() = author_id);

create policy "posts are publicly readable" on posts for select using (true);
create policy "authenticated users create posts" on posts for insert with check (auth.uid() = author_id);

create policy "votes are publicly readable" on votes for select using (true);
create policy "users manage own votes" on votes for all
  using (auth.uid() = voter_id)
  with check (auth.uid() = voter_id);

create policy "badges are publicly readable" on badges for select using (true);
create policy "profile_badges are publicly readable" on profile_badges for select using (true);

create policy "spotlight is publicly readable" on spotlight for select using (true);
create policy "only owner updates spotlight" on spotlight for update
  using (exists (select 1 from profiles where id = auth.uid() and is_owner));

-- ============================================================
-- 初期データ（板）
-- ============================================================
insert into boards (slug, name, description, sort_order) values
  ('general', '雑談', 'なんでも話す板', 0),
  ('news', 'ニュース', '気になるニュースを共有', 1),
  ('hobby', '趣味', '趣味の話題', 2);
