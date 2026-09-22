import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThreadRoom } from "@/components/ThreadRoom";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("threads")
    .select("*, boards(slug, name)")
    .eq("id", id)
    .single();

  if (!thread) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  const board = thread.boards as unknown as { slug: string; name: string };

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/b/${board.slug}`}
        className="text-xs text-neutral-500 hover:text-neutral-300"
      >
        ← {board.name}
      </Link>
      <h1 className="text-lg font-bold text-neutral-50">{thread.title}</h1>

      <ThreadRoom
        threadId={thread.id}
        boardId={thread.board_id}
        initialPosts={posts ?? []}
      />
    </div>
  );
}
