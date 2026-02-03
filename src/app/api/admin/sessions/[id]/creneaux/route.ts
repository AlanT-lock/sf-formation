import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id: sessionId } = await params;
  const body = await request.json();
  const { creneau_id, heure_debut, heure_fin } = body;
  if (!creneau_id) {
    return NextResponse.json({ error: "creneau_id requis" }, { status: 400 });
  }
  const updates: { heure_debut?: string; heure_fin?: string } = {};
  if (heure_debut !== undefined) updates.heure_debut = heure_debut;
  if (heure_fin !== undefined) updates.heure_fin = heure_fin;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "heure_debut ou heure_fin requis" },
      { status: 400 }
    );
  }
  const { data, error } = await supabase
    .from("session_creneaux")
    .update(updates)
    .eq("id", creneau_id)
    .eq("session_id", sessionId)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
