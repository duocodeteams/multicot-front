"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Language } from "./i18n"

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof import("./i18n").translations.es) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es")
  const [mounted, setMounted] = useState(false)

  // Cargar idioma guardado al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("app_language") as Language
      if (savedLanguage === "es" || savedLanguage === "en") {
        setLanguageState(savedLanguage)
      }
      setMounted(true)
    }
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem("app_language", lang)
    }
  }, [])

  const t = useCallback(
    (key: keyof typeof import("./i18n").translations.es): string => {
      // Importación dinámica para evitar problemas de circular dependency
      const { getTranslation } = require("./i18n")
      return getTranslation(language, key)
    },
    [language]
  )

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

