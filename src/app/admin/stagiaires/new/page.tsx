"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

function suggestedUsername(prenom: string, nom: string) {
  if (!prenom.trim() || !nom.trim()) return "";
  return `${prenom.trim().toLowerCase()}.${nom.trim().toLowerCase()}`.replace(/\s+/g, ".");
}

export default function NewStagiairePage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const usernameManuallyEdited = useRef(false);

  const suggestion = suggestedUsername(prenom, nom);
  useEffect(() => {
    if (!usernameManuallyEdited.current && suggestion) setUsername(suggestion);
  }, [suggestion]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) {
      toast.error("Nom et prénom requis");
      return;
    }
    const identifiant = (username || suggestion).trim().toLowerCase().replace(/\s+/g, ".");
    if (!identifiant) {
      toast.error("Identifiant requis");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stagiaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom.trim(),
          prenom: prenom.trim(),
          username: identifiant,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }
      toast.success(data.message || "Stagiaire créé");
      router.push("/admin/stagiaires");
      router.refresh();
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <Link
        href="/admin/stagiaires"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux stagiaires
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Nouveau stagiaire</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Identifiant de connexion modifiable (utile si deux stagiaires ont le même nom)
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Prénom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Jean"
              required
            />
            <Input
              label="Nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Dupont"
              required
            />
            <Input
              label="Identifiant"
              value={username}
              onChange={(e) => {
                usernameManuallyEdited.current = true;
                setUsername(e.target.value);
              }}
              placeholder={suggestion || "jean.dupont"}
              required
              autoComplete="username"
            />
            <p className="text-xs text-slate-500">
              Suggestion : <span className="font-mono">{suggestion || "—"}</span>. Modifiable pour distinguer deux stagiaires (ex. jean.dupont2).
            </p>
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Création..." : "Créer le stagiaire"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
