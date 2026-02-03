import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  verifyPassword,
  createToken,
  setAuthCookie,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json(
        { error: "Identifiant et mot de passe requis" },
        { status: 400 }
      );
    }

    const searchUsername = username.trim().toLowerCase();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, password_hash, role, first_login_done")
      .ilike("username", searchUsername)
      .single();

    // Debug (à retirer après) — regarde le terminal où tourne "npm run dev"
    if (error) {
      console.log("[Login] Supabase error:", error.code, error.message, error.cause ?? "");
    }
    if (!user) {
      console.log("[Login] Aucun utilisateur trouvé pour:", searchUsername);
    } else {
      console.log("[Login] Utilisateur trouvé:", user.username, "role:", user.role, "hash length:", user.password_hash?.length ?? 0);
    }

    if (error || !user) {
      return NextResponse.json(
        { error: "Identifiant ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Première connexion : pas de vérification du mot de passe (le stagiaire/formateur définit le sien après)
    const isFirstLogin = !user.first_login_done;
    if (!isFirstLogin) {
      const valid = await verifyPassword(password, user.password_hash);
      console.log("[Login] Vérification mot de passe:", valid ? "OK" : "ÉCHEC");
      if (!valid) {
        return NextResponse.json(
          { error: "Identifiant ou mot de passe incorrect" },
          { status: 401 }
        );
      }
    }

    const token = await createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      firstLoginDone: user.first_login_done ?? false,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      ok: true,
      role: user.role,
      firstLoginDone: user.first_login_done ?? false,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
