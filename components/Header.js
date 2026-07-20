"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/useSession";
import { useAuthModal } from "@/lib/AuthModalContext";
import { useI18n } from "@/lib/i18n/I18nContext";
import { getPortfolio } from "@/lib/portfolio";
import { getAssetQuote } from "@/lib/assetQuote";
import { resolveTicker } from "@/lib/assetType";

const fmtUSD = (n) =>
  "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

function PortfolioNavBadge({ userId }) {
  const [gain, setGain] = useState(null);
  const [up, setUp] = useState(true);

  useEffect(() => {
    if (!userId) {
      setGain(null);
      return;
    }

    let cancelled = false;

    function load() {
      getPortfolio(userId)
        .then(async (rows) => {
          if (cancelled) return;
          if (!rows.length) {
            setGain(null);
            return;
          }
          const withQuotes = await Promise.all(
            rows.map(async (row) => {
              try {
                const quote = await getAssetQuote(row.ticker);
                return { ...row, quote };
              } catch {
                return { ...row, quote: null };
              }
            })
          );
          const valid = withQuotes.filter((h) => h.quote);
          if (cancelled) return;
          if (!valid.length) {
            setGain(null);
            return;
          }
          const val = valid.reduce((sum, h) => sum + h.quantity * h.quote.current, 0);
          const cost = valid.reduce((sum, h) => sum + h.quantity * h.buy_price, 0);
          const gainAmount = val - cost;
          setGain(gainAmount);
          setUp(gainAmount >= 0);
        })
        .catch(() => {
          if (!cancelled) setGain(null);
        });
    }

    load();
    window.addEventListener("portfolio-updated", load);
    return () => {
      cancelled = true;
      window.removeEventListener("portfolio-updated", load);
    };
  }, [userId]);

  if (gain == null) {
    return (
      <span className="nav-portfolio-badge neutral">
        <span className="nav-portfolio-arrow up">▲</span>
        <span className="nav-portfolio-arrow down">▼</span>
      </span>
    );
  }

  const displayAmount = Math.abs(gain);

  return (
    <span className={`nav-portfolio-badge ${up ? "up" : "down"}`}>
      <span className="nav-portfolio-arrow">{up ? "▲" : "▼"}</span>
      {up ? "+" : "-"}
      {fmtUSD(displayAmount)}
    </span>
  );
}

export default function Header() {
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const [query, setQuery] = useState("");
  const { user } = useSession();
  const { openAuthModal } = useAuthModal();
  const { lang, setLang, t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setLangOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const ticker = resolveTicker(trimmed);
    router.push(`/asset/${ticker}`);
    setQuery("");
  }

  const NAV_LINKS = [
    { href: "/", label: t("nav_terminal") },
    { href: "/markets", label: t("nav_markets") },
    { href: "/dashboard?tab=portfolio", label: t("nav_watchlist"), key: "portfolio" },
    { href: "/pricing", label: t("nav_pricing") },
    { href: "/contactus", label: t("nav_news") },
  ];

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="header-left-group">
          <Link href="/" className="brand">
            <svg className="brand-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 24 L6 18 L12 18 L12 24" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M14 24 L14 12 L20 12 L20 24" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M22 24 L22 7 L28 7 L28 24" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M22 7 L25 2 L28 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="brand-flame" />
            </svg>
            <span className="brand-name">ЗООС</span>
          </Link>

          <nav className="topnav">
            {NAV_LINKS.map((item) =>
              item.key === "portfolio" ? (
                <div className="nav-link-col" key={item.href}>
                  <Link href={item.href} className="nav-link">
                    {item.label}
                  </Link>
                  <PortfolioNavBadge userId={user?.id} />
                </div>
              ) : (
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>

        <form className="header-center-search" onSubmit={handleSearchSubmit}>
          <span className="header-center-search-icon">⌕</span>
          <input
            type="text"
            className="header-center-search-input"
            placeholder={t("search_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </form>

        <div className="header-actions">
          <div className="lang-switcher" ref={langRef}>
            <button
              className="lang-btn"
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={langOpen}
            >
              <span className="lang-globe" aria-hidden="true">🌐</span>
              <span>{lang.toUpperCase()}</span>
              <span className="lang-caret" aria-hidden="true">▾</span>
            </button>
            {langOpen && (
              <div className="lang-menu show">
                <button
                  className={`lang-option${lang === "mn" ? " active" : ""}`}
                  type="button"
                  onClick={() => { setLang("mn"); setLangOpen(false); }}
                >
                  <span className="lang-code-badge">MN</span> Монгол
                </button>
                <button
                  className={`lang-option${lang === "en" ? " active" : ""}`}
                  type="button"
                  onClick={() => { setLang("en"); setLangOpen(false); }}
                >
                  <span className="lang-code-badge">EN</span> English
                </button>
              </div>
            )}
          </div>

          <div className="auth-actions">
            {user ? (
              <>
                <span className="auth-user-email">{user.email}</span>
                <button className="btn-login" type="button" onClick={() => signOut()}>
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <button className="btn-login" type="button" onClick={() => openAuthModal("login")}>
                  {t("login")}
                </button>
                <button className="btn-signup" type="button" onClick={() => openAuthModal("signup")}>
                  {t("signup")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
