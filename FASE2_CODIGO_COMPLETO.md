# 🔐 FASE 2: SISTEMA DE ROLES - CÓDIGO COMPLETO

**Fecha:** 6 de febrero de 2026  
**Estado:** Pendiente de implementación

---

## 📋 ARCHIVOS A CREAR/MODIFICAR

### 1️⃣ `services/userService.ts` (CREAR NUEVO)
```typescript
import { doc, setDoc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
  displayName?: string;
  photoURL?: string;
}

export const createUserProfile = async (
  uid: string,
  email: string,
  displayName?: string,
  photoURL?: string
): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  
  const existingUser = await getDoc(userRef);
  if (existingUser.exists()) {
    await updateDoc(userRef, { lastLogin: new Date() });
    return;
  }
  
  const userProfile: UserProfile = {
    uid,
    email,
    role: 'user',
    createdAt: new Date(),
    lastLogin: new Date(),
    displayName: displayName || email.split('@')[0],
    photoURL
  };
  
  await setDoc(userRef, userProfile);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  
  return null;
};

export const isUserAdmin = async (uid: string): Promise<boolean> => {
  const profile = await getUserProfile(uid);
  return profile?.role === 'admin';
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  return usersSnapshot.docs.map(doc => doc.data() as UserProfile);
};

export const updateUserRole = async (uid: string, newRole: UserRole): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { role: newRole });
};
```

---

### 2️⃣ `firestore.rules` (REEMPLAZAR COMPLETO)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    match /matches/{matchId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                      (resource.data.createdBy == request.auth.uid || isAdmin());
      allow delete: if isAuthenticated() && 
                      (resource.data.createdBy == request.auth.uid || isAdmin());
    }
    
    match /admin/{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

---

### 3️⃣ Cómo hacerte ADMIN manualmente

Después de implementar todo:

1. Abrí Firebase Console: https://console.firebase.google.com
2. Seleccioná tu proyecto "futbol-stats-app"
3. Andá a Firestore Database
4. Buscá la collection "users"
5. Encontrá tu usuario (tu email)
6. Editá el documento
7. Cambiá el campo `role` de `"user"` a `"admin"`
8. Guardá

Ahora sos admin y podés acceder a /admin

---

## 🧪 PRÓXIMOS PASOS

1. Crear archivo `services/userService.ts` con el código de arriba
2. Reemplazar `firestore.rules` con las nuevas reglas
3. Deploy de las reglas: `firebase deploy --only firestore:rules`
4. Modificar tu usuario en Firestore para ser admin
5. Acceder a la app y navegar manualmente a admin usando `setCurrentPage('admin')` desde la consola del navegador

---

## 🚀 WORKFLOW SUGERIDO PARA PRÓXIMA SESIÓN
```bash
# 1. Asegurarse de estar en la rama correcta
cd ~/Proyectos/Plyon
git checkout feature/admin-dashboard
git pull

# 2. Crear userService (copiar código de arriba)
# Crear archivo con tu editor de código favorito

# 3. Actualizar firestore.rules (copiar código de arriba)
# Editar archivo con tu editor de código favorito

# 4. Commit
git add services/userService.ts firestore.rules
git commit -m "feat: agregar sistema de roles básico"
git push

# 5. Deploy de reglas a Firebase
firebase deploy --only firestore:rules

# 6. Hacerte admin manualmente en Firebase Console

# 7. Probar accediendo a admin desde la consola del navegador
```

---

## 💡 NOTA IMPORTANTE

Para la próxima sesión, es mejor **editar los archivos con un editor de código** (VS Code, Cursor, etc.) en lugar de usar comandos `cat` en la terminal, ya que eso causó problemas.

