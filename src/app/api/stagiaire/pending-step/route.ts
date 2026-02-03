import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "stagiaire") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { data: stagiaire } = await supabase
    .from("stagiaires")
    .select("id")
    .eq("user_id", session.sub)
    .single();
  if (!stagiaire) {
    return NextResponse.json({ pending: null });
  }
  const { data: inscriptions } = await supabase
    .from("inscriptions")
    .select("id, session_id")
    .eq("stagiaire_id", stagiaire.id);
  if (!inscriptions?.length) {
    return NextResponse.json({ pending: null });
  }
  const inscriptionIds = inscriptions.map((i) => i.id);
  const sessionIds = Array.from(new Set(inscriptions.map((i) => i.session_id)));
  const { data: triggers } = await supabase
    .from("session_step_triggers")
    .select("id, session_id, step_type, creneau_id, triggered_at")
    .in("session_id", sessionIds)
    .order("triggered_at", { ascending: true });
  if (!triggers?.length) {
    return NextResponse.json({ pending: null });
  }
  const { data: completions } = await supabase
    .from("step_completions")
    .select("inscription_id, step_type, creneau_id")
    .in("inscription_id", inscriptionIds);
  const completedSet = new Set(
    (completions || []).map(
      (c) => `${c.inscription_id}-${c.step_type}-${c.creneau_id ?? "null"}`
    )
  );
  const inscriptionBySession = Object.fromEntries(
    inscriptions.map((i) => [i.session_id, i.id])
  );
  for (const t of triggers) {
    const inscriptionId = inscriptionBySession[t.session_id];
    if (!inscriptionId) continue;
    const key = `${inscriptionId}-${t.step_type}-${t.creneau_id ?? "null"}`;
    if (completedSet.has(key)) continue;
    const sessionRow = await supabase
      .from("sessions")
      .select("nom")
      .eq("id", t.session_id)
      .single();
    const creneauRow = t.creneau_id
      ? await supabase
          .from("session_creneaux")
          .select("ordre")
          .eq("id", t.creneau_id)
          .single()
      : { data: null };
    return NextResponse.json({
      pending: {
        trigger_id: t.id,
        inscription_id: inscriptionId,
        session_id: t.session_id,
        session_nom: sessionRow.data?.nom ?? "",
        step_type: t.step_type,
        creneau_id: t.creneau_id ?? null,
        creneau_ordre: creneauRow.data?.ordre ?? null,
      },
    });
  }
  return NextResponse.json({ pending: null });
}
