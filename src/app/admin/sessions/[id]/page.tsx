import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Users, Calendar, Download } from "lucide-react";
import { InscriptionsBlock } from "@/components/admin/InscriptionsBlock";

export default async function AdminSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: session, error } = await supabase
    .from("sessions")
    .select(`
      id,
      nom,
      nb_creneaux,
      created_at,
      formation:formations(id, nom),
      formateur:formateurs(id, nom, prenom),
      session_dates(id, date),
      session_creneaux(id, ordre, heure_debut, heure_fin)
    `)
    .eq("id", id)
    .single();

  if (error || !session) notFound();

  const { data: inscriptions } = await supabase
    .from("inscriptions")
    .select(`
      id,
      stagiaire_id,
      analyse_besoins_texte,
      created_at,
      stagiaire:stagiaires(id, nom, prenom)
    `)
    .eq("session_id", id)
    .order("created_at");

  type FormationRef = { id: string; nom: string } | null;
  type FormateurRef = { id: string; nom: string; prenom: string } | null;
  const formation: FormationRef = Array.isArray(session.formation)
    ? (session.formation[0] as FormationRef) ?? null
    : (session.formation as FormationRef);
  const formateur: FormateurRef = Array.isArray(session.formateur)
    ? (session.formateur[0] as FormateurRef) ?? null
    : (session.formateur as FormateurRef);
  const sessionDates = (session.session_dates || []) as { id: string; date: string }[];
  const creneaux = (session.session_creneaux || []) as {
    id: string;
    ordre: number;
    heure_debut: string | null;
    heure_fin: string | null;
  }[];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/sessions"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux sessions
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{session.nom}</h1>
          <p className="text-slate-600 mt-1">
            {formation?.nom ?? "—"} • {session.nb_creneaux} créneau(x)
            {formateur && ` • Formateur : ${formateur.prenom} ${formateur.nom}`}
          </p>
        </div>
        <Link href={`/admin/sessions/${id}/pdf`}>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter PDF
          </Button>
        </Link>
      </div>

      {sessionDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {sessionDates.map((d) => (
                <li
                  key={d.id}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm"
                >
                  {new Date(d.date).toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {creneaux.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Créneaux d&apos;émargement</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Heures renseignées par le formateur pendant la session
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {creneaux.sort((a, b) => a.ordre - b.ordre).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-sm"
                >
                  <span className="font-medium text-slate-700">Créneau {c.ordre}</span>
                  <span className="text-slate-500">
                    {c.heure_debut
                      ? new Date(c.heure_debut).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                    {" → "}
                    {c.heure_fin
                      ? new Date(c.heure_fin).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <InscriptionsBlock
        sessionId={id}
        inscriptions={inscriptions || []}
        sessionNom={session.nom}
      />
    </div>
  );
}
