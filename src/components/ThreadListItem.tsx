import Link from "next/link";
import { Flame, MessageCircle } from "lucide-react";
import { relativeTime } from "@/lib/format";
import type { ThreadWithMomentum } from "@/types/database";

export function ThreadListItem({
  thread,
  rank,
}: {
  thread: ThreadWithMomentum;
  rank: number;
}) {
  const isHot = thread.momentum > 5;

  return (
    <Link
      href={`/thread/${thread.id}`}
      className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 transition hover:border-neutral-600 hover:bg-neutral-900"
    >
      <span className="w-6 shrink-0 text-center text-sm font-bold text-neutral-500">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isHot && <Flame size={14} className="shrink-0 text-orange-500" />}
          <p className="truncate font-medium text-neutral-100">{thread.title}</p>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">
          {thread.board_name} ・ {relativeTime(thread.last_activity_at)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-sm text-neutral-400">
        <MessageCircle size={14} />
        {thread.reply_count}
      </div>
    </Link>
  );
}
