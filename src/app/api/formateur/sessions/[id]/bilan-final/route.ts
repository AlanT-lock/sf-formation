import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "formateur") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id: sessionId } = await params;
  const { searchParams } = new URL(request.url);
  const inscription_id = searchParams.get("inscription_id");
  if (!inscription_id) {
    return NextResponse.json({ error: "inscription_id requis" }, { status: 400 });
  }
  const { data: formateur } = await supabase
    .from("formateurs")
    .select("id")
    .eq("user_id", session.sub)
    .single();
  if (!formateur) {
    return NextResponse.json({ error: "Formateur non trouvé" }, { status: 404 });
  }
  const { data: sessionRow } = await supabase
    .from("sessions")
    .select("id, formation_id")
    .eq("id", sessionId)
    .eq("formateur_id", formateur.id)
    .single();
  if (!sessionRow) {
    return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
  }
  const { data: inscription } = await supabase
    .from("inscriptions")
    .select(`
      id,
      stagiaire:stagiaires(nom, prenom)
    `)
    .eq("id", inscription_id)
    .eq("session_id", sessionId)
    .single();
  if (!inscription) {
    return NextResponse.json({ error: "Inscription non trouvée" }, { status: 404 });
  }
  const stagiaire = Array.isArray(inscription.stagiaire)
    ? (inscription.stagiaire[0] as { nom: string; prenom: string } | null) ?? null
    : (inscription.stagiaire as { nom: string; prenom: string } | null);
  const { data: questions } = await supabase
    .from("questions")
    .select("id, ordre, libelle, type_reponse, options")
    .eq("formation_id", sessionRow.formation_id)
    .eq("document_type", "bilan_final")
    .order("ordre");
  return NextResponse.json({
    stagiaire: stagiaire ? { nom: stagiaire.nom, prenom: stagiaire.prenom } : null,
    questions: questions ?? [],
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "formateur") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id: sessionId } = await params;
  const { data: formateur } = await supabase
    .from("formateurs")
    .select("id")
    .eq("user_id", session.sub)
    .single();
  if (!formateur) {
    return NextResponse.json({ error: "Formateur non trouvé" }, { status: 404 });
  }
  const sessionRow = await supabase
    .from("sessions")
    .select("id, formation_id")
    .eq("id", sessionId)
    .eq("formateur_id", formateur.id)
    .single();
  if (!sessionRow.data) {
    return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
  }
  const body = await request.json();
  const { inscription_id, reponses } = body as {
    inscription_id: string;
    reponses: { question_id: string; valeur?: string }[];
  };
  if (!inscription_id || !Array.isArray(reponses)) {
    return NextResponse.json(
      { error: "inscription_id et reponses requis" },
      { status: 400 }
    );
  }
  const { data: inscription } = await supabase
    .from("inscriptions")
    .select("id")
    .eq("id", inscription_id)
    .eq("session_id", sessionId)
    .single();
  if (!inscription) {
    return NextResponse.json({ error: "Inscription non trouvée" }, { status: 404 });
  }
  const { data: fd } = await supabase
    .from("formation_documents")
    .select("rempli_par")
    .eq("formation_id", sessionRow.data.formation_id)
    .eq("document_type", "bilan_final")
    .single();
  if (fd?.rempli_par !== "formateur") {
    return NextResponse.json(
      { error: "Le bilan final n'est pas à remplir par le formateur pour cette formation" },
      { status: 400 }
    );
  }
  const rows = reponses.map((r) => ({
    inscription_id,
    question_id: r.question_id,
    valeur: r.valeur ?? null,
    valeur_json: null,
  }));
  const { error: errRep } = await supabase.from("reponses").upsert(rows, {
    onConflict: "inscription_id,question_id",
  });
  if (errRep) {
    return NextResponse.json({ error: errRep.message }, { status: 500 });
  }
  const { data: comp, error: errComp } = await supabase
    .from("step_completions")
    .insert({
      inscription_id,
      step_type: "bilan_final",
      creneau_id: null,
    })
    .select()
    .single();
  if (errComp) {
    if (errComp.code === "23505") {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: errComp.message }, { status: 500 });
  }
  return NextResponse.json(comp);
}
