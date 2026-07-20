"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function BankRates() {
  const [debugInfo, setDebugInfo] = useState("Ачаалж байна...");

  useEffect(() => {
    supabase
      .from("bank_rates")
      .select("*")
      .then((result) => {
        setDebugInfo(JSON.stringify({
          hasError: !!result.error,
          errorMessage: result.error?.message,
          dataLength: result.data?.length,
        }));
      })
      .catch((err) => {
        setDebugInfo("CATCH ERROR: " + String(err));
      });
  }, []);

  return (
    <section style={{ padding: 20, background: "#fff3cd", margin: 20, borderRadius: 8 }}>
      <strong>DEBUG:</strong> {debugInfo}
    </section>
  );
}
