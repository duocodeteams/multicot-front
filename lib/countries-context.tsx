"use client"

import React, { createContext, useContext, useMemo } from "react"
import countries from "i18n-iso-countries"
import es from "i18n-iso-countries/langs/es.json"

type CountriesMap = Record<string, string>

type CountriesContextType = {
  countriesMap: CountriesMap
  countriesOptions: Array<{ code: string; name: string }>
}

const CountriesContext = createContext<CountriesContextType | null>(null)

export function CountriesProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<CountriesContextType>(() => {
    countries.registerLocale(es)

    const countriesMap = countries.getNames("es", { select: "official" }) as CountriesMap
    const countriesOptions = Object.entries(countriesMap)
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"))

    return {
      countriesMap,
      countriesOptions,
    }
  }, [])

  return <CountriesContext.Provider value={value}>{children}</CountriesContext.Provider>
}

export function useCountries() {
  const context = useContext(CountriesContext)
  if (!context) {
    throw new Error("useCountries must be used within a CountriesProvider")
  }
  return context
}
