🗃️ Database Schema – Cook System

## 📌 Propósito

Definir la estructura de la base de datos para gestionar:

* Profiles (profiles) / Usuarios
* Roles (roles) /Roles del Usuario par authenticación
* Utensils (utensils) / Utensilios
* Cook (cook) /Cocineras
* School (school) /Colegios 
* Inventory (inventory) /Utensilios asignados a la cocinera
* Cook School (cook_school) /Colegio donde se encuentra la cocinera 

Este esquema soporta múltiples clientes que presentan visualizaciones y clics constantes

---

# Entidades Principales

## profiles (Usuarios del sistema)

| Campo      | Tipo | Descripción            |
| ---------- | ---- | ---------------------- |
| id         | uuid | PK (Auth Supabase)     |
| full_name  | text | Nombre Usuario         |
| email      | text | Email del usuario      |
| avatar_url | text | Avatar                 |
| created_at | date | Fecha de creación      |
| updated_at | date | Fecha de Actualizacion |
| role_id    | int8 | FK → roles             |

---

## roles (Roles del Usuario)

| Campo      | Tipo | Descripción            |
| ---------- | ---- | ---------------------- |
| id         | uuid | PK (Auth Supabase)     |
| created_at | date | Fecha de creación      |
| name       | text | Nombre del Rol         |

---

## utensils (Utensilios)

| Campo       | Tipo    | Descripción            |
| ----------- | ------- | ---------------------- |
| id          | int8    | PK                     |
| name        | text    | Nombre                 |
| sku         | numeric | Código QR              |
| stock       | numeric | Cantidad de Utensilios |
| description | text    | Descripción            |
| created_at  | date    | Fecha Creación         |
| updated_at  | date    | Fecha de Actualizacion |

---

## cook (Cocinera)

| Campo      | Tipo    | Descripción    |
| ---------- | ------- | -------------- |
| id         | int8    | PK             |
| name       | text    | Nombre         |
| doc        | numeric | Cédula         |
| phone      | numeric | Contacto       |
| created_at | date    | Fecha Creación |

---
## school (Colegio)

| Campo      | Tipo | Descripción    |
| ---------- | ---- | -------------- |
| id         | int8 | PK             |
| name       | text | Nombre         |
| address    | text | Dirección      |
| created_at | date | Fecha Creación |

---

## inventory (Inventario Utensilios - Estado actual)


| Campo       | Tipo       | Descripción              |
| ----------- | ---------- | ------------------------ |
| id          | int8       | PK                       |
| cook_id     | int8       | FK → cook                |
| utensils_id | int8       | FK → utensils            |
| stock       | numeric    | Cantidad actual          |
| notes       | text       | Notas de devolución      |
| add_date    | timestampz | Fecha cuando se agregó   |
| return_date | timestampz | Fecha cuando se entregó  |
| created_at  | date       | Fecha de creación        |
| updated_at  | date       | Fecha actualizacion      |

---

## cook_school (Colegio Cocinera)


| Campo      | Tipo | Descripción     |
| ---------- | ---- | --------------- |
| id         | int8 | PK              |
| cook_id    | int8 | FK → cook       |
| school_id  | int8 | FK → school     |
| created_at | date | Fecha Creación  |

---

## inventory_movements (Historial de movimientos de utensilios)

Ledger de solo-inserción que registra cada evento de escaneo (agregado/entregado) con fecha, colegio y notas. Independiente del estado mutable de `inventory`.

**Nota:** Esta tabla debe ser creada manualmente en Supabase ejecutando el SQL en `docs/MIGRATION_inventory_movements.sql`.

| Campo       | Tipo    | Descripción              |
| ----------- | ------- | ------------------------ |
| id          | int8    | PK                       |
| cook_id     | int8    | FK → cook                |
| utensils_id | int8    | FK → utensils            |
| school_id   | int8    | FK → school (nullable)   |
| type        | text    | 'agregado' o 'entregado' |
| quantity    | numeric | Cantidad movida          |
| notes       | text    | Notas (nullable)         |
| status      | bool    | Estado del utensilio: TRUE = Bueno, FALSE = Malo (default TRUE) |
| created_at  | date    | Fecha del movimiento     |
