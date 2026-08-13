-- Crear tabla inventory_movements (ledger de movimientos de utensilios)
-- Ejecutar esta migración en el editor SQL de Supabase

create table public.inventory_movements (
  id bigint generated always as identity primary key,
  cook_id bigint not null references public.cook(id) on delete cascade,
  utensils_id bigint not null references public.utensils(id) on delete cascade,
  school_id bigint references public.school(id) on delete set null,
  type text not null check (type in ('agregado', 'entregado')),
  quantity numeric not null default 1,
  notes text,
  created_at timestamptz not null default now()
);

-- Crear índices para mejor performance
create index idx_inventory_movements_cook on public.inventory_movements(cook_id);
create index idx_inventory_movements_school on public.inventory_movements(school_id);
create index idx_inventory_movements_created on public.inventory_movements(created_at);

-- Si el proyecto usa RLS, habilitar y crear políticas (adaptar según las de otras tablas)
-- alter table public.inventory_movements enable row level security;
