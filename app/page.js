import MarketSummary from "@/components/MarketSummary";
import MarketPulse from "@/components/MarketPulse";
import BankRates from "@/components/BankRates";

export default function HomePage() {
  return (
    <>
      <MarketSummary />
      <MarketPulse />
      <BankRates />
    </>
  );
}
