# Acerca del Proyecto
App-web para un sistema de inventarios de utensilios para cocinas industriales, con un diseño moderno y colores claros, con dos paneles Admin e Inventarios, con apoyo a los filtros de búsqueda por medio de Escáner de Código de Barras y Comandos de Voz

---
### Características

- Inventario de Utensilios
- Asignación a Cocinero el Inventario y cantidad
- Búsqueda por medio de Código de Barras
- Análisis de Stock
- CRUD completos de cocineros y utensilios
- Estadísticas de inventario por colegio


---

### Arquitectura del Proyecto

```bash  
src/  
├── app/  
│ ├── dashboard/  
│ ├── inventory/  
│ ├── auth/  
│ └── api/  
│  
├── components/  
│ ├── ui/  
│ ├── forms/  
│ └── tables/  
│  
├── modules/  
│ ├── inventory/  
│ ├── pos/  
│ ├── reports/  
│ └── users/  
│  
├── services/  
│ ├── supabase/  
│ ├── api/  
│ └── auth/  
│  
├── store/  
├── hooks/  
├── lib/  
├── types/  
├── utils/  
└── styles/  
```

---

### Tecnologías

- Next.js + React
- Typescript
- Subapase
- TaiwlindCSS

---
### Instalación


```
#instalar dependencias

npm install
```

```
#iniciar el proyecto local

npm run dev
```

---
### Autor
- Gustavo Cardona