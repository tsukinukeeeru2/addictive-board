-- ゲーミフィケーション: 投稿ストリーク・バッジ付与

create function award_badge(p_profile uuid, p_slug text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into profile_badges (profile_id, badge_id)
  select p_profile, id from badges where slug = p_slug
  on conflict do nothing;
end;
$$;

create function check_milestone_badges(p_profile uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  p profiles;
begin
  select * into p from profiles where id = p_profile;
  if p.karma >= 100 then
    perform award_badge(p_profile, 'karma_100');
  end if;
  if p.streak_count >= 7 then
    perform award_badge(p_profile, 'streak_7');
  end if;
end;
$$;

-- レス投稿のたびにストリークを更新し、初投稿/夜型バッジを判定する
create function handle_post_gamification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Tokyo')::date;
  jst_hour int := extract(hour from (now() at time zone 'Asia/Tokyo'));
  post_count int;
begin
  if new.author_id is null then
    return new;
  end if;

  update profiles
    set streak_count = case
          when last_posted_on = today then streak_count
          when last_posted_on = today - 1 then streak_count + 1
          else 1
        end,
        last_posted_on = today
    where id = new.author_id;

  select count(*) into post_count from posts where author_id = new.author_id;
  if post_count = 1 then
    perform award_badge(new.author_id, 'first_post');
  end if;

  if jst_hour between 0 and 4 then
    perform award_badge(new.author_id, 'night_owl');
  end if;

  perform check_milestone_badges(new.author_id);

  return new;
end;
$$;

create trigger on_post_gamification
  after insert on posts
  for each row execute procedure handle_post_gamification();

-- karmaが変化するたびにマイルストーンバッジを判定する
create function handle_karma_gamification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.karma <> old.karma then
    perform check_milestone_badges(new.id);
  end if;
  return new;
end;
$$;

create trigger on_karma_change
  after update on profiles
  for each row execute procedure handle_karma_gamification();
