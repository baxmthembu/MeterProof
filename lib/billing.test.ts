// Run: npm test   (node --test, Node 24 strips the types)
import test from "node:test";
import assert from "node:assert/strict";
import { steppedCharge, checkBill, quickCheck, businessDaysBetween, formatSast, formatRand } from "./billing.ts";
import { MUNICIPALITIES, type Tariff } from "./tariffs.ts";
import { sign, verifyItnSignature, checkoutFields, type Fields } from "./payfast.ts";

const flat: Tariff = { name: "t", unit: "kWh", ratesIncludeVat: false, typicalMonthlyUse: 100, verified: true, note: "", source: "",
  blocks: [{ upTo: 100, rate: 1 }, { upTo: 200, rate: 2 }, { upTo: null, rate: 3 }] };

test("stepped charge crosses blocks and adds VAT", () => {
  assert.equal(steppedCharge(flat, 0), 0);
  assert.equal(steppedCharge(flat, 100), 115);            // 100 x 1 x 1.15
  assert.equal(steppedCharge(flat, 150), 230);            // (100 + 50 x 2) x 1.15
  assert.equal(steppedCharge(flat, 250), 517.5);          // (100 + 200 + 50 x 3) x 1.15
});

test("blocks are pro-rated to the billing period", () => {
  // 60 days doubles each ceiling: 200 units all fall in block 1
  assert.equal(steppedCharge(flat, 200, 60), 230);
  // 15 days halves them: 100 units = 50 @1 + 50 @2
  assert.equal(steppedCharge(flat, 100, 15), 172.5);
});

test("VAT-inclusive tables are not taxed twice", () => {
  assert.equal(steppedCharge({ ...flat, ratesIncludeVat: true }, 100), 100);
});

test("Joburg water: first 6 kL free, hand-checked 12 kL", () => {
  const t = MUNICIPALITIES.joburg.tariffs.water;
  assert.equal(steppedCharge(t, 6), 0);
  // 4 x 33.57 + 2 x 35.04 = 204.36, x 1.15 = 235.014
  assert.equal(steppedCharge(t, 12), 235.01);
});

test("bill check: overcharge and safe payment", () => {
  const r = checkBill({ tariff: flat, billingDays: 30, billedPrevious: 1000, billedCurrent: 1250, actualReading: 1150 });
  assert.equal(r.billedUnits, 250);
  assert.equal(r.actualUnits, 150);
  assert.equal(r.overbilledUnits, 100);
  assert.equal(r.overchargeRand, 287.5);                  // 517.5 - 230
  assert.equal(r.safePaymentRand, 230);                   // 5 units a day x 30
  const under = checkBill({ tariff: flat, billingDays: 30, billedPrevious: 1000, billedCurrent: 1100, actualReading: 1150 });
  assert.equal(under.overchargeRand, 0);                  // never negative
});

test("quick check prices the top slice of a typical month", () => {
  assert.deepEqual(quickCheck(flat, 500, 550), { units: 50, rand: 115 }); // 50 units in block 2
  assert.deepEqual(quickCheck(flat, 550, 500), { units: 0, rand: 0 });
});

test("business days skip weekends", () => {
  assert.equal(businessDaysBetween(new Date(2026, 10, 13), new Date(2026, 10, 16)), 1); // Fri -> Mon
  assert.equal(businessDaysBetween(new Date(2026, 10, 2), new Date(2026, 10, 30)), 20);
});

test("formatting", () => {
  assert.equal(formatSast("2026-11-15T20:03:00Z"), "2026-11-15 22:03 SAST");
  assert.equal(formatRand(1234.5), "R 1 234.50");
});

test("PayFast signature round-trips and rejects tampering", () => {
  const fields: Fields = [["m_payment_id", "abc"], ["amount_gross", "79.00"], ["item_name", "Dispute Pack (R79)"], ["blank", ""]];
  const signed: Fields = [...fields, ["signature", sign(fields, "pass phrase")]];
  assert.equal(verifyItnSignature(signed, "pass phrase"), true);
  assert.equal(verifyItnSignature(signed, "wrong"), false);
  signed[1] = ["amount_gross", "1.00"];
  assert.equal(verifyItnSignature(signed, "pass phrase"), false);
  const sub = checkoutFields({ product: "account_shield", paymentId: "p1", userId: "u1", disputeId: null, email: "a@example.com", siteUrl: "http://localhost:3000" });
  assert.ok(sub.some(([k, v]) => k === "frequency" && v === "3"));
  assert.equal(sub.at(-1)?.[0], "signature");
});
