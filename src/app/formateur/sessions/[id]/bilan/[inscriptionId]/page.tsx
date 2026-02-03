"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

interface Question {
  id: string;
  ordre: number;
  libelle: string;
  type_reponse: string;
  options: Record<string, unknown> | null;
}

export default function FormateurBilanPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const inscriptionId = params.inscriptionId as string;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stagiaire, setStagiaire] = useState<{ nom: string; prenom: string } | null>(null);
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/formateur/sessions/${sessionId}/bilan-final?inscription_id=${encodeURIComponent(inscriptionId)}`
        );
        if (!res.ok) {
          toast.error("Données non disponibles");
          router.push(`/formateur/sessions/${sessionId}`);
          return;
        }
        const data = await res.json();
        setStagiaire(data.stagiaire ?? null);
        setQuestions(Array.isArray(data.questions) ? data.questions : []);
      } catch {
        toast.error("Erreur réseau");
        router.push(`/formateur/sessions/${sessionId}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, inscriptionId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const reponsesList = Object.entries(reponses).map(([question_id, valeur]) => ({
        question_id,
        valeur: valeur || null,
      }));
      const res = await fetch(`/api/formateur/sessions/${sessionId}/bilan-final`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inscription_id: inscriptionId, reponses: reponsesList }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur");
      }
      toast.success("Bilan final enregistré");
      router.push(`/formateur/sessions/${sessionId}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-slate-500">Chargement...</div>
    );
  }

  const nomStagiaire = stagiaire ? `${stagiaire.prenom} ${stagiaire.nom}` : "—";

  return (
    <div className="space-y-6">
      <Link
        href={`/formateur/sessions/${sessionId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la session
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Bilan final — {nomStagiaire}</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Remplissez le bilan final pour ce stagiaire.
          </p>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <p className="text-slate-500 text-sm">Aucune question pour le bilan final.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {questions
                .sort((a, b) => a.ordre - b.ordre)
                .map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {q.libelle}
                    </label>
                    {q.type_reponse === "texte_libre" && (
                      <textarea
                        value={reponses[q.id] ?? ""}
                        onChange={(e) =>
                          setReponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        rows={3}
                      />
                    )}
                    {q.type_reponse === "echelle" && (
                      <select
                        value={reponses[q.id] ?? ""}
                        onChange={(e) =>
                          setReponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="">Choisir...</option>
                        {(q.options as { options?: string[] })?.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                    {q.type_reponse === "qcm" && (
                      <div className="space-y-2">
                        {(q.options as { options?: string[] })?.options?.map((opt) => (
                          <label key={opt} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={(reponses[q.id] ?? "") === opt}
                              onChange={() =>
                                setReponses((prev) => ({ ...prev, [q.id]: opt }))
                              }
                              className="rounded border-slate-300"
                            />
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type_reponse === "liste" && (
                      <input
                        type="text"
                        value={reponses[q.id] ?? ""}
                        onChange={(e) =>
                          setReponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    )}
                  </div>
                ))}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer le bilan"}
                </Button>
                <Link href={`/formateur/sessions/${sessionId}`}>
                  <Button type="button" variant="ghost">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
