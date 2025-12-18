
# Guía de Profesionalización: FútbolStats

Esta guía te ayudará a pasar de "copiar carpetas" a un sistema de desarrollo profesional con una URL única.

## 1. Preparación Inicial (Solo una vez)

### A. Inicializar Git
Si aún no usas Git en tu carpeta, abre la terminal en la carpeta del proyecto y ejecuta:
```bash
git init
git add .
git commit -m "Initial commit: FútbolStats v4"
```

### B. Subir a GitHub
1. Crea un repositorio nuevo en GitHub (ej: `futbol-stats-app`).
2. Sigue las instrucciones de GitHub para "push an existing repository".

## 2. Configurar la URL Única (Hosting)

Recomendamos **Vercel** porque es gratuito para proyectos personales y muy rápido.

1. Ve a [vercel.com](https://vercel.com) y regístrate con tu cuenta de GitHub.
2. Haz clic en "Add New..." -> "Project".
3. Selecciona tu repositorio `futbol-stats-app`.
4. En "Framework Preset", si usas Vite selecciona "Vite", si no, déjalo en "Other" (Vercel suele detectarlo solo).
5. Dale a **Deploy**.

¡Listo! Vercel te dará una URL (ej: `futbol-stats.vercel.app`).
Si compraste `app.futbolstats.com`, ve a Settings -> Domains en Vercel y agrégalo ahí.

## 3. Flujo de Trabajo Diario (Cómo lanzar versiones)

Ya no crearás carpetas nuevas. Harás esto:

### Paso 1: Haz tus cambios en código
Modifica la app, agrega funcionalidades, arregla bugs.

### Paso 2: Sube la versión
Cuando estés listo para que los usuarios vean los cambios, corre este script (requiere Node.js):

```bash
node scripts/bump_version.cjs patch
# Usa 'minor' para cambios medianos o 'major' para cambios grandes
```

Esto actualizará automáticamente `metadata.json` y `version.ts`.

### Paso 3: Publica
```bash
git add .
git commit -m "Mejora: Nueva funcionalidad de estadísticas"
git push origin main
```

**¡Magia!** 
1. Vercel detectará el `push` a `main`.
2. Construirá la nueva versión y reemplazará la vieja en `app.futbolstats.com` en segundos.
3. Gracias al archivo `vercel.json` que agregamos, el navegador del usuario sabrá que hay cambios.
4. El componente `VersionChecker` en la app detectará que `metadata.json` cambió y le mostrará el aviso al usuario: "Nueva versión disponible: v4.1.1".

## Resumen
- **Nunca más cambies la URL.**
- **Nunca más copies la carpeta.**
- Usa `git push` para publicar.
- El sistema avisa a los usuarios automáticamente.
