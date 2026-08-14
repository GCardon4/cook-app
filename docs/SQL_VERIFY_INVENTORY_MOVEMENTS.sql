-- Script de verificación rápida de inventory_movements
-- Ejecutar en Supabase SQL editor para diagnosticar el estado

-- 1. Verificar que la tabla existe
select 'Tabla inventory_movements' as "Chequeo",
  case when exists (select 1 from information_schema.tables where table_name = 'inventory_movements')
    then '✓ Existe' else '✗ No existe - EJECUTAR MIGRATION'
  end as estado;

-- 2. Contar registros en inventory_movements
select 'Registros en inventory_movements' as "Chequeo",
  count(*)::text as cantidad
from public.inventory_movements;

-- 3. Últimos 5 movimientos (para ver si hay datos)
select 'Últimos 5 movimientos' as "Info",
  id, cook_id, type, quantity, created_at
from public.inventory_movements
order by created_at desc
limit 5;

-- 4. Contar registros con datos en inventory (para migrar)
select 'Registros con add_date en inventory' as "Chequeo",
  count(*) as cantidad
from public.inventory
where add_date is not null;

-- 5. Contar registros con return_date (entregas)
select 'Registros con return_date en inventory' as "Chequeo",
  count(*) as cantidad
from public.inventory
where return_date is not null;

-- 6. Total de cocineras
select 'Total de cocineras' as "Chequeo",
  count(*) as cantidad
from public.cook;

-- 7. Cocineras con colegios asignados
select 'Cocineras con colegio asignado' as "Chequeo",
  count(distinct cook_id) as cantidad
from public.cook_school;

-- 8. Movimientos por tipo (si existen)
select 'Distribución por tipo' as "Info",
  type, count(*) as cantidad
from public.inventory_movements
group by type;
