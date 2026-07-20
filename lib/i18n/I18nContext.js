"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { dictionary } from "./dictionary";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState("mn");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("zoos_lang") : null;
    if (saved === "mn" || saved === "en") {
      setLangState(saved);
    }
  }, []);

  function setLang(newLang) {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("zoos_lang", newLang);
    }
  }

  function t(key) {
    return dictionary[lang]?.[key] || dictionary.mn[key] || key;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
