/**
 * South African residential tariff tables, 2026/27 municipal year (1 July 2026 to 30 June 2027).
 *
 * UPDATE EVERY 1 JULY. This file holds constants only; the maths lives in lib/billing.ts.
 *
 * How to read a table:
 * - `blocks` are the stepped (inclining block) rates for a 30-day month.
 *   `upTo` is the cumulative monthly ceiling of the block; `null` means "everything above".
 * - `rate` is Rand per unit (kWh or kL), entered exactly as the municipality publishes it.
 * - `ratesIncludeVat` says whether the published figures already include 15% VAT.
 * - Only volumetric charges are listed. Fixed monthly charges (service, capacity, network,
 *   demand levy) are owed whatever the meter says, so they never change an overcharge.
 * - `verified: true` means the figures were read from the municipality's own document.
 *   `verified: false` means a secondary source or an incomplete table: the app labels the
 *   result "indicative" and shows `note`. Replace these from the official tariff book.
 */

export const VAT_RATE = 0.15;
export const TARIFF_YEAR = "2026/27";

export type MunicipalityId = "joburg" | "ethekwini" | "tshwane" | "capetown" | "ekurhuleni" | "mangaung" | "buffalocity";
export type Utility = "electricity" | "water";

export interface Block {
  /** Cumulative monthly ceiling of this block, or null for the open top block. */
  upTo: number | null;
  /** Rand per unit as published. */
  rate: number;
}

export interface Tariff {
  name: string;
  unit: "kWh" | "kL";
  ratesIncludeVat: boolean;
  blocks: Block[];
  /** Typical monthly household use, used only by the homepage quick check. */
  typicalMonthlyUse: number;
  verified: boolean;
  note: string;
  source: string;
}

export interface Municipality {
  id: MunicipalityId;
  name: string;
  shortName: string;
  /** Who the dispute letter is addressed to. */
  billingDepartment: string;
  utilities: { electricity: string; water: string };
  tariffs: Record<Utility, Tariff>;
}

