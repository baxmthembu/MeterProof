import { NextResponse } from "next/server";
import { hasSupabaseServer, supabaseAdmin, supabaseFromCookies } from "@/lib/supabase-server";

/** Erases the signed-in user: their photos, then the auth user, which cascades to every table. */
export async function DELETE() {
  if (!hasSupabaseServer()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data } = await (await supabaseFromCookies()).auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const admin = supabaseAdmin();
  const photos = await admin.from("readings").select("photo_path").eq("user_id", data.user.id).not("photo_path", "is", null);
  const paths = (photos.data ?? []).map((r) => r.photo_path as string);
  if (paths.length) await admin.storage.from("meter-photos").remove(paths);

  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) return NextResponse.json({ error: "Could not delete your account. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
