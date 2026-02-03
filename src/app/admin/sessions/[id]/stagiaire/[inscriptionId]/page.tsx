"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import type { DocumentType } from "@/types/database";

interface ReponsesData {
  inscription: { id: string; session_id: string; analyse_besoins_texte: string | null };
  stagiaire: { nom: string; prenom: string } | null;
  session_nom: string | null;
  formation_nom: string | null;
  documents: {
    document_type: DocumentType;
    nom_affiche: string;
    questions: { id: string; libelle: string; ordre: number }[];
    reponses: Record<string, string>;
  }[];
  emargements: { creneau_ordre: number | null; signed_at: string; signature_data: string }[];
}

export default function AdminStagiaireReponsesPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const inscriptionId = params.inscriptionId as string;
  const [data, setData] = useState<ReponsesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/inscriptions/${inscriptionId}/reponses`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error || "Erreur");
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError("Erreur réseau");
      } finally {
        setLoading(false);
      }
    })();
  }, [inscriptionId]);

  if (loading) {
    return (
      <div className="py-8 text-center text-slate-500">Chargement...</div>
    );
  }
  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link
          href={`/admin/sessions/${sessionId}`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la session
        </Link>
        <p className="text-red-600">{error ?? "Données introuvables"}</p>
      </div>
    );
  }

  const nomStagiaire = data.stagiaire
    ? `${data.stagiaire.prenom} ${data.stagiaire.nom}`
    : "—";

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/sessions/${sessionId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la session
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Réponses du stagiaire</h1>
        <p className="text-slate-600 mt-1">
          {nomStagiaire} — {data.session_nom ?? "—"} — {data.formation_nom ?? "—"}
        </p>
      </div>

      {/* Analyse des besoins */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse des besoins</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 whitespace-pre-wrap">
            {data.inscription.analyse_besoins_texte || "—"}
          </p>
        </CardContent>
      </Card>

      {/* Émargements avec signatures */}
      {data.emargements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Émargements (signatures)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.emargements.map((e, idx) => (
              <div
                key={idx}
                className="p-4 border border-slate-200 rounded-lg space-y-2"
              >
                <p className="text-sm font-medium text-slate-700">
                  Créneau {e.creneau_ordre ?? "?"} —{" "}
                  {e.signed_at
                    ? new Date(e.signed_at).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })
                    : "—"}
                </p>
                {e.signature_data && (
                  <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 inline-block">
                    <img
                      src={e.signature_data}
                      alt={`Signature créneau ${e.creneau_ordre ?? idx + 1}`}
                      className="max-h-24 max-w-[200px] object-contain"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Documents (tests) avec questions / réponses */}
      {data.documents.map((doc) => (
        <Card key={doc.document_type}>
          <CardHeader>
            <CardTitle>{doc.nom_affiche}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {doc.questions.length === 0 ? (
              <p className="text-slate-500 text-sm">Aucune question.</p>
            ) : (
              <ul className="space-y-3">
                {doc.questions
                  .sort((a, b) => a.ordre - b.ordre)
                  .map((q) => (
                    <li key={q.id} className="border-b border-slate-100 pb-3 last:border-0">
                      <p className="text-sm font-medium text-slate-800">{q.libelle}</p>
                      <p className="text-slate-600 mt-1">
                        {doc.reponses[q.id] ?? "—"}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}

      <Link href={`/admin/sessions/${sessionId}`}>
        <Button variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour à la session
        </Button>
      </Link>
    </div>
  );
}
