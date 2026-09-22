import { NextResponse } from "next/server";
import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const PROFILE_BUCKET = "profile-assets";
const REPORT_BUCKET = "report-assets";
const PAGE_SIZE = 1000;
const REMOVE_BATCH_SIZE = 100;

async function collectStoragePaths(
  admin: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const storage = admin.storage.from(bucket);
  const files: string[] = [];
  const folders: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await storage.list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw error;

    for (const item of data ?? []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) files.push(path);
      else folders.push(path);
    }

    if (!data || data.length < PAGE_SIZE) break;
    offset += data.length;
  }

  for (const folder of folders) {
    files.push(...(await collectStoragePaths(admin, bucket, folder)));
  }

  return files;
}

async function removeUserStorage(admin: SupabaseClient, bucket: string, userId: string) {
  const storage = admin.storage.from(bucket);
  const files = await collectStoragePaths(admin, bucket, userId);

  for (let index = 0; index < files.length; index += REMOVE_BATCH_SIZE) {
    const { error } = await storage.remove(files.slice(index, index + REMOVE_BATCH_SIZE));
    if (error) throw error;
  }
}

export async function POST() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "ACCOUNT_DELETE_NOT_CONFIGURED" }, { status: 503 });
  }

  const supabase = await createServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    await removeUserStorage(admin, PROFILE_BUCKET, authData.user.id);
    await removeUserStorage(admin, REPORT_BUCKET, authData.user.id);

    const { error: deleteError } = await admin.auth.admin.deleteUser(authData.user.id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion failed", error);
    return NextResponse.json({ error: "ACCOUNT_DELETE_FAILED" }, { status: 500 });
  }
}
