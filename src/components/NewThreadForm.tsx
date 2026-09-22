"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NewThreadForm({ boardId }: { boardId: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setPending(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("セッションの準備中です。数秒待ってからもう一度お試しください。");
      setPending(false);
      return;
    }

    const { data: thread, error: threadError } = await supabase
      .from("threads")
      .insert({ board_id: boardId, author_id: user.id, title: title.trim() })
      .select()
      .single();

    if (threadError || !thread) {
      setError(threadError?.message ?? "スレッドの作成に失敗しました");
      setPending(false);
      return;
    }

    const { error: postError } = await supabase.from("posts").insert({
      thread_id: thread.id,
      board_id: boardId,
      author_id: user.id,
      body: body.trim(),
    });

    if (postError) {
      setError(postError.message);
      setPending(false);
      return;
    }

    router.push(`/thread/${thread.id}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="スレッドタイトル"
        maxLength={100}
        className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="最初のレス"
        rows={2}
        maxLength={2000}
        className="resize-none rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending || !title.trim() || !body.trim()}
        className="self-end rounded-lg bg-sky-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "作成中..." : "スレを立てる"}
      </button>
    </form>
  );
}
