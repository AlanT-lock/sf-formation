import Link from "next/link";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Calendar } from "lucide-react";

export default async function FormateurDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "formateur") return null;
  const { data: formateur } = await supabase
    .from("formateurs")
    .select("id")
    .eq("user_id", session.sub)
    .single();
  if (!formateur) {
    return (
      <p className="text-slate-500">Profil formateur non trouvé.</p>
    );
  }
  const { data: sessions } = await supabase
    .from("sessions")
    .select(`
      id,
      nom,
      nb_creneaux,
      created_at,
      formation:formations(nom)
    `)
    .eq("formateur_id", formateur.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Mes sessions</h1>
      <p className="text-slate-600 text-sm">
        Cliquez sur une session pour la piloter (déclencher les étapes, émargements).
      </p>
      {!sessions?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            Aucune session assignée pour le moment.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => {
            type FormationRef = { nom: string } | null;
            const formation: FormationRef = Array.isArray(s.formation)
              ? (s.formation[0] as FormationRef) ?? null
              : (s.formation as FormationRef);
            return (
              <li key={s.id}>
                <Link href={`/formateur/sessions/${s.id}`}>
                  <Card className="hover:border-primary-300 hover:shadow-md transition cursor-pointer">
                    <CardContent className="py-4 flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary-50">
                        <Calendar className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{s.nom}</p>
                        <p className="text-sm text-slate-500">
                          {formation?.nom ?? "—"} • {s.nb_creneaux} créneau(x)
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
