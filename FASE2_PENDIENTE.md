# ⏳ FASE 2 - LO QUE FALTA

**Completado:** ✅ userService.ts, ✅ firestore.rules

---

## 🔧 PASOS PENDIENTES

### 1. Hacerte Admin Manualmente

**AHORA MISMO:**
1. Abrí: https://console.firebase.google.com
2. Seleccioná proyecto: "futbol-stats-app"
3. Firestore Database > Collection "users"
4. Buscá TU usuario (tu email)
5. Editá el documento
6. Agregá campo: `role` = `"admin"` (como string)
7. Guardá

**Ahora sos admin y podés probar el sistema**

---

### 2. Acceder al Admin Panel

En la consola del navegador (Cmd + Option + J):
```javascript
// Temporal para probar
window.location.hash = '#admin'
// O si usás pages:
// Buscá en tu app cómo navegar a 'admin'
```

---

### 3. Para próxima sesión: Integrar en AuthContext

Archivo: `contexts/AuthContext.tsx`

**Agregar import** (línea ~17):
```typescript
import { createUserProfile } from '../services/userService';
```

**Modificar función syncUserToFirestore** para que llame a createUserProfile

**NOTA:** Hacelo con un editor visual (VS Code), NO con terminal

---

## ✅ VALIDAR QUE FUNCIONA

1. Usuario creado en Firestore tiene campo `role: "admin"`
2. Podés acceder a alguna página de admin
3. No hay errores en consola