export const MUNICIPALITIES: Record<MunicipalityId, Municipality> = {
  joburg: {
    id: "joburg",
    name: "City of Johannesburg",
    shortName: "Joburg",
    billingDepartment: "City of Johannesburg, Revenue Shared Services Centre",
    utilities: { electricity: "City Power", water: "Johannesburg Water" },
    tariffs: {
      electricity: {
        name: "City Power residential conventional, single-phase 60A",
        unit: "kWh",
        ratesIncludeVat: false,
        // Council schedule rates plus the 6c/kWh Network Surcharge, which applies to
        // residential consumption above 500 kWh a month.
        blocks: [
          { upTo: 500, rate: 2.8827 },
          { upTo: 1000, rate: 3.3682 }, // 330.82c + 6c
          { upTo: 2000, rate: 3.6123 }, // 355.23c + 6c
          { upTo: 3000, rate: 3.8079 }, // 374.79c + 6c
          { upTo: null, rate: 3.9919 }, // 393.19c + 6c
        ],
        typicalMonthlyUse: 450,
        verified: true,
        note: "From City Power's 2026/27 tariff schedule (Domestic single-phase 60A) approved by Council in March 2026, including the 6c/kWh network surcharge above 500 kWh. Service and capacity charges are billed separately.",
        source: "https://propertywheel.co.za/wp-content/uploads/ITEM-76-.pdf",
      },
      water: {
        name: "Johannesburg Water domestic, conventional meter",
        unit: "kL",
        ratesIncludeVat: false,
        blocks: [
          { upTo: 6, rate: 0 },
          { upTo: 10, rate: 33.57 },
          { upTo: 15, rate: 35.04 },
          { upTo: 20, rate: 49.13 },
          { upTo: 30, rate: 67.91 },
          { upTo: 40, rate: 74.26 },
          { upTo: 50, rate: 93.69 },
          { upTo: null, rate: 100.4 },
        ],
        typicalMonthlyUse: 15,
        verified: true,
        note: "From the City's approved 2026/27 water tariff schedule. Sanitation and the monthly demand levy are billed separately.",
        source: "https://joburg.org.za/documents_/Documents/Approved-Tarrifs-for-2026-27/Water-Tariffs-2026-2027-final.pdf",
      },
    },
  },

  ethekwini: {
    id: "ethekwini",
    name: "eThekwini Municipality",
    shortName: "eThekwini",
    billingDepartment: "eThekwini Municipality, Revenue Management Unit",
    utilities: { electricity: "eThekwini Electricity", water: "eThekwini Water and Sanitation" },
    tariffs: {
      electricity: {
        name: "Residential credit, Scale 3 and 4",
        unit: "kWh",
        ratesIncludeVat: true,
        blocks: [{ upTo: null, rate: 4.1109 }],
        typicalMonthlyUse: 450,
        verified: true,
        note: "From the City's final 2026/27 tariff tables (page 227): a flat 357.47c/kWh before VAT. The service charge is built into this rate.",
        source: "https://www.durban.gov.za/uploads/0000/13/2026/06/22/eth-final-2026-2027-tariff-tables.pdf",
      },
      water: {
        name: "Domestic water, full pressure",
        unit: "kL",
        ratesIncludeVat: true,
        blocks: [
          { upTo: 6, rate: 50.7 },
          { upTo: 25, rate: 60.1 },
          { upTo: 30, rate: 80.0 },
          { upTo: 45, rate: 123.5 },
          { upTo: null, rate: 135.7 },
        ],
        typicalMonthlyUse: 15,
        verified: true,
        note: "From the City's final 2026/27 tariff tables (page 268), for properties valued above R350 000. At R350 000 or less the first 6 kL are free.",
        source: "https://www.durban.gov.za/uploads/0000/13/2026/06/22/eth-final-2026-2027-tariff-tables.pdf",
      },
    },
  },

  tshwane: {
    id: "tshwane",
    name: "City of Tshwane",
    shortName: "Tshwane",
    billingDepartment: "City of Tshwane, Customer Care and Revenue Management",
    utilities: { electricity: "City of Tshwane Electricity", water: "City of Tshwane Water and Sanitation" },
    tariffs: {
      electricity: {
        name: "Residential inclining block",
        unit: "kWh",
        ratesIncludeVat: false,
        blocks: [
          { upTo: 100, rate: 3.2412 },
          { upTo: 400, rate: 3.7932 },
          { upTo: 650, rate: 4.1327 },
          { upTo: null, rate: 4.4551 },
        ],
        typicalMonthlyUse: 450,
        verified: true,
        note: "From the City's 2026/27 tariff notice. The notice doesn't say whether these include VAT; they are treated as excluding VAT.",
        source: "https://www.tshwane.gov.za/?p=102188",
      },
      water: {
        name: "Domestic water",
        unit: "kL",
        ratesIncludeVat: false,
        // ponytail: one table per utility. Level 2 restriction rates (from 16 Nov 2026, initially
        // 30 days) are higher, so using the normal table can only understate an overcharge.
        blocks: [
          { upTo: 9, rate: 0 },
          { upTo: 18, rate: 36.01 },
          { upTo: 30, rate: 48.73 },
          { upTo: 42, rate: 56.13 },
          { upTo: 60, rate: 60.02 },
          { upTo: null, rate: 64.26 },
        ],
        typicalMonthlyUse: 15,
        verified: true,
        note: "From the City's 2026/27 tariff notice. Level 2 restrictions from 16 November 2026 raise the rates to R43.20, R72.66, R89.72 and R108.01 per kL up to 60 kL; this check uses the normal rates, so any overcharge shown is a minimum.",
        source: "https://www.tshwane.gov.za/?p=102188",
      },
    },
  },

  capetown: {
    id: "capetown",
    name: "City of Cape Town",
    shortName: "Cape Town",
    billingDepartment: "City of Cape Town, Revenue Department",
    utilities: { electricity: "City of Cape Town Electricity", water: "City of Cape Town Water and Sanitation" },
    tariffs: {
      electricity: {
        name: "Home User (credit meter)",
        unit: "kWh",
        ratesIncludeVat: false,
        blocks: [
          { upTo: 600, rate: 3.0952 },
          { upTo: null, rate: 4.0788 },
        ],
        typicalMonthlyUse: 450,
        verified: true,
        note: "From the City's 2026/27 tariffs (Annexure 4): energy plus the 11.45c/kWh unregulated charge. The monthly service and wires charge is billed separately.",
        source: "https://www.capetown.gov.za/media/32ojyjgo/budget-2026-27_ann04.pdf",
      },
      water: {
        name: "Domestic water, Level 0",
        unit: "kL",
        ratesIncludeVat: true,
        blocks: [
          { upTo: 6, rate: 25.05 },
          { upTo: 10.5, rate: 34.42 },
          { upTo: 35, rate: 54.6 },
          { upTo: null, rate: 109.98 },
        ],
        typicalMonthlyUse: 15,
        verified: true,
        note: "From the City's notice of approved 2026/27 tariffs (Level Water Wise, no restrictions), including VAT. The fixed basic charge by meter size is billed separately.",
        source: "https://www.lkid.co.za/resources/From_the_City/Approved%20Rates%20and%20Tariffs%202026-2027%20.pdf",
      },
    },
  },

  ekurhuleni: {
    id: "ekurhuleni",
    name: "City of Ekurhuleni",
    shortName: "Ekurhuleni",
    billingDepartment: "City of Ekurhuleni, Finance Department (Revenue)",
    utilities: { electricity: "Ekurhuleni Energy", water: "Ekurhuleni Water and Sanitation" },
    tariffs: {
      electricity: {
        name: "Tariff B (Residential)",
        unit: "kWh",
        ratesIncludeVat: false,
        blocks: [{ upTo: null, rate: 3.676 }],
        typicalMonthlyUse: 450,
        verified: true,
        note: "From Schedule 2 of the City's final 2026/27 tariffs (Annexure F, page 12): R3.6760/kWh before VAT, the same in both seasons. Low-use homes on Tariff A.2 pay R3.0635/kWh. The monthly basic charge is billed separately.",
        source: "https://www.ekurhuleni.gov.za/wp-content/uploads/2026/06/Annexure-F-2026-27-Tariffs.pdf",
      },
      water: {
        name: "Household use (WA0017)",
        unit: "kL",
        ratesIncludeVat: false,
        blocks: [
          { upTo: 6, rate: 25.21 },
          { upTo: 15, rate: 41.55 },
          { upTo: 30, rate: 50.89 },
          { upTo: 45, rate: 63.33 },
          { upTo: null, rate: 78.09 },
        ],
        typicalMonthlyUse: 15,
        verified: true,
        note: "From Schedule 3 of the City's final 2026/27 tariffs (Annexure F, page 48), before VAT, per residential unit.",
        source: "https://www.ekurhuleni.gov.za/wp-content/uploads/2026/06/Annexure-F-2026-27-Tariffs.pdf",
      },
    },
  },

  mangaung: {
    id: "mangaung",
    name: "Mangaung Metropolitan Municipality",
    shortName: "Mangaung",
    billingDepartment: "Mangaung Metropolitan Municipality, Revenue Management",
    utilities: { electricity: "Centlec", water: "Mangaung Water and Sanitation" },
    tariffs: {
      electricity: {
        name: "Tariff II, IBT Domestic (conventional)",
        unit: "kWh",
        ratesIncludeVat: false,
        // ponytail: one table per utility. Centlec's winter rates (June to August) are higher, so the
        // lower rates are used and any overcharge shown is a minimum.
        blocks: [
          { upTo: 350, rate: 3.0442 },
          { upTo: null, rate: 3.5058 },
        ],
        typicalMonthlyUse: 450,
        verified: false,
        note: "From Centlec's NERSA-approved schedule for 1 July 2026 to 30 June 2027. The document's layout makes it unclear which figures are summer and which winter, so the lowest reading is used: any overcharge shown is a minimum. The R50 monthly basic charge is billed separately.",
        source: "https://centlec.co.za/Tariffs/TariffsDocuments",
      },
      water: {
        name: "Household use (WA0091)",
        unit: "kL",
        ratesIncludeVat: false,
        blocks: [
          { upTo: 6, rate: 19.5 },
          { upTo: 15, rate: 37 },
          { upTo: 30, rate: 40 },
          { upTo: 60, rate: 51 },
          { upTo: null, rate: 62 },
        ],
        typicalMonthlyUse: 15,
        verified: false,
        note: "From the City's Annexure A4 water tariffs for 2026/27, before VAT. It was published with the draft budget documents, and the final figures could not be confirmed.",
        source: "https://www.mangaung.co.za/Budget-%E2%80%93-IDP-%E2%80%93-SDBIP/",
      },
    },
  },

  buffalocity: {
    id: "buffalocity",
    name: "Buffalo City Metropolitan Municipality",
    shortName: "Buffalo City",
    billingDepartment: "Buffalo City Metropolitan Municipality, Revenue Management",
    utilities: { electricity: "BCMM Electricity", water: "BCMM Water and Sanitation" },
    tariffs: {
      electricity: {
        name: "Scale 1A, domestic credit meter (EL0100)",
        unit: "kWh",
        ratesIncludeVat: false,
        blocks: [{ upTo: null, rate: 3.89 }],
        typicalMonthlyUse: 450,
        verified: true,
        note: "From the City's final 2026/27 tariff book (page 1): R3.89/kWh before VAT. The monthly basic charge is billed separately.",
        source: "https://www.buffalocity.gov.za/CM/uploads/documents/20261106061781156795BCMMFinalTariffBook20262027.pdf",
      },
      water: {
        name: "Domestic, normal consumption (WA0100)",
        unit: "kL",
        ratesIncludeVat: false,
        blocks: [
          { upTo: 6, rate: 27.88 },
          { upTo: 10, rate: 28.43 },
          { upTo: 20, rate: 39.49 },
          { upTo: 30, rate: 51.19 },
          { upTo: null, rate: 64.24 },
        ],
        typicalMonthlyUse: 15,
        verified: true,
        note: "From the City's final 2026/27 tariff book (page 16), before VAT. Punitive drought tariffs, when Council declares them, are higher.",
        source: "https://www.buffalocity.gov.za/CM/uploads/documents/20261106061781156795BCMMFinalTariffBook20262027.pdf",
      },
    },
  },
};

export const MUNICIPALITY_IDS = Object.keys(MUNICIPALITIES) as MunicipalityId[];
