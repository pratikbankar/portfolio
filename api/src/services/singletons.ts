import type { z } from 'zod';
import { Profile } from '../models/Profile.js';
import { SectionSettings } from '../models/SectionSettings.js';
import { PROFILE_KEYS, SECTION_KEYS, type SectionKey, type profileSchema, type sectionsSchema } from '../schemas.js';

export type ProfileData = z.infer<typeof profileSchema>;
export type SectionsData = z.infer<typeof sectionsSchema>;

const KEY = { key: 'main' };
const upsert = { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true } as const;

function pick<K extends string>(doc: Record<string, unknown>, keys: readonly K[]): Record<K, unknown> {
  return Object.fromEntries(keys.map((k) => [k, doc[k]])) as Record<K, unknown>;
}

export async function getProfile(): Promise<ProfileData> {
  const doc = await Profile.findOneAndUpdate(KEY, {}, upsert).lean();
  return pick(doc as Record<string, unknown>, PROFILE_KEYS) as ProfileData;
}

export async function saveProfile(data: ProfileData): Promise<ProfileData> {
  await Profile.findOneAndUpdate(KEY, { $set: data }, upsert);
  return getProfile();
}

export async function getSections(): Promise<Record<SectionKey, boolean>> {
  const doc = await SectionSettings.findOneAndUpdate(KEY, {}, upsert).lean();
  return pick(doc as Record<string, unknown>, SECTION_KEYS) as Record<SectionKey, boolean>;
}

export async function saveSections(data: SectionsData): Promise<Record<SectionKey, boolean>> {
  await SectionSettings.findOneAndUpdate(KEY, { $set: data }, upsert);
  return getSections();
}
