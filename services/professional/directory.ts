import { getClient } from "@/services/supabase";
import type {
    CreateProfessionalProfileInput,
    ProfessionalProfile,
    Specialty,
} from "@/types/professional";

function mapRow(row: Record<string, unknown>): ProfessionalProfile {
  return {
    id: row.id as string,
    displayName: row.display_name as string,
    title: row.title as string,
    bio: row.bio as string,
    specialties: row.specialties as string[] as Specialty[],
    languages: row.languages as string[],
    licenseNumber: row.license_number as string,
    licenseVerified: row.license_verified as boolean,
    avatarUrl: row.avatar_url as string | undefined,
    sessionPriceSekOre: row.session_price_sek_ore as number,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  };
}

export interface ListProfessionalsFilter {
  specialty?: Specialty;
  language?: string;
}

export async function listProfessionals(
  filter: ListProfessionalsFilter = {},
): Promise<ProfessionalProfile[]> {
  const supabase = getClient();
  let query = supabase
    .from("professional_profiles")
    .select("*")
    .eq("is_active", true)
    .eq("license_verified", true)
    .order("display_name", { ascending: true });

  if (filter.specialty) {
    query = query.contains("specialties", [filter.specialty]);
  }
  if (filter.language) {
    query = query.contains("languages", [filter.language]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getProfessional(
  id: string,
): Promise<ProfessionalProfile | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("professional_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapRow(data);
}

export async function createProfessionalProfile(
  input: CreateProfessionalProfileInput,
): Promise<ProfessionalProfile> {
  const supabase = getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("professional_profiles")
    .insert({
      id: user.id,
      display_name: input.displayName,
      title: input.title,
      bio: input.bio,
      specialties: input.specialties,
      languages: input.languages,
      license_number: input.licenseNumber,
      session_price_sek_ore: input.sessionPriceSekOre,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function updateProfessionalProfile(
  input: Partial<CreateProfessionalProfileInput>,
): Promise<ProfessionalProfile> {
  const supabase = getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const patch: Record<string, unknown> = {};
  if (input.displayName !== undefined) patch.display_name = input.displayName;
  if (input.title !== undefined) patch.title = input.title;
  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.specialties !== undefined) patch.specialties = input.specialties;
  if (input.languages !== undefined) patch.languages = input.languages;
  if (input.licenseNumber !== undefined)
    patch.license_number = input.licenseNumber;
  if (input.sessionPriceSekOre !== undefined)
    patch.session_price_sek_ore = input.sessionPriceSekOre;

  const { data, error } = await supabase
    .from("professional_profiles")
    .update(patch)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

/** Returns the current user's own professional profile, or null if they haven't registered. */
export async function getOwnProfessionalProfile(): Promise<ProfessionalProfile | null> {
  const supabase = getClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("professional_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return null;
  return mapRow(data);
}
