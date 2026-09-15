import { useState } from 'react';
import { clsx } from 'clsx';
import {
  Search, Trash2, PlusCircle, AlertTriangle, X, ArrowLeft,
  Footprints, ArrowUpFromLine, ArrowUpToLine, Weight, Zap, Target,
  Activity, HeartPulse, Layers, HelpCircle, BookOpen,
} from 'lucide-react';

const CATEGORIES = ['Piernas', 'Tracción', 'Empuje', 'Pesa Rusa', 'Tríceps', 'Core', 'Movilidad', 'Cardio', 'Superset', 'Otro'];

const CATEGORY_META = {
  'Piernas':    { icon: Footprints,      color: 'bg-emerald-500' },
  'Tracción':   { icon: ArrowUpFromLine, color: 'bg-blue-500'    },
  'Empuje':     { icon: ArrowUpToLine,   color: 'bg-orange-500'  },
  'Pesa Rusa':  { icon: Weight,          color: 'bg-amber-500'   },
  'Tríceps':    { icon: Zap,             color: 'bg-purple-500'  },
  'Core':       { icon: Target,          color: 'bg-red-500'     },
  'Movilidad':  { icon: Activity,        color: 'bg-teal-500'    },
  'Cardio':     { icon: HeartPulse,      color: 'bg-pink-500'    },
  'Superset':   { icon: Layers,          color: 'bg-indigo-500'  },
  'Otro':       { icon: HelpCircle,      color: 'bg-gray-400'    },
};

// Retorna las rutinas que usan un ejercicio por nombre
function getUsageInRoutines(exerciseName, routines) {
  return routines.filter(r =>
    r.ejercicios?.some(ex => ex.nombre === exerciseName)
  );
}

