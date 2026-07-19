import { supabase } from "./supabaseClient";

export async function getAlerts(userId) {
  const { data, error } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addAlert(userId, { ticker, assetType, targetPrice, direction }) {
  const { error } = await supabase.from("price_alerts").insert({
    user_id: userId,
    ticker: ticker.toUpperCase(),
    asset_type: assetType,
    target_price: targetPrice,
    direction,
  });
  if (error) throw error;
}

export async function removeAlert(userId, alertId) {
  const { error } = await supabase
    .from("price_alerts")
    .delete()
    .eq("user_id", userId)
    .eq("id", alertId);
  if (error) throw error;
}
