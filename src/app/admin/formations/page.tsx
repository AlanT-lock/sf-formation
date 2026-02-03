import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { FileText } from "lucide-react";

export default async function AdminFormationsPage() {
  const { data: formations } = await supabase
    .from("formations")
    .select("id, nom, created_at")
    .order("nom");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Formations</h1>
        <p className="text-slate-600 mt-1">
          Gérer les tests, documents et questions par formation (stagiaires)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des formations</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Cliquez sur une formation pour gérer ses documents (tests) et les questions associées.
          </p>
        </CardHeader>
        <CardContent>
          {!formations?.length ? (
            <p className="text-slate-500 text-sm py-4">Aucune formation.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {formations.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/admin/formations/${f.id}`}
                    className="flex items-center gap-3 py-4 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition"
                  >
                    <div className="p-2 rounded-lg bg-primary-50">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{f.nom}</p>
                      <p className="text-sm text-slate-500">
                        Documents et questions pour les stagiaires
                      </p>
                    </div>
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
