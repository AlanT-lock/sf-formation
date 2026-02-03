import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production-min-32-chars"
);

async function getPayloadFromCookie(request: NextRequest) {
  const token = request.cookies.get("sf-formation-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as {
      sub: string;
      username: string;
      role: string;
      firstLoginDone: boolean;
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Pages publiques
  if (path === "/" || path.startsWith("/admin/login") || path.startsWith("/formateur/login") || path.startsWith("/stagiaire/login")) {
    return NextResponse.next();
  }

  const payload = await getPayloadFromCookie(request);

  if (!payload) {
    if (path.startsWith("/admin")) return NextResponse.redirect(new URL("/admin/login", request.url));
    if (path.startsWith("/formateur")) return NextResponse.redirect(new URL("/formateur/login", request.url));
    if (path.startsWith("/stagiaire")) return NextResponse.redirect(new URL("/stagiaire/login", request.url));
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Vérifier le rôle
  if (path.startsWith("/admin") && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (path.startsWith("/formateur") && payload.role !== "formateur") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (path.startsWith("/stagiaire") && payload.role !== "stagiaire") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Première connexion : rediriger vers first-login (sauf sur la page first-login elle-même)
  if (!payload.firstLoginDone && payload.role !== "admin") {
    const isFirstLoginPage =
      path === "/formateur/first-login" || path === "/stagiaire/first-login";
    if (!isFirstLoginPage) {
      if (payload.role === "formateur")
        return NextResponse.redirect(new URL("/formateur/first-login", request.url));
      if (payload.role === "stagiaire")
        return NextResponse.redirect(new URL("/stagiaire/first-login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/formateur/:path*", "/stagiaire/:path*"],
};
