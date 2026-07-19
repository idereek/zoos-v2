import "./globals.css";
import Header from "../components/Header";
import { WorldClocksStrip, HeroTitle } from "../components/MarketClocks";
import TickerTape from "../components/TickerTape";
import { AuthModalProvider } from "../lib/AuthModalContext";
import { I18nProvider } from "../lib/i18n/I18nContext";

export const metadata = {
  title: "хувьцаа, крипто ХӨТӨЧ",
  description: "Хувьцаа, крипто, ханшийн live мэдээлэл — 100% Монгол хэлээр",
};

export default function RootLayout({ children }) {
  return (
    <html lang="mn">
      <body>
        <TickerTape />
        <I18nProvider>
          <AuthModalProvider>
            <WorldClocksStrip />
            <Header />
            <HeroTitle />
            <main>{children}</main>
            <footer className="site-footer">
              © 2026 Зоос — Монгол хэл дээрх санхvvгийн шинжилгээ
            </footer>
          </AuthModalProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
