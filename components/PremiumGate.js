"use client";
import { useSession } from "@/lib/useSession";
import { useAuthModal } from "@/lib/AuthModalContext";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useSubscription } from "@/lib/useSubscription";
import { hasTierAccess } from "@/lib/subscription";
import Link from "next/link";

const TIER_LABELS = {
  basic: "Basic",
  pro: "Pro",
};

export default function PremiumGate({ children, requiredTier = "free" }) {
  const { user, loading: sessionLoading } = useSession();
  const { tier, loading: tierLoading } = useSubscription();
  const { openAuthModal } = useAuthModal();
  const { t } = useI18n();

  if (sessionLoading) return null;

  if (!user) {
    return (
      <div className="premium-gate">
        <div className="premium-gate-blurred">{children}</div>
        <div className="premium-gate-overlay">
          <span className="premium-gate-overlay-text">{t("premium_overlay_text")}</span>
          <button className="premium-gate-cta" type="button" onClick={() => openAuthModal("login")}>
            {t("premium_cta")}
          </button>
        </div>
      </div>
    );
  }

  if (tierLoading) return null;

  if (!hasTierAccess(tier, requiredTier)) {
    const tierLabel = TIER_LABELS[requiredTier] || requiredTier;
    return (
      <div className="premium-gate">
        <div className="premium-gate-blurred">{children}</div>
        <div className="premium-gate-overlay">
          <span className="premium-gate-overlay-text">
            Энэ хэсгийг vзэхийн тулд {tierLabel} багц шаардлагатай
          </span>
          <Link href="/pricing" className="premium-gate-cta">
            Багц харах
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
