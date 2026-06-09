create table if not exists public.gifts (
  slug text primary key,
  creator_name text not null,
  recipient_name text not null,
  special_date date not null,
  theme text not null,
  photo_count integer not null default 0,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gifts_created_at_idx
  on public.gifts (created_at desc);

create index if not exists gifts_recipient_name_idx
  on public.gifts (recipient_name);

alter table public.gifts enable row level security;

-- O app usa a service role key somente no servidor, então não precisa
-- abrir políticas públicas para leitura ou escrita direta pelo navegador.
