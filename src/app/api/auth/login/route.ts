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
