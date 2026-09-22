"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { PostItem } from "./PostItem";
import type { Post } from "@/types/database";

export function ThreadRoom({
  threadId,
  boardId,
  initialPosts,
}: {
  threadId: string;
  boardId: string;
  initialPosts: Post[];
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [voteMap, setVoteMap] = useState<Record<string, 1 | -1>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(1);
  const [reply, setReply] = useState("");
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: votes } = await supabase
        .from("votes")
        .select("post_id, value")
        .eq("voter_id", user.id);
      if (votes) {
        const map: Record<string, 1 | -1> = {};
        votes.forEach((v) => (map[v.post_id] = v.value as 1 | -1));
        setVoteMap(map);
      }

      // 新着レスをリアルタイムで受信
      const postsChannel = supabase
        .channel(`thread-posts-${threadId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "posts",
            filter: `thread_id=eq.${threadId}`,
          },
          (payload) => {
            setPosts((prev) => {
              if (prev.some((p) => p.id === payload.new.id)) return prev;
              return [...prev, payload.new as Post];
            });
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "posts",
            filter: `thread_id=eq.${threadId}`,
          },
          (payload) => {
            setPosts((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Post) : p)),
            );
          },
        )
        .subscribe();

      // 今このスレッドを見ている人数
      const presenceChannel = supabase.channel(`thread-presence-${threadId}`, {
        config: { presence: { key: user.id } },
      });
      presenceChannel
        .on("presence", { event: "sync" }, () => {
          const state = presenceChannel.presenceState();
          setViewerCount(Math.max(1, Object.keys(state).length));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await presenceChannel.track({ online_at: new Date().toISOString() });
          }
        });

      return () => {
        supabase.removeChannel(postsChannel);
        supabase.removeChannel(presenceChannel);
      };
    }

    const cleanupPromise = init();
    return () => {
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [posts.length]);

  async function handleVote(postId: string, value: 1 | -1) {
    if (!userId) return;
    const supabase = createClient();
    const current = voteMap[postId];

    if (current === value) {
      setVoteMap((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      await supabase.from("votes").delete().eq("post_id", postId).eq("voter_id", userId);
    } else {
      setVoteMap((prev) => ({ ...prev, [postId]: value }));
      await supabase
        .from("votes")
        .upsert({ post_id: postId, voter_id: userId, value });
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !userId) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.from("posts").insert({
      thread_id: threadId,
      board_id: boardId,
      author_id: userId,
      body: reply.trim(),
    });
    if (!error) setReply("");
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1 self-end text-xs text-neutral-500">
        <Eye size={13} />
        {viewerCount}人が閲覧中
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {posts.map((post, i) => (
            <PostItem
              key={post.id}
              post={post}
              index={i}
              myVote={voteMap[post.id]}
              onVote={(value) => handleVote(post.id, value)}
            />
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleReply}
        className="sticky bottom-0 flex gap-2 rounded-xl border border-neutral-800 bg-neutral-950/95 p-2 backdrop-blur"
      >
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="レスを書き込む"
          maxLength={2000}
          className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !reply.trim()}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          送信
        </button>
      </form>
    </div>
  );
}
