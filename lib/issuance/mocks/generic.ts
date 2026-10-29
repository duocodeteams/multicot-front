import type { IssuanceFormSchema } from "../types"

/**
 * Esquema genérico mínimo para compañías sin mock específico aún.
 * Misma estructura base: viaje (readonly) + pasajeros + contacto.
 */
export function buildGenericIssuanceSchema(
  companyCode: string,
  companyName: string,
  planId?: string | number
): IssuanceFormSchema {
  return {
    companyCode,
    companyName,
    version: "mock-generic-1.0",
    planId,
    sections: [
      {
        id: "trip",
        title: "Datos del viaje",
        description: "Valores tomados de la cotización.",
        fields: [
          {
            name: "startDate",
            label: "Fecha de inicio",
            type: "date",
            required: true,
            source: "quotation",
            valueFrom: "quotation.desde",
            readOnly: true,
          },
          {
            name: "endDate",
            label: "Fecha de fin",
            type: "date",
            required: true,
            source: "quotation",
            valueFrom: "quotation.hasta",
            readOnly: true,
          },
          {
            name: "productId",
            label: "Producto",
            type: "readonly",
            required: true,
            source: "quotation",
            valueFrom: "plan.name",
          },
        ],
      },
      {
        id: "holder",
        title: "Titular",
        fields: [
          {
            name: "holderFirstName",
            label: "Nombre",
            type: "text",
            required: true,
            source: "user",
          },
          {
            name: "holderLastName",
            label: "Apellido",
            type: "text",
            required: true,
            source: "user",
          },
          {
            name: "holderEmail",
            label: "Email",
            type: "email",
            required: true,
            source: "user",
          },
          {
            name: "holderPhone",
            label: "Teléfono",
            type: "tel",
            required: true,
            source: "user",
          },
          {
            name: "holderDocumentType",
            label: "Tipo de documento",
            type: "select",
            required: true,
            source: "catalog",
            options: [
              { value: "DNI", label: "DNI" },
              { value: "PASSPORT", label: "Pasaporte" },
            ],
          },
          {
            name: "holderDocumentNumber",
            label: "Número de documento",
            type: "text",
            required: true,
            source: "user",
          },
        ],
      },
      {
        id: "passengers",
        title: "Pasajeros / beneficiarios",
        fields: [
          {
            name: "passengers",
            label: "Pasajeros",
            type: "array",
            required: true,
            minItems: 1,
            maxItems: 10,
            itemLabel: "pasajero",
            itemFields: [
              {
                name: "firstName",
                label: "Nombre",
                type: "text",
                required: true,
              },
              {
                name: "lastName",
                label: "Apellido",
                type: "text",
                required: true,
              },
              {
                name: "birthDate",
                label: "Fecha de nacimiento",
                type: "date",
                required: true,
              },
              {
                name: "documentType",
                label: "Tipo de documento",
                type: "select",
                required: true,
                options: [
                  { value: "DNI", label: "DNI" },
                  { value: "PASSPORT", label: "Pasaporte" },
                ],
              },
              {
                name: "documentNumber",
                label: "Número de documento",
                type: "text",
                required: true,
              },
            ],
          },
        ],
      },
      {
        id: "emergency",
        title: "Contacto de emergencia",
        fields: [
          {
            name: "emergencyName",
            label: "Nombre completo",
            type: "text",
            required: true,
          },
          {
            name: "emergencyPhone",
            label: "Teléfono",
            type: "tel",
            required: true,
          },
        ],
      },
    ],
  }
}
