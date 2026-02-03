"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SignaturePad } from "@/components/stagiaire/SignaturePad";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import type { StepType, DocumentType } from "@/types/database";

const STEP_LABELS: Record<StepType, string> = {
  test_pre: "Test de pré-formation",
  emargement: "Émargement",
  points_cles: "Test Points clés",
  test_fin: "Test de fin de formation",
  enquete_satisfaction: "Enquête de satisfaction",
  bilan_final: "Bilan final",
};

const STEP_TO_DOC: Record<StepType, DocumentType | null> = {
  test_pre: "test_pre",
  points_cles: "points_cles",
  test_fin: "test_fin",
  enquete_satisfaction: "enquete_satisfaction",
  emargement: null,
  bilan_final: null,
};

interface Question {
  id: string;
  ordre: number;
  libelle: string;
  type_reponse: string;
  options: Record<string, unknown> | null;
}

function EtapePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inscriptionId = searchParams.get("inscription_id");
  const stepType = searchParams.get("step_type") as StepType | null;
  const creneauId = searchParams.get("creneau_id") || null;
  const sessionNom = searchParams.get("session_nom") || "Session";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [reponses, setReponses] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useEffect(() => {
    if (!inscriptionId || !stepType || stepType === "emargement") {
      setLoadingQuestions(false);
      return;
    }
    const doc = STEP_TO_DOC[stepType];
    if (!doc) {
      setLoadingQuestions(false);
      return;
    }
    const url = `/api/stagiaire/questions?document_type=${doc}&inscription_id=${encodeURIComponent(inscriptionId)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setQuestions(Array.isArray(data) ? data : []))
      .catch(() => setQuestions([]))
      .finally(() => setLoadingQuestions(false));
  }, [inscriptionId, stepType]);

  useEffect(() => {
    if (!inscriptionId || !stepType) {
      router.replace("/stagiaire");
    }
  }, [inscriptionId, stepType, router]);

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!inscriptionId || !stepType) return;
    setLoading(true);
    try {
      const reponsesList = Object.entries(reponses).map(([question_id, val]) => ({
        question_id,
        valeur: typeof val === "string" ? val : JSON.stringify(val),
      }));
      const res = await fetch("/api/stagiaire/reponses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inscription_id: inscriptionId, reponses: reponsesList }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const compRes = await fetch("/api/stagiaire/complete-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inscription_id: inscriptionId,
          step_type: stepType,
          creneau_id: creneauId,
        }),
      });
      if (!compRes.ok) throw new Error((await compRes.json()).error);
      toast.success("Enregistré");
      router.push("/stagiaire");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function handleSignatureSave(dataUrl: string) {
    if (!inscriptionId || stepType !== "emargement") return;
    setLoading(true);
    fetch("/api/stagiaire/emargement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inscription_id: inscriptionId,
        creneau_id: creneauId,
        signature_data: dataUrl,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return fetch("/api/stagiaire/complete-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inscription_id: inscriptionId,
            step_type: "emargement",
            creneau_id: creneauId,
          }),
        });
      })
      .then((r) => {
        if (!r.ok) throw new Error();
        toast.success("Émargement enregistré");
        router.push("/stagiaire");
        router.refresh();
      })
      .catch(() => toast.error("Erreur"))
      .finally(() => setLoading(false));
  }

  if (!inscriptionId || !stepType) {
    return null;
  }

  const isEmargement = stepType === "emargement";
  const label =
    STEP_LABELS[stepType] +
    (creneauId && stepType === "emargement" ? " (créneau)" : "");

  return (
    <div className="space-y-6">
      <Link
        href="/stagiaire"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à mon espace
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{label}</CardTitle>
          <p className="text-sm text-slate-500 mt-1">Session : {sessionNom}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEmargement && (
            <SignaturePad
              label="Signez pour valider votre présence (date et heure enregistrées automatiquement)."
              onSave={handleSignatureSave}
              onCancel={() => router.push("/stagiaire")}
            />
          )}

          {!isEmargement && loadingQuestions && (
            <p className="text-slate-500 text-sm">Chargement des questions...</p>
          )}

          {!isEmargement && !loadingQuestions && questions.length > 0 && (
            <form onSubmit={handleSubmitForm} className="space-y-6">
              {questions.map((q) => (
                <div key={q.id}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {q.libelle}
                  </label>
                  {q.type_reponse === "texte_libre" && (
                    <textarea
                      value={(reponses[q.id] as string) ?? ""}
                      onChange={(e) =>
                        setReponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      rows={3}
                      required
                    />
                  )}
                  {q.type_reponse === "echelle" && (
                    <select
                      value={(reponses[q.id] as string) ?? ""}
                      onChange={(e) =>
                        setReponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      required
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
                            checked={(reponses[q.id] as string) === opt}
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
                      value={(reponses[q.id] as string) ?? ""}
                      onChange={(e) =>
                        setReponses((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      required
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer"}
                </Button>
                <Link href="/stagiaire">
                  <Button type="button" variant="ghost">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          )}

          {!isEmargement && !loadingQuestions && questions.length === 0 && (
            <p className="text-slate-500 text-sm">
              Aucune question pour cette étape. Contactez le formateur.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EtapePage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-slate-500">Chargement...</div>}>
      <EtapePageContent />
    </Suspense>
  );
}
