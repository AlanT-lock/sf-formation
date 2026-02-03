import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "stagiaire") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await request.json();
  const { inscription_id, creneau_id, signature_data } = body;
  if (!inscription_id || !creneau_id || !signature_data) {
    return NextResponse.json(
      { error: "inscription_id, creneau_id et signature_data requis" },
      { status: 400 }
    );
  }
  const { data: stagiaire } = await supabase
    .from("stagiaires")
    .select("id")
    .eq("user_id", session.sub)
    .single();
  if (!stagiaire) {
    return NextResponse.json({ error: "Stagiaire non trouvé" }, { status: 404 });
  }
  const { data: inscription } = await supabase
    .from("inscriptions")
    .select("id")
    .eq("id", inscription_id)
    .eq("stagiaire_id", stagiaire.id)
    .single();
  if (!inscription) {
    return NextResponse.json({ error: "Inscription non trouvée" }, { status: 404 });
  }
  const signed_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("emargements")
    .insert({
      inscription_id,
      creneau_id,
      signed_at,
      signature_data,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Émargement déjà enregistré" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
