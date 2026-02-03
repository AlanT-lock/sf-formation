import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Calendar, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const { data: sessions } = await supabase
    .from("sessions")
    .select(`
      id,
      nom,
      nb_creneaux,
      created_at,
      formation:formations(id, nom),
      formateur:formateurs(id, nom, prenom)
    `)
    .order("created_at", { ascending: false });

  const sessionIds = (sessions || []).map((s) => s.id);
  const { data: counts } = sessionIds.length
    ? await supabase
        .from("inscriptions")
        .select("session_id")
        .in("session_id", sessionIds)
    : { data: [] };
  const countBySession = (counts || []).reduce(
    (acc, row) => {
      acc[row.session_id] = (acc[row.session_id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sessions</h1>
          <p className="text-slate-600 mt-1">Créer et gérer les sessions de formation</p>
        </div>
        <Link href="/admin/sessions/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle session
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {!sessions?.length ? (
            <p className="text-slate-500 text-sm py-4">
              Aucune session. Créez-en une depuis le bouton ci-dessus.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sessions.map((s) => {
                type FormationRef = { id: string; nom: string } | null;
                type FormateurRef = { id: string; nom: string; prenom: string } | null;
                const formation: FormationRef = Array.isArray(s.formation)
                  ? (s.formation[0] as FormationRef) ?? null
                  : (s.formation as FormationRef);
                const formateur: FormateurRef = Array.isArray(s.formateur)
                  ? (s.formateur[0] as FormateurRef) ?? null
                  : (s.formateur as FormateurRef);
                const nbInscrits = countBySession[s.id] ?? 0;
                return (
                  <li key={s.id} className="py-4 first:pt-0">
                    <Link
                      href={`/admin/sessions/${s.id}`}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary-50">
                          <Calendar className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{s.nom}</p>
                          <p className="text-sm text-slate-500">
                            {formation?.nom ?? "—"} • {s.nb_creneaux} créneau(x)
                            {formateur && ` • ${formateur.prenom} ${formateur.nom}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4" />
                        {nbInscrits} stagiaire(s)
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
