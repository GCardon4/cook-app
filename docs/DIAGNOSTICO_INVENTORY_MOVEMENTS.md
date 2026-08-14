# Diagnóstico: Por qué inventory_movements no genera reportes

## Checklist de Verificación

### 1. Verificar que la tabla existe en Supabase

En el editor SQL de Supabase, ejecuta:

```sql
-- Ver estructura de la tabla
select table_name, column_name, data_type 
from information_schema.columns 
where table_name = 'inventory_movements'
order by ordinal_position;

-- Ver conteo de registros
select count(*) as total_movimientos from public.inventory_movements;
```

**Resultado esperado:**
- Debe mostrar 7 columnas (id, cook_id, utensils_id, school_id, type, quantity, notes, created_at)
- Si count es 0, la tabla está vacía

### 2. Si la tabla está vacía: Migrar datos históricos

La tabla arranca vacía porque los movimientos anteriores no se registraban. Ahora tienes dos opciones:

#### Opción A: Migrar automáticamente desde inventory

Ejecuta en Supabase:

```sql
-- Ver datos en inventory antes de migrar
select count(*) as "Registros en inventory" from public.inventory;

-- Ejecutar migración (ver MIGRATION_populate_inventory_movements.sql)
-- Esto crea movimientos basados en add_date y return_date
```

#### Opción B: Crear manualmente para debugging

```sql
-- Insertar un movimiento de prueba
insert into public.inventory_movements (cook_id, utensils_id, school_id, type, quantity, notes, created_at)
values (1, 1, 1, 'agregado', 2, 'Prueba manual', now());

-- Verificar que se insertó
select * from public.inventory_movements order by created_at desc limit 1;
```

### 3. Verificar que los nuevos escaneos se registran

Después de migrar, haz un escaneo manual:

1. Ve a `/inventarios`
2. Selecciona una cocinera
3. Haz AGREGAR o ENTREGA de un utensilio
4. En Supabase SQL, ejecuta:

```sql
select * from public.inventory_movements 
order by created_at desc limit 5;
```

**Resultado esperado:**
- Debe haber 1 registro nuevo con type='agregado' o 'entregado'
- Con la fecha/hora del escaneo

### 4. Verificar la relación cook_school

Si no hay colegios en los reportes, verifica:

```sql
-- Ver colegios asignados a una cocinera
select cs.school_id, s.name
from public.cook_school cs
join public.school s on cs.school_id = s.id
where cs.cook_id = 1;  -- Reemplaza 1 con ID de cocinera
```

Si el resultado está vacío, la cocinera no tiene colegios asignados.

## Posibles Problemas y Soluciones

| Problema | Causa | Solución |
|----------|-------|----------|
| Tabla no existe | Migración SQL no ejecutada | Ejecutar MIGRATION_inventory_movements.sql |
| Tabla existe pero está vacía | Datos no migraron | Ejecutar MIGRATION_populate_inventory_movements.sql |
| Hay datos pero no aparecen en reportes | Query mal escrita | Revisar query de obtenerHistorialAsignaciones() |
| Nuevos escaneos no se registran | Bug en las acciones | Ver consola del servidor (`npm run dev`) para errores |
| Reportes vacíos pero datos existen | Filtros muy restrictivos | Desmarcar filtros en /admin/asignaciones |

## Logs para Debug

Si sospechas error en las acciones, activa logs en `app/inventarios/actions.ts`:

```typescript
// En agregarPorEscaneo, después de insert a inventory_movements:
if (errMovimiento) {
  console.error('Error registrando movimiento:', errMovimiento) // ← Verás este en la consola del servidor
}
```

Ejecuta `npm run dev` y revisa la terminal donde corre el servidor.

## Resumen Rápido

```bash
# 1. En Supabase SQL, verifica que existe:
select count(*) from public.inventory_movements;

# 2. Si está vacía, migra histórico:
-- Ejecutar MIGRATION_populate_inventory_movements.sql

# 3. Verifica que new scans se registren:
select * from inventory_movements order by created_at desc limit 1;

# 4. Prueba los reportes:
# → Ve a /admin/asignaciones
# → Deselecciona todos los filtros
# → Verifica que haya datos
```
