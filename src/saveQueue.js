// Cola de guardados: agrupa los cambios unos segundos para no escribir en Firestore en cada
// toque. Si la app se cierra o pasa a segundo plano antes, flush() copia lo pendiente a
// localStorage (síncrono: la escritura de Firestore no alcanza a terminar si la página se
// descarga) y lanza los guardados. La copia se borra cuando Firestore confirma; si no
// alcanza, readUnsaved() la devuelve la próxima vez para aplicarla y guardarla de nuevo.
// meta() (opcional) se guarda junto a la copia: p. ej. la versión sobre la que se hizo el
// cambio, para descartarla si mientras tanto otro dispositivo guardó una más nueva.
export function createSaveQueue(storageKey) {
  const pending = new Map();

  const readUnsaved = () => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; }
  };

  const writeUnsaved = (unsaved) => {
    try {
      if (Object.keys(unsaved).length) localStorage.setItem(storageKey, JSON.stringify(unsaved));
      else localStorage.removeItem(storageKey);
    } catch {
      // Sin almacenamiento disponible: queda solo el guardado normal.
    }
  };

  const run = (key) => {
    const entry = pending.get(key);
    if (!entry) return;
    pending.delete(key);
    clearTimeout(entry.timer);
    const startedAt = Date.now();
    entry.save()
      .then(() => {
        // Solo se borra la copia si es de antes de este guardado, no una más nueva.
        const unsaved = readUnsaved();
        if (unsaved[key] && unsaved[key].at <= startedAt) {
          delete unsaved[key];
          writeUnsaved(unsaved);
        }
      })
      .catch((err) => console.error(`Error guardando ${key}:`, err));
  };

  return {
    schedule(key, value, save, delay, meta) {
      clearTimeout(pending.get(key)?.timer);
      pending.set(key, { value, save, meta, timer: setTimeout(() => run(key), delay) });
    },
    flush() {
      if (!pending.size) return;
      const unsaved = readUnsaved();
      const at = Date.now();
      pending.forEach(({ value, meta }, key) => { unsaved[key] = { value, at, meta: meta?.() }; });
      writeUnsaved(unsaved);
      [...pending.keys()].forEach(run);
    },
    readUnsaved,
    discardUnsaved(key) {
      const unsaved = readUnsaved();
      if (!(key in unsaved)) return;
      delete unsaved[key];
      writeUnsaved(unsaved);
    },
  };
}
