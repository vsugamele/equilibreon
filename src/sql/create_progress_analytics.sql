-- SQL para análise avançada de progresso nutricional
-- Este script cria funções e views para gerar métricas e insights sobre o progresso do usuário

-- View para agregar dados nutricionais diários com métricas de aderência
CREATE OR REPLACE VIEW nutrition_progress_metrics AS
SELECT 
  dns.user_id,
  dns.date,
  dns.total_calories,
  dns.total_protein,
  dns.total_carbs,
  dns.total_fat,
  dns.meal_count,
  dns.completed_meals,
  CASE 
    WHEN dns.meal_count > 0 THEN (dns.completed_meals::FLOAT / dns.meal_count::FLOAT) * 100
    ELSE 0
  END AS adherence_rate,
  CASE
    WHEN dns.meal_count > 0 THEN (dns.completed_meals::FLOAT / dns.meal_count::FLOAT) * 5
    ELSE 0
  END AS adherence_score,
  -- Calculando média móvel de 7 dias para calorias
  (
    SELECT AVG(inner_dns.total_calories)
    FROM daily_nutrition_summary inner_dns
    WHERE inner_dns.user_id = dns.user_id
      AND inner_dns.date BETWEEN dns.date - INTERVAL '6 days' AND dns.date
  ) AS avg_calories_7d,
  -- Calculando média móvel de 7 dias para proteínas
  (
    SELECT AVG(inner_dns.total_protein)
    FROM daily_nutrition_summary inner_dns
    WHERE inner_dns.user_id = dns.user_id
      AND inner_dns.date BETWEEN dns.date - INTERVAL '6 days' AND dns.date
  ) AS avg_protein_7d,
  -- Calculando média móvel de 30 dias para calorias
  (
    SELECT AVG(inner_dns.total_calories)
    FROM daily_nutrition_summary inner_dns
    WHERE inner_dns.user_id = dns.user_id
      AND inner_dns.date BETWEEN dns.date - INTERVAL '29 days' AND dns.date
  ) AS avg_calories_30d
FROM daily_nutrition_summary dns;

-- Função para calcular sequências (streaks) de aderência
CREATE OR REPLACE FUNCTION calculate_adherence_streaks(
  p_user_id UUID,
  p_min_adherence FLOAT DEFAULT 80.0
) RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  last_perfect_date DATE
) AS $$
DECLARE
  current_streak INTEGER := 0;
  longest_streak INTEGER := 0;
  last_perfect_date DATE := NULL;
  prev_date DATE := NULL;
  is_streak BOOLEAN := FALSE;
  r RECORD;
BEGIN
  FOR r IN (
    SELECT 
      date, 
      adherence_rate,
      CASE WHEN adherence_rate >= p_min_adherence THEN TRUE ELSE FALSE END AS is_adherent
    FROM nutrition_progress_metrics
    WHERE user_id = p_user_id
    ORDER BY date DESC
  ) LOOP
    IF r.is_adherent THEN
      IF last_perfect_date IS NULL THEN
        last_perfect_date := r.date;
      END IF;
      
      IF prev_date IS NULL OR prev_date = r.date + INTERVAL '1 day' THEN
        current_streak := current_streak + 1;
        is_streak := TRUE;
      ELSE
        is_streak := FALSE;
        EXIT;
      END IF;
    ELSE
      is_streak := FALSE;
      EXIT;
    END IF;
    
    prev_date := r.date;
  END LOOP;
  
  -- Calcular o streak mais longo
  SELECT MAX(streak_length) INTO longest_streak
  FROM (
    SELECT 
      COUNT(*) AS streak_length
    FROM (
      SELECT
        date,
        adherence_rate,
        date - (ROW_NUMBER() OVER (ORDER BY date))::INTEGER AS grp
      FROM nutrition_progress_metrics
      WHERE user_id = p_user_id AND adherence_rate >= p_min_adherence
    ) t
    GROUP BY grp
  ) s;
  
  IF longest_streak IS NULL THEN
    longest_streak := 0;
  END IF;
  
  RETURN QUERY SELECT current_streak, longest_streak, last_perfect_date;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar insights baseados nos dados
