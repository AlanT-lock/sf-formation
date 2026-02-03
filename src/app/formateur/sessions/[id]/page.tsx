"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Clock,
  FileCheck,
  ClipboardList,
  ThumbsUp,
  FileText,
  PenLine,
} from "lucide-react";
import type { StepType } from "@/types/database";

const STEP_LABELS: Record<StepType, string> = {
  test_pre: "Test de pré-formation",
  emargement: "Émargement",
  points_cles: "Test Points clés",
  test_fin: "Test de fin de formation",
  enquete_satisfaction: "Enquête de satisfaction",
  bilan_final: "Bilan final",
};

interface Creneau {
  id: string;
  ordre: number;
  heure_debut: string | null;
  heure_fin: string | null;
}

interface Trigger {
  id: string;
  step_type: StepType;
  creneau_id: string | null;
  triggered_at: string;
}

interface Session {
  id: string;
  nom: string;
  nb_creneaux: number;
  formation: { nom: string } | null;
  session_creneaux: Creneau[];
  session_step_triggers: Trigger[];
  inscriptions: { id: string; stagiaire: { nom: string; prenom: string } | null }[];
}

export default function FormateurSessionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [creneauTimes, setCreneauTimes] = useState<Record<string, { debut?: string; fin?: string }>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/formateur/sessions/${id}`);
        if (!res.ok) throw new Error("Session non trouvée");
        const data = await res.json();
        setSession(data);
      } catch {
        toast.error("Session non trouvée");
        router.push("/formateur");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  async function triggerStep(stepType: StepType, creneauId?: string) {
    setTriggering(stepType + (creneauId ?? ""));
    try {
      const res = await fetch(`/api/formateur/sessions/${id}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step_type: stepType, creneau_id: creneauId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast.success("Étape envoyée aux stagiaires");
      setSession((prev) =>
        prev
          ? {
              ...prev,
              session_step_triggers: [
                ...prev.session_step_triggers,
                {
                  id: data.id,
                  step_type: stepType,
                  creneau_id: creneauId ?? null,
                  triggered_at: new Date().toISOString(),
                },
              ],
            }
          : null
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setTriggering(null);
    }
  }

  async function updateCreneauTime(
    creneauId: string,
    field: "heure_debut" | "heure_fin",
    value: string
  ) {
    try {
      const res = await fetch(`/api/formateur/sessions/${id}/creneaux`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creneau_id: creneauId, [field]: value }),
      });
      if (!res.ok) throw new Error();
      toast.success(field === "heure_debut" ? "Heure de début enregistrée" : "Heure de fin enregistrée");
      setSession((prev) => {
        if (!prev) return null;
        const creneaux = prev.session_creneaux.map((c) =>
          c.id === creneauId ? { ...c, [field]: value } : c
        );
        return { ...prev, session_creneaux: creneaux };
      });
      setCreneauTimes((prev) => ({
        ...prev,
        [creneauId]: { ...prev[creneauId], [field]: value },
      }));
    } catch {
      toast.error("Erreur");
    }
  }

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Chargement...</p>
      </div>
    );
  }

  const creneaux = [...(session.session_creneaux || [])].sort(
    (a, b) => a.ordre - b.ordre
  );
  const triggersByCreneau = (session.session_step_triggers || []).reduce(
    (acc, t) => {
      if (t.step_type === "emargement" && t.creneau_id) {
        acc[t.creneau_id] = true;
      }
      return acc;
    },
    {} as Record<string, boolean>
  );

  return (
    <div className="space-y-6">
      <Link
        href="/formateur"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux sessions
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">{session.nom}</h1>
        <p className="text-slate-600 mt-1">
          {session.formation?.nom ?? "—"} • {session.inscriptions?.length ?? 0} stagiaire(s)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Créneaux d&apos;émargement
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Saisissez l&apos;heure de début en début de créneau, puis validez l&apos;heure de fin en fin de créneau.
            Ensuite déclenchez l&apos;émargement pour que les stagiaires signent.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {creneaux.map((c) => (
            <div
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50 rounded-lg"
            >
              <span className="font-medium text-slate-800 w-24">Créneau {c.ordre}</span>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-slate-500">Début</label>
                  <input
                    type="datetime-local"
                    defaultValue={
                      c.heure_debut
                        ? new Date(c.heure_debut).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      updateCreneauTime(c.id, "heure_debut", e.target.value ? new Date(e.target.value).toISOString() : "")
                    }
                    className="px-2 py-1.5 border border-slate-300 rounded text-sm"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-slate-500">Fin</label>
                  <input
                    type="datetime-local"
                    defaultValue={
                      c.heure_fin
                        ? new Date(c.heure_fin).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      updateCreneauTime(c.id, "heure_fin", e.target.value ? new Date(e.target.value).toISOString() : "")
                    }
                    className="px-2 py-1.5 border border-slate-300 rounded text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  disabled={!!triggersByCreneau[c.id] || triggering !== null}
                  onClick={() => triggerStep("emargement", c.id)}
                >
                  {triggersByCreneau[c.id]
                    ? "Émargement envoyé"
                    : triggering === "emargement" + c.id
                    ? "Envoi..."
                    : "Demander émargement"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Étapes à déclencher</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Cliquez pour envoyer l&apos;étape à tous les stagiaires (popup sur leur espace).
            Ordre recommandé : Test pré-formation → Créneaux émargement → Points clés → Test fin → Enquête satisfaction → Bilan final.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={!!(session.session_step_triggers || []).find((t) => t.step_type === "test_pre") || triggering !== null}
            onClick={() => triggerStep("test_pre")}
          >
            <FileCheck className="w-4 h-4" />
            {STEP_LABELS.test_pre}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={!!(session.session_step_triggers || []).find((t) => t.step_type === "points_cles") || triggering !== null}
            onClick={() => triggerStep("points_cles")}
          >
            <ClipboardList className="w-4 h-4" />
            {STEP_LABELS.points_cles}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={!!(session.session_step_triggers || []).find((t) => t.step_type === "test_fin") || triggering !== null}
            onClick={() => triggerStep("test_fin")}
          >
            <FileCheck className="w-4 h-4" />
            {STEP_LABELS.test_fin}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={!!(session.session_step_triggers || []).find((t) => t.step_type === "enquete_satisfaction") || triggering !== null}
            onClick={() => triggerStep("enquete_satisfaction")}
          >
            <ThumbsUp className="w-4 h-4" />
            {STEP_LABELS.enquete_satisfaction}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            disabled={!!(session.session_step_triggers || []).find((t) => t.step_type === "bilan_final") || triggering !== null}
            onClick={() => triggerStep("bilan_final")}
          >
            <FileText className="w-4 h-4" />
            {STEP_LABELS.bilan_final}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
