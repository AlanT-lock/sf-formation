import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminFormateursPage() {
  const { data: formateurs } = await supabase
    .from("formateurs")
    .select("id, nom, prenom, user_id, created_at")
    .order("nom");

  const { data: users } = await supabase
    .from("users")
    .select("id, username, first_login_done")
    .eq("role", "formateur");

  const usersByUserId = (users || []).reduce(
    (acc, u) => {
      acc[u.id] = u;
      return acc;
    },
    {} as Record<string, { username: string; first_login_done: boolean }>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Formateurs</h1>
          <p className="text-slate-600 mt-1">Gérer les formateurs et leurs identifiants</p>
        </div>
        <Link href="/admin/formateurs/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouveau formateur
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des formateurs</CardTitle>
        </CardHeader>
        <CardContent>
          {!formateurs?.length ? (
            <p className="text-slate-500 text-sm py-4">
              Aucun formateur. Créez-en un depuis le bouton ci-dessus.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600 font-medium">
                    <th className="py-3 pr-4">Nom</th>
                    <th className="py-3 pr-4">Prénom</th>
                    <th className="py-3 pr-4">Identifiant</th>
                    <th className="py-3 pr-4">Première connexion</th>
                  </tr>
                </thead>
                <tbody>
                  {formateurs.map((f) => {
                    const user = usersByUserId[f.user_id];
                    return (
                      <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 pr-4 font-medium text-slate-800">{f.nom}</td>
                        <td className="py-3 pr-4 text-slate-700">{f.prenom}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-slate-700">
                          {user?.username ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          {user?.first_login_done ? (
                            <span className="text-green-600 text-xs">Oui</span>
                          ) : (
                            <span className="text-amber-600 text-xs">À définir</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
