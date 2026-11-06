"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SaleCatalogItem } from "@/lib/issuance/sales-types"

export type SaleLocationValue = {
  country_id: string
  country: string
  province_id: string
  province: string
}

type SaleLocationSelectsProps = {
  countries: SaleCatalogItem[]
  provinces: SaleCatalogItem[]
  loadingCountries?: boolean
  loadingProvinces?: boolean
  /** Si false (p.ej. Inter Assist no-AR con items []), no se exige provincia. */
  provinceRequired?: boolean
  value: SaleLocationValue
  onChange: (next: Partial<SaleLocationValue>) => void
  countryError?: string
  provinceError?: string
  disabled?: boolean
}

/**
 * Selects compartidos de país/provincia (Omint e Inter Assist).
 * Al elegir país → country_id + country (name).
 * Al elegir provincia → province_id + province (name).
 */
export function SaleLocationSelects({
  countries,
  provinces,
  loadingCountries,
  loadingProvinces,
  provinceRequired = true,
  value,
  onChange,
  countryError,
  provinceError,
  disabled,
}: SaleLocationSelectsProps) {
  const provinceDisabled =
    disabled || !value.country_id || loadingProvinces || (!provinceRequired && provinces.length === 0)

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label>País</Label>
        <Select
          value={value.country_id || undefined}
          disabled={disabled || loadingCountries}
          onValueChange={(id) => {
            const item = countries.find((c) => c.id === id)
            onChange({
              country_id: id,
              country: item?.name || "",
              province_id: "",
              province: "",
            })
          }}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={loadingCountries ? "Cargando países…" : "Seleccioná país"}
            />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {countryError && <p className="text-xs text-destructive">{countryError}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Provincia{!provinceRequired ? " (opcional)" : ""}</Label>
        <Select
          value={value.province_id || undefined}
          disabled={provinceDisabled}
          onValueChange={(id) => {
            const item = provinces.find((p) => p.id === id)
            onChange({
              province_id: id,
              province: item?.name || "",
            })
          }}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                loadingProvinces
                  ? "Cargando…"
                  : !value.country_id
                    ? "Elegí un país primero"
                    : provinces.length === 0
                      ? "Sin provincias para este país"
                      : "Seleccioná provincia"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((prov) => (
              <SelectItem key={prov.id} value={prov.id}>
                {prov.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {provinceError && <p className="text-xs text-destructive">{provinceError}</p>}
      </div>
    </>
  )
}
