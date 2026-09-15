import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { db } from './firebase';

// ─── Datos completos del usuario ─────────────────────────────────────────────

export const loadUserData = async (userId) => {
  if (!userId) return null;
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
};

export const saveUserData = async (userId, dataKey, data) => {
  if (!userId) return;
  await setDoc(doc(db, 'users', userId), { [dataKey]: data }, { merge: true });
};

// ─── Perfil ligero (para lista de admin) ─────────────────────────────────────
// Solo almacena datos de presentación + stats resumen (~200 bytes por usuario)
// getAllUserProfiles lee de aquí en vez del documento completo

export const saveUserProfile = async (userId, { displayName, email, photoURL, role }, stats = {}) => {
  if (!userId) return;
  await setDoc(doc(db, 'profiles', userId), {
    displayName: displayName || null,
    email:       email       || null,
    photoURL:    photoURL    || null,
    role:        role        || 'user',
    stats: {
      totalDays:      stats.totalDays      ?? 0,
      totalExercises: stats.totalExercises ?? 0,
      lastWeight:     stats.lastWeight     ?? null,
    },
    updatedAt: Date.now(),
  }, { merge: true });
};

export const getAllUserProfiles = async () => {
  const q    = query(collection(db, 'profiles'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
};

// Escucha en tiempo real — devuelve caché local (~50ms) y luego actualiza desde red
// onCallback recibe el array de perfiles. Devuelve unsubscribe().
export const subscribeToUserProfiles = (onCallback) => {
  const q = query(collection(db, 'profiles'), limit(100));
  return onSnapshot(q, (snap) => {
    const profiles = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    onCallback(profiles);
  });
};

// ─── Contenido global ────────────────────────────────────────────────────────

export const loadGlobalRoutines = async () => {
  const snap = await getDoc(doc(db, 'content', 'routines'));
  return snap.exists() ? snap.data().list : null;
};

export const saveGlobalRoutines = async (routines) => {
  await setDoc(doc(db, 'content', 'routines'), { list: routines });
};

export const loadGlobalLibrary = async () => {
  const snap = await getDoc(doc(db, 'content', 'exerciseLibrary'));
  return snap.exists() ? snap.data().list : null;
};

export const saveGlobalLibrary = async (library) => {
  await setDoc(doc(db, 'content', 'exerciseLibrary'), { list: library });
};

// ─── Carga inicial paralela ───────────────────────────────────────────────────
// Lanza userData + librería + rutinas globales en paralelo → más rápido

export const loadInitialData = async (userId) => {
  const [userData, library, globalRoutines] = await Promise.all([
    loadUserData(userId),
    loadGlobalLibrary(),
    loadGlobalRoutines(),
  ]);
  return { userData, library, globalRoutines };
};
