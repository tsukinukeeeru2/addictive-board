import Link from "next/link";
import { UserBadge } from "./UserBadge";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-neutral-50">
          🔥 addictive board
        </Link>
        <UserBadge />
      </div>
    </header>
  );
}
