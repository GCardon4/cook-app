# Descripción del Proyecto
App-web para un sistema de inventarios de utensilios para cocinas industriales, con un diseño moderno y colores claros, con dos paneles Admin e Inventarios, con apoyo a los filtros de búsqueda por medio de Escáner de Código de Barras y Comandos de Voz


# Agents Rules
-   Cada función nueva debe incluir una linea con el nombre de la acción en Español.
-   Todas las variables y funciones deben escribirse en camelCase
-   No uses snake_case
-   la carpeta /docs con las información completa del proyecto
-   Los Diseños siempre deben adaptarse en movil y web /Responsive Design
-   Ideas de Diseños en la carpeta /ideas


### Arquitectura del Proyecto

src/
├── app/            # Routing (Next.js)
├── modules/        # Lógica por dominio
├── components/     # UI reutilizable
├── lib/            # Servicios y utilidades
├── store/          # Estado global
├── types/          # Tipos globales


##  Stack Tecnológico

- **Frontend**: Next.js - React
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **PWA**: Workbox (configurado)