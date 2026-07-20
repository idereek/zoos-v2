import { getTradingViewSymbol } from "@/lib/tvSymbols";

export default function TradingViewChart({ ticker, type = "stock" }) {
  const tvSymbol = getTradingViewSymbol(ticker, type);
  const src = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(
    tvSymbol
  )}&interval=D&hide_top_toolbar=1&hide_legend=0&saveimage=0&toolbarbg=F5F7FA&theme=light&style=1&locale=en&withdateranges=1`;
  return (
    <div
      className="tv-chart-wrap"
      style={{ width: "80%", height: 320 }}
    >
      <iframe
        src={src}
        title={`${ticker} chart`}
        loading="lazy"
        frameBorder="0"
        allowTransparency="true"
        scrolling="no"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}
