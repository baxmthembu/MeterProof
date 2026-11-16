// Local mode: everything stays in this browser. Rows in localStorage, photos in IndexedDB.
// ponytail: one browser, no sync, cleared with site data. Add Supabase keys for the real backend.
import type { Dispute, Meter, Payment, Profile, Reading, Store } from "./types";

interface Db {
  profile: Profile;
  meters: Meter[];
  readings: Reading[];
  disputes: Dispute[];
  payments: Payment[];
}

const KEY = "meterproof:v1";
const empty = (): Db => ({
  profile: { fullName: "", address: "", email: "", shieldActiveUntil: null },
  meters: [], readings: [], disputes: [], payments: [],
});

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty(), ...(JSON.parse(raw) as Partial<Db>) } : empty();
  } catch {
    return empty();
  }
}
const save = (db: Db) => localStorage.setItem(KEY, JSON.stringify(db));
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function photos(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("meterproof", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("photos");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function photoTx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await photos();
  return new Promise((resolve, reject) => {
    const req = run(db.transaction("photos", mode).objectStore("photos"));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const localStore: Store = {
  mode: "local",
  userId: async () => "local",
  signOut: async () => {},
  getProfile: async () => load().profile,
  async saveProfile(p) {
    const db = load();
    db.profile = { ...db.profile, ...p };
    save(db);
  },
  listMeters: async () => load().meters,
  async addMeter(m) {
    const db = load();
    const meter: Meter = { ...m, id: id(), createdAt: now() };
    db.meters.push(meter);
    save(db);
    return meter;
  },
  async updateMeter(meterId, patch) {
    const db = load();
    db.meters = db.meters.map((m) => (m.id === meterId ? { ...m, ...patch } : m));
    save(db);
  },
  async deleteMeter(meterId) {
    const db = load();
    for (const r of db.readings) if (r.meterId === meterId && r.photoPath) await photoTx('readwrite', (s) => s.delete(r.photoPath!));
    db.meters = db.meters.filter((m) => m.id !== meterId);
    db.readings = db.readings.filter((r) => r.meterId !== meterId);
    db.disputes = db.disputes.filter((d) => d.meterId !== meterId);
    save(db);
  },
  listReadings: async () => load().readings.sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)),
  async addReading({ meterId, value, note, photo }) {
    const reading: Reading = { id: id(), meterId, value, note, loggedAt: now(), photoPath: null };
    if (photo) {
      reading.photoPath = reading.id;
      await photoTx("readwrite", (s) => s.put(photo, reading.id));
    }
    const db = load();
    db.readings.push(reading);
    save(db);
    return reading;
  },
  photoBlob: async (path) => (await photoTx<Blob | undefined>("readonly", (s) => s.get(path))) ?? null,
  listDisputes: async () => load().disputes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  async addDispute(d) {
    const db = load();
    const dispute: Dispute = { ...d, id: id(), createdAt: now(), referenceNumber: "", submittedOn: null, channel: null, status: "Logged" };
    db.disputes.push(dispute);
    save(db);
    return dispute;
  },
  async updateDispute(disputeId, patch) {
    const db = load();
    db.disputes = db.disputes.map((d) => (d.id === disputeId ? { ...d, ...patch } : d));
    save(db);
  },
  async deleteDispute(disputeId) {
    const db = load();
    db.disputes = db.disputes.filter((d) => d.id !== disputeId);
    save(db);
  },
  listPayments: async () => load().payments,
  async deleteAccount() {
    localStorage.removeItem(KEY);
    await photoTx('readwrite', (s) => s.clear());
  },
  async demoPay(product, disputeId) {
    const db = load();
    const payment: Payment = { id: id(), disputeId, product, amount: product === "dispute_pack" ? 79 : 39, status: "complete", createdAt: now() };
    db.payments.push(payment);
    if (product === "account_shield") db.profile.shieldActiveUntil = new Date(Date.now() + 35 * 86_400_000).toISOString();
    save(db);
  },
};
