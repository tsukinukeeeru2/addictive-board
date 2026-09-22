"use client";

import { useEffect, useState } from "react";
import { Flame, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Badge, Profile } from "@/types/database";

export function UserBadge() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [toast, setToast] = useState<Badge | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;
    let badgeChannel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);

      profileChannel = supabase
        .channel(`profile-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${user.id}`,
          },
          (payload) => setProfile(payload.new as Profile),
        )
        .subscribe();

      // 新しいバッジを獲得したら通知トーストを出す（中毒性の演出）
      badgeChannel = supabase
        .channel(`badges-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "profile_badges",
            filter: `profile_id=eq.${user.id}`,
          },
          async (payload) => {
            const { data: badge } = await supabase
              .from("badges")
              .select("*")
              .eq("id", payload.new.badge_id)
              .single();
            if (badge) {
              setToast(badge);
              setTimeout(() => setToast(null), 3500);
            }
          },
        )
        .subscribe();
    }

    load();
    return () => {
      if (profileChannel) supabase.removeChannel(profileChannel);
      if (badgeChannel) supabase.removeChannel(badgeChannel);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-400/50 bg-neutral-900 px-4 py-2 text-sm text-amber-300 shadow-xl"
          >
            <span className="text-lg">{toast.icon}</span>
            バッジ獲得: {toast.name}
          </motion.div>
        )}
      </AnimatePresence>

      {profile && (
        <div className="flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-xs text-neutral-300">
          <span className="font-medium text-neutral-100">{profile.handle}</span>
          <span className="flex items-center gap-1 text-amber-400">
            <Sparkles size={12} />
            {profile.karma}
          </span>
          {profile.streak_count > 0 && (
            <span className="flex items-center gap-1 text-orange-400">
              <Flame size={12} />
              {profile.streak_count}日
            </span>
          )}
        </div>
      )}
    </>
  );
}
