import { localStore } from "./local";
import { createSupabaseStore } from "./supabase";
import type { Store } from "./types";

/** No Supabase keys in .env.local means local mode: the whole app runs in this browser. */
export const HAS_SUPABASE = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

let store: Store | undefined;
export const getStore = (): Store => (store ??= HAS_SUPABASE ? createSupabaseStore() : localStore);

export * from "./types";
