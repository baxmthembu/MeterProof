"use client";

import { useCallback, useEffect, useState } from "react";
import { getStore, type Dispute, type Meter, type Payment, type Profile, type Reading } from "@/lib/store";

export interface Data {
  profile: Profile;
  meters: Meter[];
  readings: Reading[];
  disputes: Dispute[];
  payments: Payment[];
}

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: Data };

async function load(): Promise<State> {
  try {
    const s = getStore();
    const [profile, meters, readings, disputes, payments] = await Promise.all([
      s.getProfile(), s.listMeters(), s.listReadings(), s.listDisputes(), s.listPayments(),
    ]);
    return { status: 'ready', data: { profile, meters, readings, disputes, payments } };
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Could not load your data.' };
  }
}

/** Loads everything the dashboard needs. An MVP user has a handful of rows, so one load is enough. */
export function useData() {
  const [state, setState] = useState<State>({ status: "loading" });

  const reload = useCallback(async () => setState(await load()), []);

  useEffect(() => {
    let live = true;
    void load().then((next) => live && setState(next));
    return () => {
      live = false;
    };
  }, []);

  return { state, reload };
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Please try again.");
