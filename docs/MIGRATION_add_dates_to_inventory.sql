-- Agregar campos de fecha a inventory para estadísticas detalladas
-- Ejecutar esta migración en el editor SQL de Supabase

alter table public.inventory
add column add_date timestamptz,
add column return_date timestamptz;

-- Crear índices para queries de reportes
create index idx_inventory_add_date on public.inventory(add_date);
create index idx_inventory_return_date on public.inventory(return_date);

-- Llenar add_date con created_at para registros existentes (snapshot del momento)
update public.inventory set add_date = created_at where add_date is null;
