🗃️ Database Schema – Cook System

## 📌 Propósito

Definir la estructura de la base de datos para gestionar:

* Profiles (profiles) / Usuarios
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

## utensils (Utensilios)

| Campo       | Tipo    | Descripción    |
| ----------- | ------- | -------------- |
| id          | int8    | PK             |
| name        | text    | Nombre         |
| sku         | numeric | Código QR      |
| description | text    | Descripción    |
| created_at  | date    | Fecha Creación |

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

## inventory (Inventario Utensilios)


| Campo       | Tipo | Descripción         |
| ----------- | ---- | ------------------- |
| id          | int8 | PK                  |
| cook_id     | int8 | FK → cook           |
| utensils_id | int8 | FK → utensils       |
| created_at  | date | Fecha de creación   |
| updated_at  | date | Fecha actualizacion |

---

## cook_school (Colegio Cocinera)


| Campo      | Tipo | Descripción     |
| ---------- | ---- | --------------- |
| id         | int8 | PK              |
| cook_id    | int8 | FK → cook       |
| school_id  | int8 | FK → school     |
| created_at | date | Fecha Creación  |
