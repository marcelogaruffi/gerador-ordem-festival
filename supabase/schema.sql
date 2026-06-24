-- Tabela: Profiles
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    email text,
    name text,
    PRIMARY KEY (id)
);

-- Tabela: Festivais
CREATE TABLE public.festivals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text NOT NULL,
    location text,
    city text,
    state text,
    country text,
    start_date date,
    end_date date,
    logo_url text,
    cover_url text,
    notes text,
    status text DEFAULT 'Planejamento'::text, -- Planejamento, Em andamento, Finalizado
    config_min_time integer DEFAULT 10,
    config_min_choreos integer DEFAULT 3,
    config_ignore_light_conflicts boolean DEFAULT false,
    PRIMARY KEY (id)
);

-- Tabela: Sessões
CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    festival_id uuid REFERENCES public.festivals(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL, -- Ex: Sessão 1 - Sexta
    session_date date,
    start_time time,
    end_time time,
    PRIMARY KEY (id)
);

-- Tabela: Bailarinos
CREATE TABLE public.dancers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    festival_id uuid REFERENCES public.festivals(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    photo_url text,
    birth_date date,
    phone text,
    whatsapp text,
    email text,
    notes text,
    level text, -- Infantil, Juvenil, Adulto, Professor
    gender text,
    height numeric,
    group_name text, -- Ballet Infantil, etc
    PRIMARY KEY (id)
);

-- Tabela: Figurinos
CREATE TABLE public.costumes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    festival_id uuid REFERENCES public.festivals(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    photo_url text,
    change_time_minutes integer DEFAULT 5,
    PRIMARY KEY (id)
);

-- Tabela: Coreografias
CREATE TABLE public.choreographies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    festival_id uuid REFERENCES public.festivals(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    category text,
    duration_seconds integer,
    image_url text,
    video_url text,
    teacher text,
    notes text,
    status text DEFAULT 'pronta'::text, -- pronta, ensaiando, cancelada
    needs_scenery boolean DEFAULT false,
    needs_props boolean DEFAULT false,
    needs_quick_change boolean DEFAULT false,
    is_opening boolean DEFAULT false,
    is_closing boolean DEFAULT false,
    PRIMARY KEY (id)
);

-- Tabela: Participações (Bailarino -> Coreografia)
CREATE TABLE public.participations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dancer_id uuid REFERENCES public.dancers(id) ON DELETE CASCADE NOT NULL,
    choreography_id uuid REFERENCES public.choreographies(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (dancer_id, choreography_id)
);

-- Tabela: Ordem de Apresentação (Vincula Sessão com Coreografias em ordem)
CREATE TABLE public.presentation_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    choreography_id uuid REFERENCES public.choreographies(id) ON DELETE CASCADE NOT NULL,
    order_index integer NOT NULL,
    locked_position boolean DEFAULT false,
    PRIMARY KEY (id),
    UNIQUE(session_id, choreography_id)
);
