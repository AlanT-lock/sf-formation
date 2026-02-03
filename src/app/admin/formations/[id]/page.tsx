import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import { FormationContenu } from "@/components/admin/FormationContenu";

export default async function AdminFormationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: formation, error } = await supabase
    .from("formations")
    .select("id, nom")
    .eq("id", id)
    .single();

  if (error || !formation) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/formations"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux formations
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{formation.nom}</h1>
        <p className="text-slate-600 mt-1">
          Documents (tests) et questions pour les stagiaires de cette formation
        </p>
      </div>
      <FormationContenu formationId={formation.id} formationNom={formation.nom} />
    </div>
  );
}
