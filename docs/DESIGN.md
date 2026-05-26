---
name: Sistema de Gestión de Cocina Industrial
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3d4947'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#b90538'
  on-secondary: '#ffffff'
  secondary-container: '#dc2c4f'
  on-secondary-container: '#fffbff'
  tertiary: '#924628'
  on-tertiary: '#ffffff'
  tertiary-container: '#b05e3d'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#ffdadb'
  secondary-fixed-dim: '#ffb2b7'
  on-secondary-fixed: '#40000d'
  on-secondary-fixed-variant: '#92002a'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#773215'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-tabular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 24px
  gutter: 16px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style
The design system is centered on **Minimalism** and **Efficiency**, tailored specifically for the high-pressure environment of industrial kitchens. The visual narrative prioritizes clarity, hygiene, and rapid information processing. By using a "Light and Airy" aesthetic, the system reduces cognitive load for chefs and inventory managers who need to make split-second decisions about stock levels and procurement.

The interface evokes a sense of **Clinical Precision** and **Trustworthiness**. Surfaces are primarily white or very light gray to mirror the cleanliness of a professional kitchen, while tactile interactions remain subtle yet responsive. The movement between views is fluid, emphasizing a tool-like utility rather than a decorative experience.

## Colors
The palette is dominated by **Blanco Puro** and **Gris Glaciar** (#F8FAFC) to create a spacious, breathable environment. 

- **Primario (Teal - #0D9488):** Used for "Success" states and primary navigation/action items. It represents growth, health, and professional stability.
- **Alerta (Coral - #F43F5E):** Reserved strictly for low stock alerts, expired items, or critical errors. Its high contrast against the cool teal ensures it captures attention without causing panic.
- **Neutrales:** A range of cool grays (from Slate 50 to Slate 900) provides hierarchy for text and borders, maintaining a neutral, grounded atmosphere.

## Typography
**Inter** is the sole typeface for the design system, chosen for its exceptional legibility in data-heavy environments. 

The typography system uses a tight scale to keep as much information "above the fold" as possible without sacrificing readability. 
- **Tabular Numerals:** Essential for inventory counts; the `data-tabular` role ensures that columns of numbers align perfectly for quick scanning.
- **Language Nuance:** Spanish character sets (accents, ñ) are rendered with generous x-height for maximum clarity on low-resolution kitchen tablets.
- **Hierarchy:** Use `label-caps` for table headers and category tags to differentiate metadata from content.

## Layout & Spacing
This design system utilizes a **Fixed-Fluid Hybrid Grid**. On desktop, content is contained within a 1280px max-width 12-column grid to prevent line lengths from becoming unreadable. On tablet (the primary device for kitchen staff), the layout shifts to a fluid 8-column grid with increased touch targets.

- **Spacing Rhythm:** Based on an 8px base unit. 
- **Whitespace:** Generous padding within cards (minimum 24px) is mandatory to ensure the UI feels "airy" and not cramped, despite the density of inventory data.
- **Mobile/Tablet:** Gutters expand to 24px on mobile to prevent accidental taps in high-motion environments.

## Elevation & Depth
Depth is conveyed through **Soft Ambient Shadows** rather than harsh borders. This reinforces the "clean" industrial aesthetic.

- **Base Level (Nivel 0):** The background surface (#F8FAFC).
- **Card Level (Nivel 1):** White surfaces (#FFFFFF) with a very soft shadow (0px 4px 20px rgba(0,0,0,0.04)). Used for individual stock items or category groups.
- **Interactive Level (Nivel 2):** On hover or selection, the shadow deepens slightly (0px 10px 30px rgba(0,0,0,0.08)) to provide immediate tactile feedback.
- **Overlays:** Modals and dropdowns use a subtle backdrop blur (8px) to maintain context while focusing on the task.

## Shapes
The design system uses a **Rounded (Level 2)** shape language. 
- **Standard Radius (8px):** Applied to buttons, input fields, and standard cards.
- **Large Radius (16px):** Applied to major layout containers and high-level dashboard widgets.
- **Pill (Full Round):** Applied only to status "Chips" (e.g., "En Stock", "Agotado") to distinguish them from interactive buttons.

This moderate rounding strikes a balance between the "hardness" of industrial hardware and the "softness" of modern user-friendly software.

## Components
- **Buttons (Botones):** Primary actions use the Teal background with white text. Secondary actions use a ghost style (Teal outline or text only).
- **Inventory Cards (Tarjetas):** Features a bold title, a large "Current Stock" number, and a secondary "Unit" label (kg, liters, units). A bottom-aligned sparkline or progress bar shows usage trends.
- **Status Chips:** High-contrast background for critical alerts (Coral for "Crítico") and subtle, low-opacity backgrounds for stable states (Soft Teal for "Estable").
- **Input Fields:** Minimalist design with a focus on large, clear tap targets for numeric entry (steppers are preferred over keyboard entry for quick adjustments).
- **Data Tables:** Zebra-striping is avoided; instead, use thin light-gray dividers (#F1F5F9) to maintain the airy feel. Header cells use `label-caps` typography.
- **Alert Toast:** Appears at the top-right, utilizing the Coral accent for urgency, specifically for "Inventario Bajo" notifications.