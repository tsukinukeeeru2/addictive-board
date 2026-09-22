-- Realtime配信を有効化（新着レス・投票・karma更新をリアルタイムに反映するため）
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table threads;
alter publication supabase_realtime add table profile_badges;
