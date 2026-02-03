import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const formation_id = searchParams.get("formation_id") || undefined;
  const session_id = searchParams.get("session_id") || undefined;

  const { data: formations } = await supabase
    .from("formations")
    .select("id, nom")
    .order("nom");
  const { data: sessionsWithTrigger } = await supabase
    .from("session_step_triggers")
    .select("session_id")
    .eq("step_type", "enquete_satisfaction");
  const triggeredSessionIds = Array.from(
    new Set((sessionsWithTrigger ?? []).map((s) => s.session_id))
  );
  if (triggeredSessionIds.length === 0) {
    return NextResponse.json({
      formations: formations ?? [],
      sessions: [],
      questions: [],
      stats: { total_invited: 0, total_responded: 0, response_rate: 0 },
      responses_by_question: [],
      raw_responses: [],
    });
  }

  let sessionsQuery = supabase
    .from("sessions")
    .select("id, nom, formation_id, formation:formations(nom)")
    .in("id", triggeredSessionIds);
  if (formation_id) sessionsQuery = sessionsQuery.eq("formation_id", formation_id);
  if (session_id) sessionsQuery = sessionsQuery.eq("id", session_id);
  const { data: sessions } = await sessionsQuery.order("created_at", { ascending: false });

  const filteredSessionIds = (sessions ?? []).map((s) => s.id);
  const formationIds = Array.from(
    new Set((sessions ?? []).map((s) => (s as { formation_id: string }).formation_id))
  );

  let questions: { id: string; formation_id: string; ordre: number; libelle: string; type_reponse: string; options: unknown }[] = [];
  if (formationIds.length > 0) {
    const { data: qData } = await supabase
      .from("questions")
      .select("id, formation_id, document_type, ordre, libelle, type_reponse, options")
      .eq("document_type", "enquete_satisfaction")
      .in("formation_id", formationIds)
      .order("formation_id")
      .order("ordre");
    questions = (qData ?? []) as typeof questions;
  }

  const { data: inscriptions } = await supabase
    .from("inscriptions")
    .select("id, session_id")
    .in("session_id", filteredSessionIds);
  const inscriptionIds = (inscriptions ?? []).map((i) => i.id);
  const inscriptionBySession = (inscriptions ?? []).reduce(
    (acc, i) => {
      if (!acc[i.session_id]) acc[i.session_id] = [];
      acc[i.session_id].push(i.id);
      return acc;
    },
    {} as Record<string, string[]>
  );

  const total_invited = inscriptionIds.length;

  let total_responded = 0;
  if (inscriptionIds.length > 0) {
    const { count } = await supabase
      .from("step_completions")
      .select("id", { count: "exact", head: true })
      .eq("step_type", "enquete_satisfaction")
      .in("inscription_id", inscriptionIds);
    total_responded = count ?? 0;
  }

  const response_rate =
    total_invited > 0 ? Math.round((total_responded / total_invited) * 100) : 0;

  const questionIds = (questions ?? []).map((q) => q.id);
  let reponsesList: { inscription_id: string; question_id: string; valeur: string | null }[] = [];
  if (questionIds.length > 0 && inscriptionIds.length > 0) {
    const { data: reponses } = await supabase
      .from("reponses")
      .select("inscription_id, question_id, valeur")
      .in("question_id", questionIds)
      .in("inscription_id", inscriptionIds);
    reponsesList = (reponses ?? []) as {
      inscription_id: string;
      question_id: string;
      valeur: string | null;
    }[];
  }

  const sessionById = (sessions ?? []).reduce(
    (acc, s) => {
      acc[s.id] = s as { id: string; nom: string; formation_id: string };
      return acc;
    },
    {} as Record<string, { id: string; nom: string; formation_id: string }>
  );
  const inscriptionToSession = (inscriptions ?? []).reduce(
    (acc, i) => {
      acc[i.id] = i.session_id;
      return acc;
    },
    {} as Record<string, string>
  );

  const distributionByQuestion: Record<
    string,
    { value: string; count: number; session_ids?: string[] }[]
  > = {};
  const textResponsesByQuestion: Record<
    string,
    { value: string; session_nom: string; inscription_id: string }[]
  > = {};

  for (const q of questions) {
    const qReponses = reponsesList.filter((r) => r.question_id === q.id);
    if (q.type_reponse === "texte_libre") {
      textResponsesByQuestion[q.id] = qReponses
        .filter((r) => r.valeur != null && String(r.valeur).trim() !== "")
        .map((r) => ({
          value: String(r.valeur),
          session_nom: sessionById[inscriptionToSession[r.inscription_id]]?.nom ?? "—",
          inscription_id: r.inscription_id,
        }));
      continue;
    }
    const countByValue: Record<string, { count: number; session_ids: Set<string> }> = {};
    for (const r of qReponses) {
      const val = r.valeur ?? "";
      if (!countByValue[val]) {
        countByValue[val] = { count: 0, session_ids: new Set() };
      }
      countByValue[val].count += 1;
      const sid = inscriptionToSession[r.inscription_id];
      if (sid) countByValue[val].session_ids.add(sid);
    }
    distributionByQuestion[q.id] = Object.entries(countByValue).map(
      ([value, { count, session_ids }]) => ({
        value,
        count,
        session_ids: Array.from(session_ids),
      })
    );
  }

  const responses_by_question = questions.map((q) => ({
    id: q.id,
    formation_id: q.formation_id,
    ordre: q.ordre,
    libelle: q.libelle,
    type_reponse: q.type_reponse,
    options: q.options,
    total_responses: reponsesList.filter((r) => r.question_id === q.id).length,
    distribution:
      q.type_reponse === "texte_libre"
        ? []
        : (distributionByQuestion[q.id] ?? []).sort((a, b) => b.count - a.count),
    text_responses:
      q.type_reponse === "texte_libre" ? textResponsesByQuestion[q.id] ?? [] : [],
  }));

  const raw_responses = reponsesList.map((r) => {
    const q = questions.find((x) => x.id === r.question_id);
    return {
      question_id: r.question_id,
      question_libelle: q?.libelle ?? "",
      inscription_id: r.inscription_id,
      session_id: inscriptionToSession[r.inscription_id],
      session_nom: sessionById[inscriptionToSession[r.inscription_id]]?.nom ?? "",
      valeur: r.valeur ?? "",
    };
  });

  return NextResponse.json({
    formations: formations ?? [],
    sessions: (sessions ?? []).map((s: { id: string; nom: string; formation_id: string; formation?: { nom: string } | { nom: string }[] }) => ({
      id: (s as { id: string }).id,
      nom: (s as { nom: string }).nom,
      formation_id: (s as { formation_id: string }).formation_id,
      formation_nom:
        Array.isArray((s as { formation?: { nom: string }[] }).formation)
          ? (s.formation as { nom: string }[])?.[0]?.nom
          : (s.formation as { nom: string })?.nom ?? "",
    })),
    questions,
    stats: {
      total_invited,
      total_responded,
      response_rate,
      sessions_count: filteredSessionIds.length,
    },
    responses_by_question: responses_by_question.sort((a, b) => a.ordre - b.ordre),
    raw_responses,
  });
}
