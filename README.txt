Lentes 46 — PWA Full Fix (iOS + Android)
========================================

Qué trae:
- index.html (registra './sw.js', enlaza manifest y apple-touch-icon)
- style.css, script.js (app completa)
- manifest.webmanifest (icons, colores, start_url '.', scope '.')
- sw.js (cachea usando URLs absolutas a partir de self.location → funciona en GitHub Pages subpaths)
- icons/ (192, 512, 180)

Cómo publicar (GitHub Pages):
1) Sube TODOS los archivos (no subas el ZIP como .zip).
2) Settings → Pages → Source: Deploy from a branch → Branch: main → / (root) → Save.
3) Abre la URL pública (https://TU-USUARIO.github.io/TU-REPO/).

Instalar:
- iPhone: Safari → Compartir → Añadir a pantalla de inicio.
- Android: Chrome → Menú (⋮) → Instalar app / Añadir a pantalla principal.

Actualizar:
- Cambia archivos y confirma (Commit).
- En el teléfono: abre la URL en el navegador y refresca; cierra y abre el icono.

Fecha: 2025-08-16 03:47:28
