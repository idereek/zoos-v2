"use client";
import { createContext, useContext, useState } from "react";

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("login");

  function openAuthModal(initialMode = "login") {
    setMode(initialMode);
    setIsOpen(true);
  }

  function closeAuthModal() {
    setIsOpen(false);
  }

  return (
    <AuthModalContext.Provider value={{ isOpen, mode, openAuthModal, closeAuthModal, setMode }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
