import { getDb } from "@/lib/mongodb";

// Singleton document — there is exactly one "platform" settings row.
const SETTINGS_ID = "platform";

export interface PlatformSettings {
  defaultCurrency: string;
  defaultCountry: string;
}

const DEFAULTS: PlatformSettings = {
  defaultCurrency: "MAD – Moroccan Dirham",
  defaultCountry: "Morocco",
};

// Settings uses a string _id (a fixed singleton key), not the driver's default ObjectId —
// cast the filter since the mongodb typings assume _id: ObjectId by default.
const settingsFilter = { _id: SETTINGS_ID } as Record<string, unknown>;

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const db = getDb();
  const doc = await db.collection("Settings").findOne(settingsFilter);
  if (!doc) return DEFAULTS;
  return {
    defaultCurrency: doc.defaultCurrency ?? DEFAULTS.defaultCurrency,
    defaultCountry:  doc.defaultCountry  ?? DEFAULTS.defaultCountry,
  };
}

export async function updatePlatformSettings(patch: Partial<PlatformSettings>): Promise<void> {
  const db = getDb();
  await db.collection("Settings").updateOne(
    settingsFilter,
    { $set: { ...patch, updatedAt: new Date() } },
    { upsert: true },
  );
}