// ─── Modal de confirmación de borrado ────────────────────────────────────────
function DeleteConfirmModal({ exercise, usedIn, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-sm rounded-lg border border-border p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-danger/10 p-2 rounded-xl shrink-0">
            <AlertTriangle size={20} className="text-danger" />
          </div>
          <div>
            <h3 className="font-bold text-base">Eliminar ejercicio</h3>
            <p className="text-sm text-muted mt-1">
              ¿Seguro que quieres eliminar <strong className="text-text">"{exercise.nombre}"</strong> de la librería?
            </p>
          </div>
        </div>

        {usedIn.length > 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-warning flex items-center gap-1.5">
              <AlertTriangle size={12} />
              Este ejercicio se usa en {usedIn.length} {usedIn.length === 1 ? 'rutina' : 'rutinas'}:
            </p>
            <ul className="space-y-0.5">
              {usedIn.map(r => (
                <li key={r.id} className="text-xs text-muted pl-2">· {r.titulo}</li>
              ))}
            </ul>
            <p className="text-xs text-muted mt-1">Los ejercicios ya añadidos a esas rutinas no se borrarán, solo se elimina de la librería.</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium text-muted hover:text-text bg-surface2 hover:bg-surface2 rounded-xl transition-colors border border-border">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-danger hover:bg-danger/80 rounded-xl transition-colors">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pantalla de selección de categoría ──────────────────────────────────────

function CategoryPickerScreen({ library, onSelect, onAddNew }) {
  const cats = Array.from(new Set(library.map(e => e.categoria)));
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <p className="text-sm text-muted mb-6">¿Qué categoría de ejercicios quieres ver?</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cats.map(cat => {
          const count = library.filter(e => e.categoria === cat).length;
          const meta  = CATEGORY_META[cat] || { icon: HelpCircle, color: 'bg-gray-400' };
          const Icon  = meta.icon;
          return (
            <button key={cat} onClick={() => onSelect(cat)}
              className="flex flex-col items-start gap-3 p-5 bg-surface border border-border rounded-lg hover:shadow-md hover:border-primary/30 transition-all text-left">
              <div className={clsx("flex items-center justify-center w-10 h-10 rounded-xl text-white", meta.color)}>
                <Icon size={18} />
              </div>
              <div>
                <p className="font-bold text-sm">{cat}</p>
                <p className="text-xs text-muted mt-0.5">{count} {count === 1 ? 'ejercicio' : 'ejercicios'}</p>
              </div>
            </button>
          );
        })}
        {/* Card "Todos" */}
        <button onClick={() => onSelect('Todas')}
          className="flex flex-col items-start gap-3 p-5 bg-surface border-2 border-dashed border-border rounded-lg hover:border-primary/40 hover:shadow-md transition-all text-left">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface2 text-muted">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">Todos</p>
            <p className="text-xs text-muted mt-0.5">{library.length} ejercicios</p>
          </div>
        </button>
      </div>
      <div className="mt-8">
        <button onClick={onAddNew}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-semibold transition-colors">
          <PlusCircle size={16} />
          Añadir ejercicio nuevo
        </button>
      </div>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export function ExerciseLibraryManagerView({ library, onUpdateLibrary, routines }) {
  const [catFilter, setCatFilter] = useState(null); // null = pantalla de selección
  const [search,    setSearch]    = useState('');
  const [toDelete,  setToDelete]  = useState(null);

  // Form nuevo ejercicio
  const [showForm,  setShowForm]  = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newCat,    setNewCat]    = useState('Piernas');

  const handleSelectCat = (cat) => {
    setCatFilter(cat);
    setSearch('');
  };

  const handleBack = () => {
    setCatFilter(null);
    setSearch('');
    setShowForm(false);
  };

  const filtered = library.filter(e => {
    const matchCat    = catFilter === 'Todas' || e.categoria === catFilter;
    const matchSearch = !search || e.nombre.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDelete = (exercise) => {
    const usedIn = getUsageInRoutines(exercise.nombre, routines);
    setToDelete({ exercise, usedIn });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    onUpdateLibrary(library.filter(e => e.nombre !== toDelete.exercise.nombre));
    setToDelete(null);
  };

  const handleAdd = () => {
    const nombre = newNombre.trim();
    if (!nombre) return;
    if (library.some(e => e.nombre.toLowerCase() === nombre.toLowerCase())) return;
    onUpdateLibrary([...library, { nombre, categoria: newCat }]);
    setNewNombre('');
    setNewCat('Piernas');
    setShowForm(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          {catFilter !== null && (
            <button onClick={handleBack}
              className="p-2 rounded-full hover:bg-surface2 text-muted hover:text-text transition-colors shrink-0">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Librería</h1>
              {catFilter && catFilter !== 'Todas' && (
                <span className="text-xs text-muted font-medium">· {catFilter}</span>
              )}
              {catFilter === 'Todas' && (
                <span className="text-xs text-muted font-medium">· Todos</span>
              )}
            </div>
            {catFilter === null && (
              <p className="text-xs text-muted mt-0.5">{library.length} ejercicios · solo admin</p>
            )}
          </div>
          {catFilter !== null && (
            <button onClick={() => { setShowForm(s => !s); }}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs py-2 px-3.5 rounded-xl transition-colors shrink-0">
              <PlusCircle size={14} />
              Nuevo
            </button>
          )}
        </div>

        {/* Formulario nuevo ejercicio (solo en vista de lista) */}
        {catFilter !== null && showForm && (
          <div className="bg-surface2 border border-border rounded-xl p-4 space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Añadir ejercicio</span>
              <button onClick={() => { setShowForm(false); setNewNombre(''); }} className="text-muted hover:text-text">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
              <div>
                <label className="text-xs text-muted block mb-1">Nombre *</label>
                <input autoFocus type="text" value={newNombre}
                  onChange={e => setNewNombre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="Ej: Press Militar"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Categoría</label>
                <select value={newCat} onChange={e => setNewCat(e.target.value)}
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleAdd} disabled={!newNombre.trim()}
                className="bg-primary hover:bg-primary-hover disabled:opacity-40 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors">
                Añadir
              </button>
            </div>
            {library.some(e => e.nombre.toLowerCase() === newNombre.trim().toLowerCase()) && newNombre.trim() && (
              <p className="text-xs text-warning">Ya existe un ejercicio con ese nombre.</p>
            )}
          </div>
        )}

        {/* Buscador: solo en vista de lista */}
        {catFilter !== null && !showForm && (
          <div className="relative mt-3">
            <input type="text" placeholder="Buscar ejercicio..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-xl py-2 pl-9 pr-4 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          </div>
        )}
      </div>

      {/* Contenido */}
      {catFilter === null ? (
        <CategoryPickerScreen
          library={library}
          onSelect={handleSelectCat}
          onAddNew={() => { setCatFilter('Todas'); setShowForm(true); }}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted gap-3">
              <BookOpen size={36} className="opacity-20" />
              <p className="text-sm">Sin resultados</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(ex => {
                const usedIn = getUsageInRoutines(ex.nombre, routines);
                return (
                  <div key={ex.nombre}
                    className="flex items-center gap-3 px-4 py-3 bg-surface rounded-xl border border-border hover:shadow-sm transition-shadow">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ex.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted">{ex.categoria}</span>
                        {usedIn.length > 0 && (
                          <span className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-full">
                            {usedIn.length} {usedIn.length === 1 ? 'rutina' : 'rutinas'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(ex)}
                      className="p-1.5 rounded-full text-muted hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
                      aria-label="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal confirmación borrado */}
      {toDelete && (
        <DeleteConfirmModal
          exercise={toDelete.exercise}
          usedIn={toDelete.usedIn}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
