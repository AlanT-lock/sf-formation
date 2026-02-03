import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { Calendar, Users, GraduationCap, ArrowRight, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    { count: sessionsCount },
    { count: stagiairesCount },
    { count: formateursCount },
  ] = await Promise.all([
    supabase.from("sessions").select("id", { count: "exact", head: true }),
    supabase.from("stagiaires").select("id", { count: "exact", head: true }),
    supabase.from("formateurs").select("id", { count: "exact", head: true }),
  ]);

  const { data: rawSessions } = await supabase
    .from("sessions")
    .select(`
      id,
      nom,
      nb_creneaux,
      created_at,
      formateur:formateurs(nom, prenom)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  type FormateurRef = { nom: string; prenom: string } | null;
  const recentSessions = (rawSessions ?? []).map((s) => ({
    id: s.id,
    nom: s.nom,
    nb_creneaux: s.nb_creneaux,
    created_at: s.created_at,
    formateur: Array.isArray(s.formateur) ? (s.formateur[0] as FormateurRef) ?? null : (s.formateur as FormateurRef),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
        <p className="text-slate-600 mt-1">Vue d&apos;ensemble de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/sessions">
          <Card className="hover:border-primary-300 hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50">
                  <Calendar className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{sessionsCount ?? 0}</p>
                  <p className="text-sm text-slate-600">Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/stagiaires">
          <Card className="hover:border-primary-300 hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stagiairesCount ?? 0}</p>
                  <p className="text-sm text-slate-600">Stagiaires</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/formateurs">
          <Card className="hover:border-primary-300 hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50">
                  <GraduationCap className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{formateursCount ?? 0}</p>
                  <p className="text-sm text-slate-600">Formateurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/satisfaction">
          <Card className="hover:border-primary-300 hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Enquête de satisfaction</p>
                  <p className="text-xs text-slate-500 mt-0.5">Voir le dashboard</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sessions récentes</CardTitle>
          <Link
            href="/admin/sessions"
            className="text-sm font-medium text-primary-600 hover:underline flex items-center gap-1"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {!recentSessions?.length ? (
            <p className="text-slate-500 text-sm">Aucune session pour le moment.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentSessions.map((s) => (
                <li key={s.id} className="py-3 first:pt-0">
                  <Link
                    href={`/admin/sessions/${s.id}`}
                    className="flex items-center justify-between hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg transition"
                  >
                    <span className="font-medium text-slate-800">{s.nom}</span>
                    <span className="text-sm text-slate-500">
                      {s.nb_creneaux} créneau(x)
                      {s.formateur ? ` • ${s.formateur.prenom} ${s.formateur.nom}` : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
