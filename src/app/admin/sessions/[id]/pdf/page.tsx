import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Download, FileText } from "lucide-react";

const DOCUMENTS = [
  { id: "analyse_besoins", label: "Analyse des besoins" },
  { id: "emargement", label: "Feuille d'émargement" },
  { id: "test_pre", label: "Test de pré-formation" },
  { id: "points_cles", label: "Test Points clés" },
  { id: "test_fin", label: "Test de fin de formation" },
  { id: "enquete_satisfaction", label: "Enquête de satisfaction" },
] as const;

export default async function AdminSessionPdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, nom")
    .eq("id", id)
    .single();
  if (error || !session) notFound();

  const { data: inscriptions } = await supabase
    .from("inscriptions")
    .select(`
      id,
      stagiaire:stagiaires(nom, prenom)
    `)
    .eq("session_id", id)
    .order("created_at");

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/sessions/${id}`}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la session
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Export PDF</h1>
        <p className="text-slate-600 mt-1">
          {session.nom} — Téléchargez un document par stagiaire.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents par stagiaire
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Un fichier par type de document. Cliquez pour télécharger le PDF.
          </p>
        </CardHeader>
        <CardContent>
          {!inscriptions?.length ? (
            <p className="text-slate-500 text-sm py-4">Aucun stagiaire inscrit.</p>
          ) : (
            <div className="space-y-6">
              {inscriptions.map((ins) => {
                const st = ins.stagiaire as { nom: string; prenom: string } | null;
                const nomStagiaire = st ? `${st.prenom} ${st.nom}` : "—";
                return (
                  <div key={ins.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <h3 className="font-semibold text-slate-800 mb-3">{nomStagiaire}</h3>
                    <div className="flex flex-wrap gap-2">
                      {DOCUMENTS.map((doc) => (
                        <a
                          key={doc.id}
                          href={`/api/admin/export-pdf?inscription_id=${ins.id}&document=${doc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-primary-300 transition"
                        >
                          <Download className="w-4 h-4" />
                          {doc.label}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
