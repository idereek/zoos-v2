import { supabase } from "./supabaseClient";

export async function getPortfolio(userId) {
  const { data, error } = await supabase
    .from("portfolio_holdings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addHolding(userId, { ticker, assetType, quantity, buyPrice, buyDate }) {
  const { error } = await supabase.from("portfolio_holdings").insert({
    user_id: userId,
    ticker: ticker.toUpperCase(),
    asset_type: assetType,
    quantity,
    buy_price: buyPrice,
    buy_date: buyDate || null,
  });
  if (error) throw error;
}

export async function removeHolding(userId, holdingId) {
  const { error } = await supabase
    .from("portfolio_holdings")
    .delete()
    .eq("user_id", userId)
    .eq("id", holdingId);
  if (error) throw error;
}
