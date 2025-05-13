-- Parte 4: Configurar permissões RLS

-- Permissões RLS (Row Level Security)
ALTER TABLE exercise_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_exercise_summary ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para exercise_records
CREATE POLICY "Usuários podem ver apenas seus próprios registros de exercícios"
  ON exercise_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas seus próprios registros de exercícios"
  ON exercise_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios registros de exercícios"
  ON exercise_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir apenas seus próprios registros de exercícios"
  ON exercise_records FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para weekly_exercise_summary
CREATE POLICY "Usuários podem ver apenas seus próprios resumos de exercícios"
  ON weekly_exercise_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir apenas seus próprios resumos de exercícios"
  ON weekly_exercise_summary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios resumos de exercícios"
  ON weekly_exercise_summary FOR UPDATE
  USING (auth.uid() = user_id);
