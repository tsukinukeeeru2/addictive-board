import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Spotlight } from "@/components/Spotlight";
import { ThreadListItem } from "@/components/ThreadListItem";
import { NewThreadForm } from "@/components/NewThreadForm";
import type { ThreadWithMomentum } from "@/types/database";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: board } = await supabase
    .from("boards")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!board) notFound();

  const { data: threads } = await supabase
    .from("threads_with_momentum")
    .select("*")
    .eq("board_id", board.id)
    .order("momentum", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <Spotlight />

      <div>
        <h1 className="text-xl font-bold text-neutral-50">{board.name}</h1>
        {board.description && (
          <p className="mt-1 text-sm text-neutral-500">{board.description}</p>
        )}
      </div>

      <NewThreadForm boardId={board.id} />

      <div className="flex flex-col gap-2">
        {threads?.map((thread, i) => (
          <ThreadListItem
            key={thread.id}
            thread={thread as ThreadWithMomentum}
            rank={i + 1}
          />
        ))}
        {threads?.length === 0 && (
          <p className="text-sm text-neutral-500">
            まだスレッドがありません。最初のスレを立ててみましょう。
          </p>
        )}
      </div>
    </div>
  );
}
