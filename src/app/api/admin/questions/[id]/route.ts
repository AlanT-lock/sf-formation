import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const VALID_RESPONSE_TYPES = ["qcm", "texte_libre", "liste", "echelle"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const { ordre, libelle, type_reponse, options } = body;
  const updates: {
    ordre?: number;
    libelle?: string;
    type_reponse?: string;
    options?: Record<string, unknown> | null;
  } = {};
  if (typeof ordre === "number" && ordre >= 0) updates.ordre = ordre;
  if (typeof libelle === "string") updates.libelle = libelle.trim();
  if (type_reponse && VALID_RESPONSE_TYPES.includes(type_reponse)) {
    updates.type_reponse = type_reponse;
  }
  if (options !== undefined) updates.options = options ?? null;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Aucun champ à mettre à jour" },
      { status: 400 }
    );
  }
  const { data, error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { id } = await params;
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
