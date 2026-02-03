"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SignaturePad } from "./SignaturePad";
import toast from "react-hot-toast";
import type { StepType } from "@/types/database";
import type { DocumentType } from "@/types/database";

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

interface PendingStep {
  trigger_id: string;
  inscription_id: string;
  session_id: string;
  session_nom: string;
  step_type: StepType;
  creneau_id: string | null;
  creneau_ordre: number | null;
}

interface StepModalProps {
  pending: PendingStep | null;
  onClose: () => void;
  onComplete: () => void;
}

export function StepModal({ pending, onClose, onComplete }: StepModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reponses, setReponses] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [showSignature, setShowSignature] = useState(true);

  useEffect(() => {
    if (!pending) return;
    const doc = STEP_TO_DOC[pending.step_type];
    if (doc) {
      fetch(`/api/stagiaire/questions?document_type=${doc}`)
        .then((r) => r.json())
        .then((data) => setQuestions(Array.isArray(data) ? data : []))
        .catch(() => setQuestions([]));
    } else {
      setQuestions([]);
    }
    setReponses({});
    setShowSignature(true);
  }, [pending]);

  if (!pending) return null;

  const isEmargement = pending.step_type === "emargement";

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const reponsesList = Object.entries(reponses).map(([question_id, val]) => ({
        question_id,
        valeur: typeof val === "string" ? val : JSON.stringify(val),
      }));
      const res = await fetch("/api/stagiaire/reponses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inscription_id: pending.inscription_id,
          reponses: reponsesList,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const compRes = await fetch("/api/stagiaire/complete-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inscription_id: pending.inscription_id,
          step_type: pending.step_type,
          creneau_id: pending.creneau_id,
        }),
      });
      if (!compRes.ok) throw new Error((await compRes.json()).error);
      toast.success("Enregistré");
      onComplete();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function handleSignatureSave(dataUrl: string) {
    setLoading(true);
    fetch("/api/stagiaire/emargement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inscription_id: pending.inscription_id,
        creneau_id: pending.creneau_id,
        signature_data: dataUrl,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return fetch("/api/stagiaire/complete-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inscription_id: pending.inscription_id,
            step_type: "emargement",
            creneau_id: pending.creneau_id,
          }),
        });
      })
      .then((r) => {
        if (!r.ok) throw new Error();
        toast.success("Émargement enregistré");
        onComplete();
        onClose();
      })
      .catch(() => toast.error("Erreur"))
      .finally(() => setLoading(false));
  }

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {STEP_LABELS[pending.step_type]}
            {pending.creneau_ordre != null && ` — Créneau ${pending.creneau_ordre}`}
          </CardTitle>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
          >
            ×
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">Session : {pending.session_nom}</p>

          {isEmargement && (
            <SignaturePad
              label="Signez pour valider votre présence (date et heure enregistrées automatiquement)."
              onSave={handleSignatureSave}
              onCancel={onClose}
            />
          )}

          {!isEmargement && questions.length > 0 && (
            <form onSubmit={handleSubmitForm} className="space-y-4">
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
                <Button type="button" variant="ghost" onClick={onClose}>
                  Annuler
                </Button>
              </div>
            </form>
          )}

          {!isEmargement && questions.length === 0 && !loading && (
            <p className="text-slate-500 text-sm">
              Aucune question pour cette étape. Contactez le formateur.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : null;
}
