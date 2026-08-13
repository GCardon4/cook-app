# Cambios - Sistema de Historial de Movimientos

## Resumen

Se ha implementado un sistema de historial de movimientos de utensilios que registra cada evento (agregado/entregado) con fecha, colegio y notas de forma independiente del estado mutable de la tabla `inventory`. Esto permite análisis por cocinera, fecha y colegio.

## Cambios Realizados

### 1. Tabla Nueva en Supabase: `inventory_movements`

Ledger de solo-inserción. Ver `docs/MIGRATION_inventory_movements.sql` para el script de creación.

**Campos:**
- `id`: PK
- `cook_id`: FK → cook (on delete cascade)
- `utensils_id`: FK → utensils (on delete cascade)
- `school_id`: FK → school (nullable, on delete set null)
- `type`: 'agregado' | 'entregado' (constraint check)
- `quantity`: cantidad movida (default 1)
- `notes`: notas de voz/texto (nullable)
- `created_at`: timestamp automático

**Índices:** cook_id, school_id, created_at

### 2. Tipos TypeScript (`lib/supabase/types.ts`)

- Agregado tipo `MovimientoInventario`
- Actualizado `RegistroInventario` para incluir campo `notes: string | null`

### 3. Acciones del Servidor (`app/inventarios/actions.ts`)

#### Nuevas funciones:
- `obtenerEscuelasCocinera(cookId: number)`: retorna `{ id, name }[]` de colegios asignados a una cocinera

#### Actualizadas:
- `agregarPorEscaneo(cocineraId, sku, schoolId?)`: además de upsert en `inventory`, inserta fila en `inventory_movements`
- `entregarPorEscaneo(cocineraId, sku, notas?, schoolId?)`: además de update/delete en `inventory`, inserta fila en `inventory_movements`
- `actualizarNotasMovimiento(movimientoId, notas)`: **reemplaza** `actualizarNotasInventario` — actualiza notas en `inventory_movements` en lugar de `inventory`

#### Type exports:
- `ResultadoEscaneo` ahora incluye `movimientoId?: number`

### 4. Página de Inventarios (`app/inventarios/page.tsx`)

- `obtenerCocineras()` ahora carga relación `cook_school` con colegios
- `CocineraResumen` incluye `escuelas: {id, name}[]`

### 5. Vista de Inventarios (`app/inventarios/components/VistaInventarios.tsx`)

#### Nuevos estados:
- `colegioSeleccionado: number | null` — colegio activo durante escaneo
- `modoEscaneo: 'agregar' | 'entrega' | null` — modo guardado para flujo multi-pantalla
- Vista `seleccionarColegio` — cuando cocinera tiene 2+ colegios asignados

#### Flujo de selección de colegio:
1. Si cocinera tiene **0 colegios** → continuar sin seleccionar (schoolId: null)
2. Si cocinera tiene **1 colegio** → autoseleccionar automáticamente
3. Si cocinera tiene **2+ colegios** → mostrar pantalla de selección con botones antes de escaneo

#### Cambios en notas:
- `ultimoItemEscaneado.movimientoId` (antes `inventarioId`) — apunta a fila en `inventory_movements`, no en `inventory`
- `guardarNotasEntrega()` llama a `actualizarNotasMovimiento()` (antes `actualizarNotasInventario()`)
- **Corrige bug:** notas ahora persisten incluso cuando entrega agota el stock (antes se perdían al borrar la fila de `inventory`)

### 6. Página de Reportes (`app/admin/asignaciones/page.tsx`)

- `obtenerHistorialAsignaciones()` ahora lee de `inventory_movements` (join con cook, utensils, school)
- `AsignacionHistorial` incluye:
  - `tipo: 'agregado' | 'entregado'`
  - `colegio: {id, name} | null`

### 7. Vista de Reportes (`app/admin/asignaciones/components/VistaAsignaciones.tsx`)

#### Nuevos filtros:
- **Tipo de movimiento**: Todos, Agregado, Entregado
- **Colegio**: Todos o seleccionar uno específico

#### Cambios visuales en cada movimiento:
- Ícono de tipo (+/- según agregado/entregado)
- Badge de tipo (coloreado: primario para agregado, secundario para entregado)
- Badge de colegio (color terciario) si existe

### 8. Documentación

- `docs/SUPABASE.md`: actualizado con `inventory` (notes documentado) e `inventory_movements`
- `docs/MIGRATION_inventory_movements.sql`: script SQL a ejecutar manualmente en Supabase

## Pasos para Activar

### 1. Ejecutar migración en Supabase

Abrir el editor SQL en dashboard.supabase.io, copiar `docs/MIGRATION_inventory_movements.sql` y ejecutar.

### 2. Compilar

```bash
npm run build
# o: npx tsc --noEmit
```

### 3. Probar

```bash
npm run dev
```

**Casos a validar:**
- Cocinera con 1 colegio → no debe pedir elegir colegio al agregar/entregar
- Cocinera con 2+ colegios → debe mostrar pantalla de selección antes de escaneo
- Entrega que agota stock → notas de voz deben persistir (antes se perdían)
- `/admin/asignaciones` → filtros por colegio/tipo activos, badges de tipo y colegio visibles

## Limitaciones

- El historial arranca vacío desde el día del despliegue
- Los movimientos anteriores en `inventory` no se migran automáticamente (fueron sobrescritos por updates)

## Breaking Changes

- Función `actualizarNotasInventario` removida → usar `actualizarNotasMovimiento`
- El historial se lee de `inventory_movements`, no de `inventory`
- Queries de reportes cambian: antes leían stock acumulado, ahora leen eventos discretos
