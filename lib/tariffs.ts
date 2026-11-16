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

export type MunicipalityId = "joburg" | "ethekwini" | "tshwane" | "capetown";
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
        blocks: [
          { upTo: 500, rate: 2.8827 },
          { upTo: 1000, rate: 3.3082 },
          { upTo: 2000, rate: 3.5523 },
          { upTo: 3000, rate: 3.7479 },
          { upTo: null, rate: 3.9319 },
        ],
        typicalMonthlyUse: 450,
        verified: false,
        note: "Transcribed by a third party from the City's budget book; the first block matches City Power's own tariff page. A 7c/kWh network surcharge above 500 kWh is not included.",
        source: "https://www.solarguide.co.za/electricity-tariffs/johannesburg/",
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
        verified: false,
        note: "Flat rate reported by a third-party tariff site; not checked against the municipal tariff book.",
        source: "https://gridpulse.org.za/tariffs/ethekwini",
      },
      water: {
        name: "Domestic water",
        unit: "kL",
        ratesIncludeVat: true,
        // Only the lowest of five block rates could be confirmed, so every kilolitre is priced
        // at it. The real overcharge is at least this much. Fill in all five blocks from the
        // final tariff tables: durban.gov.za, "final-tariff-tables-2026-2027.pdf".
        blocks: [{ upTo: null, rate: 52.4 }],
        typicalMonthlyUse: 15,
        verified: false,
        note: "Only the lowest block rate is confirmed, so this is a minimum: higher blocks cost up to R137.40 per kL.",
        source: "https://southafricafacts.co.za/municipal-water-bill-calculator-south-africa/",
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
        verified: false,
        note: "Three sources agree on these blocks, but the City's own notice could not be opened to confirm them.",
        source: "https://www.tshwane.gov.za/?p=102188",
      },
      water: {
        name: "Residential, Level 2 water restriction tariff",
        unit: "kL",
        ratesIncludeVat: false,
        blocks: [
          { upTo: 9, rate: 0 },
          { upTo: 18, rate: 43.2 },
          { upTo: 30, rate: 72.66 },
          { upTo: 42, rate: 89.72 },
          { upTo: 60, rate: 108.01 },
          { upTo: null, rate: 132.01 },
        ],
        typicalMonthlyUse: 15,
        verified: false,
        note: "Level 2 restriction rates, reported in force from November 2026. Bills from before then used a lower schedule, so check your statement's rates.",
        source: "https://muncalc.co.za/tshwane-tariffs",
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
        note: "From the City's residential electricity tariff page. The monthly service and wires charge is billed separately.",
        source: "https://www.capetown.gov.za/family-and-home/residential-utility-services/residential-electricity-services/the-cost-of-electricity/",
      },
      water: {
        name: "Domestic water, Level 0",
        unit: "kL",
        ratesIncludeVat: true,
        blocks: [
          { upTo: 6, rate: 25.42 },
          { upTo: 10.5, rate: 34.92 },
          { upTo: 35, rate: 52.2 },
          { upTo: null, rate: 100.71 },
        ],
        typicalMonthlyUse: 15,
        verified: false,
        note: "Step rates from the City's residential guide as reported in search results; the VAT basis is inferred from last year's schedule.",
        source: "https://resource.capetown.gov.za/documentcentre/Documents/Financial%20documents/Budget-2026-27_Ann04.pdf",
      },
    },
  },
};

export const MUNICIPALITY_IDS = Object.keys(MUNICIPALITIES) as MunicipalityId[];
