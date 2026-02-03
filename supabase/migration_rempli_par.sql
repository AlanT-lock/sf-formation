-- Migration : champ rempli_par sur formation_documents (stagiaire | formateur)
-- Exécuter dans l'éditeur SQL Supabase

ALTER TABLE formation_documents
  ADD COLUMN IF NOT EXISTS rempli_par TEXT NOT NULL DEFAULT 'stagiaire'
  CHECK (rempli_par IN ('stagiaire', 'formateur'));

-- Bilan final : par défaut rempli par le formateur
UPDATE formation_documents
SET rempli_par = 'formateur'
WHERE document_type = 'bilan_final';
