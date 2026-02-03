import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "stagiaire") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await request.json();
  const { inscription_id, reponses } = body as {
    inscription_id: string;
    reponses: { question_id: string; valeur?: string; valeur_json?: unknown }[];
  };
  if (!inscription_id || !Array.isArray(reponses)) {
    return NextResponse.json(
      { error: "inscription_id et reponses requis" },
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
  const rows = reponses.map((r) => ({
    inscription_id,
    question_id: r.question_id,
    valeur: r.valeur ?? null,
    valeur_json: r.valeur_json ?? null,
  }));
  const { error } = await supabase.from("reponses").upsert(rows, {
    onConflict: "inscription_id,question_id",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
