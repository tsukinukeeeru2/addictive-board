import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Spotlight } from "@/components/Spotlight";
import { ThreadListItem } from "@/components/ThreadListItem";
import type { ThreadWithMomentum } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: boards }, { data: trending }] = await Promise.all([
    supabase.from("boards").select("*").order("sort_order"),
    supabase
      .from("threads_with_momentum")
      .select("*")
      .order("momentum", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <Spotlight />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-400">板一覧</h2>
        <div className="flex flex-wrap gap-2">
          {boards?.map((board) => (
            <Link
              key={board.id}
              href={`/b/${board.slug}`}
              className="rounded-full border border-neutral-800 bg-neutral-900/60 px-4 py-1.5 text-sm text-neutral-200 transition hover:border-neutral-600 hover:bg-neutral-900"
            >
              {board.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-1 text-sm font-semibold text-neutral-400">
          🔥 今の勢いランキング
        </h2>
        <div className="flex flex-col gap-2">
          {trending?.map((thread, i) => (
            <ThreadListItem
              key={thread.id}
              thread={thread as ThreadWithMomentum}
              rank={i + 1}
            />
          ))}
          {trending?.length === 0 && (
            <p className="text-sm text-neutral-500">
              まだスレッドがありません。最初の一投稿を。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
