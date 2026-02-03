import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await params;
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      formation:formations(id, nom),
      formateur:formateurs(id, nom, prenom, user_id, users(username)),
      session_dates(id, date),
      session_creneaux(id, ordre, heure_debut, heure_fin)
    `)
    .eq("id", id)
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
