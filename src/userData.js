import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, query, limit, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

// ─── Datos completos del usuario ─────────────────────────────────────────────

export const loadUserData = async (userId) => {
  if (!userId) return null;
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
};

export const saveUserData = async (userId, dataKey, data) => {
  if (!userId) return;
  // mergeFields reemplaza el campo completo: con merge:true los mapas se mezclan
  // y lo que se borra localmente (p. ej. un ejercicio desmarcado) seguía en Firestore.
  await setDoc(doc(db, 'users', userId), { [dataKey]: data }, { mergeFields: [dataKey] });
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
// Rutinas y librería llevan un número de versión. Cada guardado lee la versión del
// servidor dentro de una transacción y solo escribe si es la misma que tenía este
// dispositivo al cargar: así un dispositivo con una copia vieja no pisa una más nueva
// (pasó con una copia de abril que borró las rutinas Kettlebell). Las reglas de
// Firestore exigen además que cada escritura suba la versión en uno.

export class StaleContentError extends Error {
  constructor(name, server) {
    super(`content/${name} cambió en otro dispositivo`);
    this.server = server; // { list, version } vigente en el servidor
  }
}

const readContent = (snap) => (snap.exists()
  ? { list: snap.data().list ?? null, version: snap.data().version ?? 0 }
  : { list: null, version: 0 });

const loadGlobalContent = async (name) => readContent(await getDoc(doc(db, 'content', name)));

// Devuelve la nueva versión, o lanza StaleContentError si el servidor ya tenía otra.
export const saveGlobalContent = (name, list, baseVersion) => runTransaction(db, async (transaction) => {
  const ref = doc(db, 'content', name);
  const server = readContent(await transaction.get(ref));
  if (server.version !== baseVersion) throw new StaleContentError(name, server);
  const version = baseVersion + 1;
  transaction.set(ref, { list, version, updatedAt: Date.now() });
  return version;
});

// ─── Carga inicial paralela ───────────────────────────────────────────────────
// Lanza userData + librería + rutinas globales en paralelo → más rápido

export const loadInitialData = async (userId) => {
  const [userData, library, globalRoutines] = await Promise.all([
    loadUserData(userId),
    loadGlobalContent('exerciseLibrary'),
    loadGlobalContent('routines'),
  ]);
  return { userData, library, globalRoutines };
};
