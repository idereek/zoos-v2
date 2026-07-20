"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/useSession";
import { useAuthModal } from "@/lib/AuthModalContext";
import { isInWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/watchlist";

export default function WatchStar({ ticker, type }) {
  const { user } = useSession();
  const { openAuthModal } = useAuthModal();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setActive(false);
      return;
    }
    isInWatchlist(user.id, ticker)
      .then((result) => {
        if (!cancelled) setActive(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, ticker]);

  async function handleClick() {
    if (!user) {
      openAuthModal("login");
      return;
    }
    setLoading(true);
    try {
      if (active) {
        await removeFromWatchlist(user.id, ticker);
        setActive(false);
      } else {
        await addToWatchlist(user.id, ticker, type);
        setActive(true);
      }
    } catch (err) {
      console.error("WatchStar error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={`watch-star${active ? " active" : ""}`}
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={active ? "Watchlist-ээс хасах" : "Watchlist-д нэмэх"}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
