    -- Battle rooms for 1v1 multiplayer quiz battles
    CREATE TABLE IF NOT EXISTS public.battle_rooms (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code          TEXT        UNIQUE NOT NULL,
    host_id       UUID        NOT NULL,
    guest_id      UUID,
    host_name     TEXT        NOT NULL DEFAULT 'Player',
    guest_name    TEXT,
    host_avatar   TEXT        NOT NULL DEFAULT '⭐',
    guest_avatar  TEXT,
    subject       TEXT        NOT NULL DEFAULT '',
    topic         TEXT        NOT NULL DEFAULT '',
    difficulty    TEXT        NOT NULL DEFAULT 'medium',
    status        TEXT        NOT NULL DEFAULT 'waiting',
    questions     JSONB       NOT NULL DEFAULT '[]'::jsonb,
    host_score    INTEGER     NOT NULL DEFAULT 0,
    guest_score   INTEGER     NOT NULL DEFAULT 0,
    host_correct  INTEGER     NOT NULL DEFAULT 0,
    guest_correct INTEGER     NOT NULL DEFAULT 0,
    host_finished BOOLEAN     NOT NULL DEFAULT false,
    guest_finished BOOLEAN    NOT NULL DEFAULT false,
    winner_id     UUID,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '2 hours')
    );

    ALTER TABLE public.battle_rooms ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "battle_rooms_select" ON public.battle_rooms
    FOR SELECT USING (true);

    CREATE POLICY "battle_rooms_insert" ON public.battle_rooms
    FOR INSERT WITH CHECK (auth.uid() = host_id);

    CREATE POLICY "battle_rooms_update" ON public.battle_rooms
    FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = guest_id);

    -- Enable Realtime so postgres_changes subscriptions work
    ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rooms;
