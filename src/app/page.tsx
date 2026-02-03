import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-2xl font-bold text-slate-800">SF Formation</h1>
        <p className="text-slate-600 text-sm">
          Plateforme de gestion des formations Hygiène alimentaire
        </p>
        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/admin/login"
            className="block w-full py-3 px-4 rounded-lg bg-slate-800 text-white font-medium text-center hover:bg-slate-700 transition"
          >
            Espace Admin
          </Link>
          <Link
            href="/formateur/login"
            className="block w-full py-3 px-4 rounded-lg bg-primary-600 text-white font-medium text-center hover:bg-primary-700 transition"
          >
            Espace Formateur
          </Link>
          <Link
            href="/stagiaire/login"
            className="block w-full py-3 px-4 rounded-lg border-2 border-slate-300 text-slate-700 font-medium text-center hover:bg-slate-100 transition"
          >
            Espace Stagiaire
          </Link>
        </div>
      </div>
    </main>
  );
}
