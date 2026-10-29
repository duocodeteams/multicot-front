import type { IssuanceFormSchema } from "../types"

/**
 * Mock basado en la planilla de emisión (Terrawind):
 * fechas, producto, país destino, pasajeros y contacto de emergencia.
 */
export function buildTerrawindSchema(planId?: string | number): IssuanceFormSchema {
  return {
    companyCode: "terrawind",
    companyName: "Terrawind",
    version: "mock-1.0",
    planId,
    sections: [
      {
        id: "trip",
        title: "Datos del viaje",
        description: "Algunos valores vienen de la cotización y no se pueden editar.",
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
            helpText: "Producto asociado a la cotización seleccionada",
          },
          {
            name: "destinationCountry",
            label: "País de destino",
            type: "select",
            required: true,
            source: "catalog",
            placeholder: "Seleccioná un país",
            options: [
              { value: "AR", label: "Argentina" },
              { value: "BR", label: "Brasil" },
              { value: "CL", label: "Chile" },
              { value: "US", label: "Estados Unidos" },
              { value: "ES", label: "España" },
              { value: "IT", label: "Italia" },
              { value: "FR", label: "Francia" },
              { value: "MX", label: "México" },
              { value: "OTHER", label: "Otro" },
            ],
          },
        ],
      },
      {
        id: "passengers",
        title: "Pasajeros",
        description: "Completá los datos de cada pasajero. La cantidad debe coincidir con la cotización.",
        fields: [
          {
            name: "passengers",
            label: "Pasajeros",
            type: "array",
            required: true,
            source: "user",
            minItems: 1,
            maxItems: 10,
            itemLabel: "pasajero",
            itemFields: [
              {
                name: "firstName",
                label: "Nombre",
                type: "text",
                required: true,
                placeholder: "Nombre",
              },
              {
                name: "lastName",
                label: "Apellido",
                type: "text",
                required: true,
                placeholder: "Apellido",
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
                  { value: "CUIL", label: "CUIL/CUIT" },
                ],
              },
              {
                name: "documentNumber",
                label: "Número de documento",
                type: "text",
                required: true,
                placeholder: "Sin puntos ni guiones",
              },
            ],
          },
        ],
      },
      {
        id: "emergency",
        title: "Contacto de emergencia",
        description: "Nombre, apellido y teléfono son obligatorios.",
        fields: [
          {
            name: "emergencyFirstName",
            label: "Nombre",
            type: "text",
            required: true,
            source: "user",
            placeholder: "Nombre del contacto",
          },
          {
            name: "emergencyLastName",
            label: "Apellido",
            type: "text",
            required: true,
            source: "user",
            placeholder: "Apellido del contacto",
          },
          {
            name: "emergencyPhone",
            label: "Teléfono",
            type: "tel",
            required: true,
            source: "user",
            placeholder: "+54 9 11 1234-5678",
          },
          {
            name: "emergencyEmail",
            label: "Email",
            type: "email",
            required: false,
            source: "user",
            placeholder: "opcional@email.com",
          },
        ],
      },
    ],
  }
}
