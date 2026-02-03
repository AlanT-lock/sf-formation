import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "formateur") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await params;
  const { data: formateur } = await supabase
    .from("formateurs")
    .select("id")
    .eq("user_id", session.sub)
    .single();
  if (!formateur) {
    return NextResponse.json({ error: "Formateur non trouvé" }, { status: 404 });
  }
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      id,
      nom,
      nb_creneaux,
      created_at,
      formation:formations(nom),
      session_creneaux(id, ordre, heure_debut, heure_fin),
      session_step_triggers(id, step_type, creneau_id, triggered_at),
      inscriptions(id, stagiaire_id, stagiaire:stagiaires(nom, prenom))
    `)
    .eq("id", id)
    .eq("formateur_id", formateur.id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Session non trouvée" }, { status: 404 });
  }

  const inscriptionIds =
    (data.inscriptions as { id: string }[] | null)?.map((i) => i.id) ?? [];
  let stepCompletions: { inscription_id: string; step_type: string; creneau_id: string | null }[] = [];
  if (inscriptionIds.length > 0) {
    const { data: completions } = await supabase
      .from("step_completions")
      .select("inscription_id, step_type, creneau_id")
      .in("inscription_id", inscriptionIds);
    stepCompletions = (completions ?? []) as {
      inscription_id: string;
      step_type: string;
      creneau_id: string | null;
    }[];
  }

  return NextResponse.json({
    ...data,
    step_completions: stepCompletions,
  });
}
