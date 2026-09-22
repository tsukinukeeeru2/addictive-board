import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

// サイトの一番上に必ず表示されるオーナーのピン留め投稿。
// スレッドの勢いランキングとは無関係に、常にこのカードがトップに来る。
export async function Spotlight() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("spotlight")
    .select("image_url, caption")
    .single();

  if (!data?.image_url) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-400/10 via-fuchsia-500/10 to-sky-500/10 p-4 shadow-lg">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-black">
          PINNED
        </span>
        <span className="text-xs text-neutral-400">運営より</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={data.image_url}
            alt="運営の投稿"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        {data.caption && (
          <p className="text-sm text-neutral-200">{data.caption}</p>
        )}
      </div>
    </div>
  );
}
