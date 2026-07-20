"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/useSession";
import { useAuthModal } from "@/lib/AuthModalContext";
import { isInWatchlist, addToWatchlist, removeFromWatchlist, getWatchlist } from "@/lib/watchlist";
import { getUserTier } from "@/lib/subscription";

const FREE_WATCHLIST_LIMIT = 5;

export default function WatchStar({ ticker, type }) {
  const { user } = useSession();
  const { openAuthModal } = useAuthModal();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [limitError, setLimitError] = useState(false);

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
    setLimitError(false);
    try {
      if (active) {
        await removeFromWatchlist(user.id, ticker);
        setActive(false);
      } else {
        const tier = await getUserTier(user.id);
        if (tier === "free") {
          const current = await getWatchlist(user.id);
          if (current.length >= FREE_WATCHLIST_LIMIT) {
            setLimitError(true);
            setLoading(false);
            return;
          }
        }
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
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
      <button
        className={`watch-star${active ? " active" : ""}`}
        type="button"
        onClick={handleClick}
        disabled={loading}
        title={active ? "Watchlist-ээс хасах" : "Watchlist-д нэмэх"}
      >
        {active ? "★" : "☆"}
      </button>
      {limitError && (
        <span className="watch-star-limit-error">
          Free багц {FREE_WATCHLIST_LIMIT} хvртэл л зөвшөөрдөг.{" "}
          <a href="/pricing">Багц харах</a>
        </span>
      )}
    </span>
  );
}
