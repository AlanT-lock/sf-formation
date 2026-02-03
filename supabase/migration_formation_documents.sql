-- Migration : documents par formation + questions par formation
-- Exécuter dans l'éditeur SQL Supabase après le schéma initial

-- Table : documents (tests) par formation (nom affiché, ordre)
CREATE TABLE IF NOT EXISTS formation_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  nom_affiche TEXT NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(formation_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_formation_documents_formation ON formation_documents(formation_id);

-- Ajouter formation_id aux questions (une question appartient à une formation)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS formation_id UUID REFERENCES formations(id) ON DELETE CASCADE;

-- Migrer les questions existantes vers la première formation (Hygiène alimentaire)
UPDATE questions SET formation_id = (SELECT id FROM formations LIMIT 1) WHERE formation_id IS NULL;

ALTER TABLE questions ALTER COLUMN formation_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_questions_formation_document ON questions(formation_id, document_type);

-- Remplir formation_documents pour la formation Hygiène alimentaire (et les autres existantes)
INSERT INTO formation_documents (formation_id, document_type, nom_affiche, ordre)
SELECT f.id, dt.document_type, dt.nom_affiche, dt.ordre
FROM formations f
CROSS JOIN (
  VALUES
    ('test_pre'::document_type, 'Test de pré-formation', 1),
    ('points_cles'::document_type, 'Test Points clés', 2),
    ('test_fin'::document_type, 'Test de fin de formation', 3),
    ('enquete_satisfaction'::document_type, 'Enquête de satisfaction', 4),
    ('bilan_final'::document_type, 'Bilan final', 5)
) AS dt(document_type, nom_affiche, ordre)
WHERE NOT EXISTS (
  SELECT 1 FROM formation_documents fd WHERE fd.formation_id = f.id AND fd.document_type = dt.document_type
);
