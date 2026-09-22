# addictive board

中毒性のある次世代掲示板アプリ。5ch的な匿名スレッド、Reddit的な板/投票、リアルタイム性、ゲーミフィケーションを組み合わせた個人開発の長期プロジェクト。

## 機能

- **板 (boards) / スレッド (threads) / レス (posts)** の3階層構造
- **匿名投稿**: 訪問者は自動で匿名認証され、ハンドルネームだけで参加できる
- **勢いランキング**: レスの投稿速度から算出した「勢い」スコアでスレッドをソート（板ごと・全体）
- **リアルタイム更新**: 新着レス・投票・karmaの変化がSupabase Realtimeで即座に反映
- **閲覧中人数表示**: Presence機能でスレッドを今見ている人数を表示
- **投票 (いいね/よくないね)**: レスへの投票でkarma（人気度）が変動
- **ゲーミフィケーション**: karma蓄積、連続投稿ストリーク、バッジ（初投稿・人気者・常連・夜型）
- **常時ピン留め投稿**: サイト・板の一番上に常に表示される運営（オーナー）の画像付き投稿

## 技術スタック

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Supabase](https://supabase.com)（認証・PostgreSQL・Realtime・Storage）
- Tailwind CSS / Framer Motion

## セットアップ

### 1. Supabaseプロジェクトを作成

1. [supabase.com](https://supabase.com) でプロジェクトを新規作成
2. `Authentication > Providers` で **Anonymous Sign-ins** を有効化
3. SQL Editorで `supabase/migrations/` 内のファイルを **番号順に** 実行
   - `0001_init.sql` → `0002_realtime.sql` → `0003_gamification.sql`
4. `Storage` で `spotlight` 用のパブリックバケットを作成し、自分の写真をアップロード
5. SQL Editorで以下を実行し、ピン留め画像とオーナー権限を設定
   ```sql
   update spotlight set image_url = 'アップロードした画像のURL', caption = 'ひとこと';
   -- 自分の匿名/ログインユーザーのidをownerに設定（auth.usersのidを確認して置き換え）
   update profiles set is_owner = true where id = '自分のuser id';
   ```

### 2. 環境変数

```bash
cp .env.local.example .env.local
```

`.env.local` にSupabaseの `Project URL` と `anon key` を設定する。

### 3. 起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開く。

## ディレクトリ構成

```
src/
  app/            # ページ (ホーム / 板 / スレッド)
  components/     # UIコンポーネント（Spotlight, ThreadRoom, PostItem, UserBadge など）
  lib/supabase/   # Supabaseクライアント (ブラウザ/サーバー)
  proxy.ts        # 匿名認証セッションの自動発行
  types/          # DB型定義
supabase/migrations/  # SQLマイグレーション
```

## 今後の展望

- アルゴリズムによるおすすめフィード
- 画像投稿対応（Supabase Storage連携）
- 通知機能（自分のレスに返信が来たら通知）
- ユーザープロフィールページ・バッジ一覧
