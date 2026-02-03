import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { StepType } from "@/types/database";

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
    .select("id")
    .eq("id", sessionId)
    .eq("formateur_id", formateur.id)
    .single();
  if (!sessionRow.data) {
    return NextResponse.json({ error: "Session non trouvée" }, { status: 404 });
  }
  const body = await request.json();
  const { step_type, creneau_id } = body as { step_type: StepType; creneau_id?: string };
  if (!step_type) {
    return NextResponse.json({ error: "step_type requis" }, { status: 400 });
  }
  const validSteps: StepType[] = [
    "test_pre",
    "emargement",
    "points_cles",
    "test_fin",
    "enquete_satisfaction",
    "bilan_final",
  ];
  if (!validSteps.includes(step_type)) {
    return NextResponse.json({ error: "Type d'étape invalide" }, { status: 400 });
  }
  if (step_type === "emargement" && !creneau_id) {
    return NextResponse.json({ error: "creneau_id requis pour l'émargement" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("session_step_triggers")
    .insert({
      session_id: sessionId,
      step_type,
      creneau_id: step_type === "emargement" ? creneau_id : null,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
