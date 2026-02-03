"use client";

import Link from "next/link";

interface UserInfo {
  username: string;
  first_login_done: boolean;
}

interface Stagiaire {
  id: string;
  nom: string;
  prenom: string;
  user_id: string;
  created_at: string;
}

export function StagiairesList({
  stagiaires,
  usersByUserId,
}: {
  stagiaires: Stagiaire[];
  usersByUserId: Record<string, UserInfo>;
}) {
  if (!stagiaires.length) {
    return (
      <p className="text-slate-500 text-sm py-4">
        Aucun stagiaire. Créez-en un depuis le bouton ci-dessus.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-600 font-medium">
            <th className="py-3 pr-4">Nom</th>
            <th className="py-3 pr-4">Prénom</th>
            <th className="py-3 pr-4">Identifiant</th>
            <th className="py-3 pr-4">Première connexion</th>
          </tr>
        </thead>
        <tbody>
          {stagiaires.map((s) => {
            const user = usersByUserId[s.user_id];
            return (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="py-3 pr-4 font-medium text-slate-800">{s.nom}</td>
                <td className="py-3 pr-4 text-slate-700">{s.prenom}</td>
                <td className="py-3 pr-4 text-slate-700 font-mono text-xs">
                  {user?.username ?? "—"}
                </td>
                <td className="py-3 pr-4">
                  {user?.first_login_done ? (
                    <span className="text-green-600 text-xs">Oui</span>
                  ) : (
                    <span className="text-amber-600 text-xs">À définir</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
