"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StepModal } from "@/components/stagiaire/StepModal";

interface PendingStep {
  trigger_id: string;
  inscription_id: string;
  session_id: string;
  session_nom: string;
  step_type: string;
  creneau_id: string | null;
  creneau_ordre: number | null;
}

export default function StagiaireDashboardPage() {
  const [pending, setPending] = useState<PendingStep | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/stagiaire/pending-step");
      const data = await res.json();
      setPending(data.pending ?? null);
    } catch {
      setPending(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 15000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Mon espace</h1>
      <p className="text-slate-600 text-sm">
        Lorsque le formateur vous envoie une étape (test, émargement, enquête…), elle apparaîtra ici en popup.
      </p>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            Chargement...
          </CardContent>
        </Card>
      ) : pending ? (
        <Card className="border-primary-200 bg-primary-50/30">
          <CardHeader>
            <CardTitle className="text-primary-800">
              Une étape vous attend
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Session : {pending.session_nom}. Ouvrez la popup ci-dessus ou rafraîchissez la page si elle ne s&apos;est pas affichée.
            </p>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            Aucune étape en attente. Le formateur déclenchera les étapes pendant la formation.
          </CardContent>
        </Card>
      )}

      <StepModal
        pending={pending}
        onClose={() => setPending(null)}
        onComplete={fetchPending}
      />
    </div>
  );
}
