-- Inserindo um Perfil de Administrador (mock)
INSERT INTO public.profiles (id, email, name)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin@coxia.com', 'Marcelo Formigoni')
ON CONFLICT DO NOTHING;

-- Inserindo Festival
INSERT INTO public.festivals (id, user_id, name, city, state, start_date, end_date, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'Festival de Dança de Inverno', 'Campos do Jordão', 'SP', '2026-07-12', '2026-07-15', 'Planejamento')
ON CONFLICT DO NOTHING;

-- Inserindo Sessões
INSERT INTO public.sessions (id, festival_id, name, session_date, start_time, end_time)
VALUES 
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Sessão 1 - Sexta (Clássico)', '2026-07-12', '18:00:00', '21:00:00')
ON CONFLICT DO NOTHING;

-- Inserindo Bailarinos
INSERT INTO public.dancers (id, festival_id, name, level, group_name)
VALUES 
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Alice Silva', 'Infantil', 'Ballet Infantil'),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Beatriz Costa', 'Adulto', 'Jazz Adulto'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Carlos Santos', 'Avançado', 'Equipe Competitiva')
ON CONFLICT DO NOTHING;

-- Inserindo Coreografias
INSERT INTO public.choreographies (id, festival_id, name, category, duration_seconds, teacher, status)
VALUES 
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'Abertura Mágica', 'Ballet Clássico Livre', 240, 'Ana Silva', 'Pronta'),
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'Fogo e Paixão', 'Jazz', 180, 'Carlos Santos', 'Ensaiando'),
  ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', 'Sincronia Urbana', 'Danças Urbanas', 250, 'Bia Costa', 'Pronta')
ON CONFLICT DO NOTHING;

-- Inserindo Participações (Vínculos Bailarino -> Coreografia)
INSERT INTO public.participations (dancer_id, choreography_id)
VALUES 
  ('33333333-3333-3333-3333-333333333331', '44444444-4444-4444-4444-444444444441'), -- Alice na Abertura
  ('33333333-3333-3333-3333-333333333332', '44444444-4444-4444-4444-444444444441'), -- Beatriz na Abertura
  ('33333333-3333-3333-3333-333333333332', '44444444-4444-4444-4444-444444444442'), -- Beatriz no Jazz
  ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444443')  -- Carlos no Urbano
ON CONFLICT DO NOTHING;
