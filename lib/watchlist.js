import { supabase } from "./supabaseClient";

export async function getWatchlist(userId) {
  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function isInWatchlist(userId, ticker) {
  const { data, error } = await supabase
    .from("watchlist")
    .select("id")
    .eq("user_id", userId)
    .eq("ticker", ticker)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function addToWatchlist(userId, ticker, assetType) {
  const { error } = await supabase
    .from("watchlist")
    .insert({ user_id: userId, ticker, asset_type: assetType });
  if (error) throw error;
}

export async function removeFromWatchlist(userId, ticker) {
  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("ticker", ticker);
  if (error) throw error;
}
