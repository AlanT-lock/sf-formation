import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { DocumentType } from "@/types/database";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "stagiaire") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const document_type = searchParams.get("document_type") as DocumentType | null;
  if (!document_type) {
    return NextResponse.json(
      { error: "document_type requis" },
      { status: 400 }
    );
  }
  const valid: DocumentType[] = [
    "test_pre",
    "points_cles",
    "test_fin",
    "enquete_satisfaction",
  ];
  if (!valid.includes(document_type)) {
    return NextResponse.json(
      { error: "document_type invalide" },
      { status: 400 }
    );
  }
  const { data, error } = await supabase
    .from("questions")
    .select("id, ordre, libelle, type_reponse, options")
    .eq("document_type", document_type)
    .order("ordre");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
