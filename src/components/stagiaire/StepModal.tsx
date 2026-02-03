"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { StepType, PendingStep } from "@/types/database";

const STEP_LABELS: Record<StepType, string> = {
  test_pre: "Test de pré-formation",
  emargement: "Émargement",
  points_cles: "Test Points clés",
  test_fin: "Test de fin de formation",
  enquete_satisfaction: "Enquête de satisfaction",
  bilan_final: "Bilan final",
};

interface StepModalProps {
  pending: PendingStep | null;
  onClose: () => void;
  onComplete: () => void;
}

export function StepModal({ pending, onClose, onComplete }: StepModalProps) {
  if (!pending) return null;

  const searchParams = new URLSearchParams({
    inscription_id: pending.inscription_id,
    step_type: pending.step_type,
    session_nom: pending.session_nom || "Session",
  });
  if (pending.creneau_id) searchParams.set("creneau_id", pending.creneau_id);

  const etapeUrl = `/stagiaire/etape?${searchParams.toString()}`;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {STEP_LABELS[pending.step_type]}
            {pending.creneau_ordre != null && ` — Créneau ${pending.creneau_ordre}`}
          </CardTitle>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">Session : {pending.session_nom}</p>
          <p className="text-sm text-slate-500">
            Une tâche vous attend. Cliquez sur &quot;Commencer&quot; pour accéder au formulaire et la remplir.
          </p>
          <div className="flex gap-2 pt-2">
            <Link href={etapeUrl} onClick={onClose}>
              <Button size="lg" className="w-full sm:w-auto">
                Commencer
              </Button>
            </Link>
            <Button type="button" variant="ghost" onClick={onClose}>
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : null;
}
