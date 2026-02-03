import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { StagiairesList } from "@/components/admin/StagiairesList";

export default async function AdminStagiairesPage() {
  const { data: stagiaires } = await supabase
    .from("stagiaires")
    .select(`
      id,
      nom,
      prenom,
      user_id,
      created_at
    `)
    .order("nom");

  const { data: users } = await supabase
    .from("users")
    .select("id, username, first_login_done")
    .eq("role", "stagiaire");

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
          <h1 className="text-2xl font-bold text-slate-800">Stagiaires</h1>
          <p className="text-slate-600 mt-1">Gérer les stagiaires et leurs identifiants</p>
        </div>
        <Link href="/admin/stagiaires/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouveau stagiaire
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des stagiaires</CardTitle>
        </CardHeader>
        <CardContent>
          <StagiairesList
            stagiaires={stagiaires || []}
            usersByUserId={usersByUserId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
