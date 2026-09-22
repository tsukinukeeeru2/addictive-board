"use client";

import { motion } from "framer-motion";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import clsx from "clsx";
import { relativeTime } from "@/lib/format";
import type { Post } from "@/types/database";

export function PostItem({
  post,
  index,
  myVote,
  onVote,
}: {
  post: Post;
  index: number;
  myVote: 1 | -1 | undefined;
  onVote: (value: 1 | -1) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3"
    >
      <div className="flex flex-col items-center gap-0.5 pt-1">
        <button
          onClick={() => onVote(1)}
          aria-label="upvote"
          className={clsx(
            "rounded p-0.5 transition hover:bg-neutral-800",
            myVote === 1 && "text-orange-500",
          )}
        >
          <ArrowBigUp size={18} fill={myVote === 1 ? "currentColor" : "none"} />
        </button>
        <span className="text-xs font-semibold text-neutral-300">
          {post.vote_score}
        </span>
        <button
          onClick={() => onVote(-1)}
          aria-label="downvote"
          className={clsx(
            "rounded p-0.5 transition hover:bg-neutral-800",
            myVote === -1 && "text-sky-500",
          )}
        >
          <ArrowBigDown size={18} fill={myVote === -1 ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 text-xs text-neutral-500">
          <span className="font-medium text-neutral-300">#{index + 1}</span>
          <span>{post.display_name}</span>
          <span>{relativeTime(post.created_at)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-100">
          {post.body}
        </p>
      </div>
    </motion.div>
  );
}