CREATE OR REPLACE FUNCTION generate_nutrition_insights(
  p_user_id UUID,
  p_days_to_analyze INTEGER DEFAULT 30
) RETURNS TABLE (
  insight_type TEXT,
  insight_text TEXT,
  relevance_score INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  avg_adherence FLOAT;
  protein_trend FLOAT;
  calorie_trend FLOAT;
  best_day_of_week INTEGER;
  best_day_adherence FLOAT := 0;
  r RECORD;
BEGIN
  -- Calcular aderência média
  SELECT AVG(adherence_rate) INTO avg_adherence
  FROM nutrition_progress_metrics
  WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - (p_days_to_analyze || ' days')::INTERVAL;
  
  -- Identificar tendências de proteína
  SELECT 
    (
      SELECT AVG(total_protein) 
      FROM nutrition_progress_metrics 
      WHERE user_id = p_user_id 
        AND date BETWEEN CURRENT_DATE - (p_days_to_analyze/2 || ' days')::INTERVAL AND CURRENT_DATE
    ) - 
    (
      SELECT AVG(total_protein) 
      FROM nutrition_progress_metrics 
      WHERE user_id = p_user_id 
        AND date BETWEEN CURRENT_DATE - (p_days_to_analyze || ' days')::INTERVAL AND CURRENT_DATE - (p_days_to_analyze/2 || ' days')::INTERVAL
    ) INTO protein_trend;
  
  -- Identificar tendências de calorias
  SELECT 
    (
      SELECT AVG(total_calories) 
      FROM nutrition_progress_metrics 
      WHERE user_id = p_user_id 
        AND date BETWEEN CURRENT_DATE - (p_days_to_analyze/2 || ' days')::INTERVAL AND CURRENT_DATE
    ) - 
    (
      SELECT AVG(total_calories) 
      FROM nutrition_progress_metrics 
      WHERE user_id = p_user_id 
        AND date BETWEEN CURRENT_DATE - (p_days_to_analyze || ' days')::INTERVAL AND CURRENT_DATE - (p_days_to_analyze/2 || ' days')::INTERVAL
    ) INTO calorie_trend;
  
  -- Encontrar o melhor dia da semana
  FOR i IN 0..6 LOOP
    SELECT AVG(adherence_rate) INTO r
    FROM nutrition_progress_metrics
    WHERE user_id = p_user_id
      AND date >= CURRENT_DATE - (p_days_to_analyze || ' days')::INTERVAL
      AND EXTRACT(DOW FROM date) = i;
    
    IF r > best_day_adherence THEN
      best_day_adherence := r;
      best_day_of_week := i;
    END IF;
  END LOOP;
  
  -- Gerar insights baseados nos dados analisados
  
  -- Insight sobre aderência
  insight_type := 'adherence';
  IF avg_adherence >= 90 THEN
    insight_text := 'Excelente aderência! Você completou ' || ROUND(avg_adherence) || '% das refeições planejadas nos últimos ' || p_days_to_analyze || ' dias.';
    relevance_score := 5;
  ELSIF avg_adherence >= 75 THEN
    insight_text := 'Boa aderência! Você completou ' || ROUND(avg_adherence) || '% das refeições planejadas nos últimos ' || p_days_to_analyze || ' dias.';
    relevance_score := 4;
  ELSE
    insight_text := 'Oportunidade de melhoria na aderência. Você completou ' || ROUND(avg_adherence) || '% das refeições planejadas nos últimos ' || p_days_to_analyze || ' dias.';
    relevance_score := 3;
  END IF;
  generated_at := NOW();
  RETURN NEXT;
  
  -- Insight sobre proteínas
  insight_type := 'protein_trend';
  IF protein_trend > 5 THEN
    insight_text := 'Seu consumo de proteínas aumentou em ' || ROUND(protein_trend) || 'g nos últimos ' || p_days_to_analyze/2 || ' dias comparado ao período anterior.';
    relevance_score := 4;
  ELSIF protein_trend < -5 THEN
    insight_text := 'Seu consumo de proteínas diminuiu em ' || ROUND(ABS(protein_trend)) || 'g nos últimos ' || p_days_to_analyze/2 || ' dias comparado ao período anterior.';
    relevance_score := 4;
  ELSE
    insight_text := 'Seu consumo de proteínas está estável nos últimos ' || p_days_to_analyze || ' dias.';
    relevance_score := 3;
  END IF;
  generated_at := NOW();
  RETURN NEXT;
  
  -- Insight sobre calorias
  insight_type := 'calorie_trend';
  IF calorie_trend > 100 THEN
    insight_text := 'Seu consumo de calorias aumentou em ' || ROUND(calorie_trend) || ' nos últimos ' || p_days_to_analyze/2 || ' dias comparado ao período anterior.';
    relevance_score := 4;
  ELSIF calorie_trend < -100 THEN
    insight_text := 'Seu consumo de calorias diminuiu em ' || ROUND(ABS(calorie_trend)) || ' nos últimos ' || p_days_to_analyze/2 || ' dias comparado ao período anterior.';
    relevance_score := 4;
  ELSE
    insight_text := 'Seu consumo de calorias está estável nos últimos ' || p_days_to_analyze || ' dias.';
    relevance_score := 3;
  END IF;
  generated_at := NOW();
  RETURN NEXT;
  
  -- Insight sobre o melhor dia da semana
  insight_type := 'best_day';
  insight_text := 'Seu dia com melhor aderência ao plano é ' || 
    CASE best_day_of_week
      WHEN 0 THEN 'domingo'
      WHEN 1 THEN 'segunda-feira'
      WHEN 2 THEN 'terça-feira'
      WHEN 3 THEN 'quarta-feira'
      WHEN 4 THEN 'quinta-feira'
      WHEN 5 THEN 'sexta-feira'
      WHEN 6 THEN 'sábado'
    END || 
    ' com ' || ROUND(best_day_adherence) || '% de aderência.';
  relevance_score := 3;
  generated_at := NOW();
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Criar um índice para melhorar o desempenho das consultas
CREATE INDEX IF NOT EXISTS idx_daily_nutrition_user_date 
ON daily_nutrition_summary(user_id, date);

-- Criar políticas RLS para views e tabelas relacionadas a métricas
CREATE POLICY "Usuários podem ver apenas suas próprias métricas de progresso"
  ON daily_nutrition_summary
  FOR SELECT
  USING (auth.uid() = user_id);
