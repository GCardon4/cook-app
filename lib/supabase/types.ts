// Tipos del schema de Supabase para KitchenLogix

export type Rol = {
  id: string
  name: string
  created_at: string
}

export type Perfil = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  role_id: number | null
}

export type Utensilio = {
  id: number
  name: string
  sku: number | null
  description: string | null
  created_at: string
  updated_at: string
}

export type Cocinera = {
  id: number
  name: string
  doc: number | null
  phone: number | null
  created_at: string
}

export type Colegio = {
  id: number
  name: string
  address: string | null
  created_at: string
}

export type RegistroInventario = {
  id: number
  cook_id: number
  utensils_id: number
  created_at: string
  updated_at: string
}

export type ColegioCocinera = {
  id: number
  cook_id: number
  school_id: number
  created_at: string
}

// Tipo expandido para la vista de inventario (con relaciones)
// Supabase retorna el FK join como array incluso en relaciones muchos-a-uno
export type UtensilioConInventario = {
  id: number
  name: string
  sku: number | null
  description: string | null
  stock: number
  created_at: string
  updated_at: string
  inventory: {
    id: number
    cook_id: number
    stock: number
    created_at: string
    cook: Pick<Cocinera, 'id' | 'name'>[] | null
  }[]
}

// Tipo para la vista de inventario agrupado por cocinera
export type InventarioConDetalle = {
  id: number
  created_at: string
  updated_at: string
  utensils: Pick<Utensilio, 'id' | 'name' | 'sku' | 'description'> | null
  cook: Pick<Cocinera, 'id' | 'name'> | null
}
