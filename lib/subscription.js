import { supabase } from "./supabaseClient";

// Хэрэглэгчийн одоогийн tier-ийг буцаана. Мөр олдоогvй, эсвэл
// idэвхгvй/дуусвал автоматаар "free" гэж vзнэ.
export async function getUserTier(userId) {
  if (!userId) return "free";

  const { data, error } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return "free";

  const activeStatuses = ["active", "trialing"];
  if (!activeStatuses.includes(data.status)) return "free";

  if (data.current_period_end && new Date(data.current_period_end) < new Date()) {
    return "free";
  }

  return data.tier;
}

// tier-vvдийн зэрэглэл — "энэ хэрэглэгч тухайн feature-д хvрэлцэхvйц
// эрхтэй юv" гэдгийг шалгахад ашиглана.
const TIER_RANK = { free: 0, basic: 1, pro: 2 };

export function hasTierAccess(userTier, requiredTier) {
  return (TIER_RANK[userTier] ?? 0) >= (TIER_RANK[requiredTier] ?? 0);
}
