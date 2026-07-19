"use client";
import { useEffect, useState } from "react";
import { useSession } from "./useSession";
import { getUserTier } from "./subscription";

export function useSubscription() {
  const { user } = useSession();
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setTier("free");
      setLoading(false);
      return;
    }
    setLoading(true);
    getUserTier(user.id).then((t) => {
      if (!cancelled) {
        setTier(t);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { tier, loading };
}
