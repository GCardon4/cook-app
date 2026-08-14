-- Migrar datos históricos de inventory a inventory_movements
-- Ejecutar esta migración en Supabase después de crear inventory_movements
-- Esta consulta crea registros de "agregado" basados en add_date

-- Crear movimiento "agregado" cuando se agregó el utensilio
insert into public.inventory_movements (cook_id, utensils_id, school_id, type, quantity, notes, created_at)
select
  i.cook_id,
  i.utensils_id,
  cs.school_id,
  'agregado'::text,
  i.stock,
  null,
  coalesce(i.add_date, i.created_at)
from public.inventory i
left join public.cook_school cs on i.cook_id = cs.cook_id
where i.add_date is not null or i.created_at is not null
on conflict do nothing;

-- Si el utensilio fue entregado (tiene return_date), crear movimiento "entregado"
-- Nota: esto asume que si tiene return_date, la cantidad entregada fue = stock actual
insert into public.inventory_movements (cook_id, utensils_id, school_id, type, quantity, notes, created_at)
select
  i.cook_id,
  i.utensils_id,
  cs.school_id,
  'entregado'::text,
  i.stock,
  i.notes,
  coalesce(i.return_date, i.updated_at)
from public.inventory i
left join public.cook_school cs on i.cook_id = cs.cook_id
where i.return_date is not null
on conflict do nothing;

-- Verificar cuántos registros se insertaron
select count(*) as "Movimientos insertados" from public.inventory_movements;
