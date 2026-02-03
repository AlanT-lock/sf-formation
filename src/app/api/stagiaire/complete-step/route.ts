import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { StepType } from "@/types/database";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "stagiaire") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await request.json();
  const { inscription_id, step_type, creneau_id } = body as {
    inscription_id: string;
    step_type: StepType;
    creneau_id?: string | null;
  };
  if (!inscription_id || !step_type) {
    return NextResponse.json(
      { error: "inscription_id et step_type requis" },
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
  const { data, error } = await supabase
    .from("step_completions")
    .insert({
      inscription_id,
      step_type,
      creneau_id: creneau_id || null,
    })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Déjà complété" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
