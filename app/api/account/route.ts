import { NextResponse } from "next/server";
import { hasSupabaseServer, supabaseAdmin, supabaseFromCookies } from "@/lib/supabase-server";

/** Erases the signed-in user: their photos, then the auth user, which cascades to every table. */
export async function DELETE() {
  if (!hasSupabaseServer()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data } = await (await supabaseFromCookies()).auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const admin = supabaseAdmin();
  // Empty the user's whole photo folder ({user_id}/{meter_id}/file), including any file no reading points to.
  const bucket = admin.storage.from("meter-photos");
  const folders = await bucket.list(data.user.id, { limit: 1000 });
  const paths: string[] = [];
  for (const folder of folders.data ?? []) {
    const files = await bucket.list(`${data.user.id}/${folder.name}`, { limit: 1000 });
    for (const file of files.data ?? []) paths.push(`${data.user.id}/${folder.name}/${file.name}`);
  }
  if (paths.length) await bucket.remove(paths);

  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) return NextResponse.json({ error: "Could not delete your account. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
