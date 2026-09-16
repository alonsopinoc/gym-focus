import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Dumbbell, Zap, HeartPulse, Star, Repeat, Search, Edit,
  PlusCircle, ChevronRight, ChevronDown, X, ArrowLeft, Trash2, BookOpen,
  Weight, Target, RefreshCw,
} from 'lucide-react';
import { MinimalNumberInput } from './MinimalNumberInput';
// ─── Constantes ───────────────────────────────────────────────────────────────

const ROUTINE_TYPES = {
  F:         { label: 'Fuerza',      badge: 'bg-blue-500',    border: 'border-l-blue-500',    icon: <Dumbbell size={13} /> },
  F_BASICOS: { label: 'Básicos F',   badge: 'bg-sky-400',     border: 'border-l-sky-400',     icon: <Star size={13} /> },
  HIBRIDA:   { label: 'Híbrido',     badge: 'bg-purple-500',  border: 'border-l-purple-500',  icon: <Repeat size={13} /> },
  M:         { label: 'Metabólico',  badge: 'bg-red-500',     border: 'border-l-red-500',     icon: <Zap size={13} /> },
  AM:        { label: 'Activación',  badge: 'bg-emerald-500', border: 'border-l-emerald-500', icon: <HeartPulse size={13} /> },
  RM:        { label: 'Resistencia', badge: 'bg-orange-500',  border: 'border-l-orange-500',  icon: <HeartPulse size={13} /> },
  K:         { label: 'Kettlebell',  badge: 'bg-amber-500',   border: 'border-l-amber-500',   icon: <Weight size={13} /> },
  B:         { label: 'Básico',      badge: 'bg-teal-500',    border: 'border-l-teal-500',    icon: <Target size={13} /> },
};

const TAB_ORDER  = ['ALL', 'F', 'AM', 'F_BASICOS', 'HIBRIDA', 'M', 'RM', 'K', 'B'];
const TAB_LABELS = { ALL: 'Todos', F: 'Fuerza', F_BASICOS: 'Básicos F', HIBRIDA: 'Híbrido', M: 'Metabólico', AM: 'Activación', RM: 'Resistencia', K: 'Kettlebell', B: 'Básico' };


// ─── Selector de ejercicio desde librería ─────────────────────────────────────

function ExerciseLibraryPicker({ library, onSelect, onClose }) {
  const [query, setQuery]      = useState('');
  const [cat, setCat]          = useState('Todas');
  const inputRef               = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const categories = ['Todas', ...Array.from(new Set(library.map(e => e.categoria)))];

  const filtered = library.filter(e => {
    const matchCat   = cat === 'Todas' || e.categoria === cat;
    const matchQuery = !query || e.nombre.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface2 text-muted">
          <ArrowLeft size={15} />
        </button>
        <span className="font-semibold text-sm flex-1">Librería de ejercicios</span>
        <span className="text-xs text-muted">{library.length} ejercicios</span>
      </div>

      {/* Buscador */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar ejercicio..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-xl py-2 pl-8 pr-3 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>
      </div>

      {/* Filtro categoría */}
      <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto shrink-0">
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={clsx(
              "shrink-0 text-xs font-medium px-2.5 py-1 rounded-full transition-all",
              cat === c ? "bg-primary text-white" : "bg-surface2 text-muted hover:text-text"
            )}>
            {c}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted text-center py-8">Sin resultados</p>
        ) : filtered.map(ex => (
          <button key={ex.nombre} onClick={() => onSelect(ex.nombre)}
            className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface2 transition-colors group">
            <div>
              <p className="text-sm font-medium">{ex.nombre}</p>
              <p className="text-xs text-muted">{ex.categoria}</p>
            </div>
            <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Card de rutina expandible ────────────────────────────────────────────────

function RoutineCard({ routine, isExpanded, onToggle, onSelect, onEdit }) {
  const type  = ROUTINE_TYPES[routine.tipo] || { label: 'General', badge: 'bg-gray-400', border: 'border-l-gray-400', icon: <Dumbbell size={13} /> };
  const count = routine.ejercicios?.length ?? 0;

  return (
    <div className={clsx(
      "bg-surface rounded-lg border border-border border-l-4 overflow-hidden transition-shadow duration-200",
      type.border,
      isExpanded ? "shadow-md" : "hover:shadow-sm"
    )}>
      {/* Header clickeable */}
      <div className="flex items-center gap-3 px-4 py-4 cursor-pointer select-none active:bg-surface2/40 transition-colors" onClick={onToggle}>
        <div className={clsx("flex items-center gap-1.5 text-xs text-white font-semibold px-2.5 py-1 rounded-full shrink-0", type.badge)}>
          {type.icon}
          <span>{type.label}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">{routine.titulo}</p>
          {routine.descripcion && (
            <p className="text-xs text-muted truncate mt-0.5">{routine.descripcion}</p>
          )}
        </div>
        <span className="text-xs text-muted shrink-0 hidden sm:block">{count} ejercicios</span>
        {onEdit && (
          <button onClick={e => { e.stopPropagation(); onEdit(routine); }}
            className="p-1.5 rounded-full text-muted hover:text-text hover:bg-surface2 transition-colors shrink-0"
            aria-label="Editar">
            <Edit size={14} />
          </button>
        )}
        <ChevronDown size={16} className={clsx("text-muted transition-transform duration-200 shrink-0", isExpanded && "rotate-180")} />
      </div>

      {/* Lista expandida */}
      {isExpanded && (
        <>
          <div className="border-t border-border divide-y divide-border">
            {routine.ejercicios.sort((a, b) => a.orden - b.orden).map(ex => (
              <div key={ex.orden} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xs text-muted w-4 text-center shrink-0">{ex.orden}</span>
                {ex.superset_id && (
                  <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">SS</span>
                )}
                <span className="flex-1 text-sm">{ex.nombre}</span>
                <div className="flex gap-1.5 shrink-0">
                  {ex.series && (
                    <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full font-medium">
                      {ex.series} {ex.series === 1 ? 'serie' : 'series'}
                    </span>
                  )}
                  {ex.reps && (
                    <span className="text-xs text-muted bg-surface2 px-2 py-0.5 rounded-full">{ex.reps}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end px-4 py-3 border-t border-border">
            <button onClick={e => { e.stopPropagation(); onSelect(routine); }}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-semibold text-sm py-2 px-5 rounded-xl transition-colors">
              Iniciar rutina <ChevronRight size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Modal crear rutina (3 pasos) ─────────────────────────────────────────────

const EMPTY_EX = { nombre: '', series: '', reps: '' };

function CreateRoutineModal({ onClose, onCreate, library }) {
  const [step,      setStep]     = useState(1);
  const [data,      setData]     = useState({ tipo: '', titulo: '', descripcion: '', ejercicios: [] });
  const [addingEx,  setAddingEx] = useState(false);
  const [showLib,   setShowLib]  = useState(false);
  const [newEx,     setNewEx]    = useState(EMPTY_EX);

  const canNext2 = data.titulo.trim().length > 0;

  // Seleccionar tipo → avanza automáticamente al paso 2
  const handleSelectTipo = (tipo) => {
    setData(d => ({ ...d, tipo }));
    setTimeout(() => setStep(2), 180); // pequeño delay para que se vea el color seleccionado
  };

  const addExercise = (nombre) => {
    const ex = nombre ? { ...EMPTY_EX, nombre } : newEx;
    if (!ex.nombre.trim()) return;
    const orden = data.ejercicios.length + 1;
    setData(d => ({
      ...d,
      ejercicios: [...d.ejercicios, { nombre: ex.nombre, series: ex.series || '', reps: ex.reps || '', orden, es_timer: false, video_url: null, nota: null }]
    }));
    setNewEx(EMPTY_EX);
    setAddingEx(false);
    setShowLib(false);
  };

  const removeExercise = (orden) =>
    setData(d => ({ ...d, ejercicios: d.ejercicios.filter(e => e.orden !== orden) }));

  const handleCreate = () => {
    onCreate({ ...data });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface w-full sm:w-[480px] rounded-t-3xl sm:rounded-lg border-t sm:border border-border flex flex-col max-h-[90vh]">

        {/* ── Header modal ── */}
        {!showLib && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div>
              <p className="text-xs text-muted">Paso {step} de 3</p>
              <h2 className="font-bold text-lg">Nueva rutina</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1,2,3].map(s => (
                  <div key={s} className={clsx("h-1.5 w-8 rounded-full transition-colors", s <= step ? "bg-primary" : "bg-surface2")} />
                ))}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface2 text-muted ml-1">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Contenido ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">

          {/* Librería de ejercicios (pantalla dentro del modal) */}
          {showLib && (
            <ExerciseLibraryPicker
              library={library}
              onSelect={(nombre) => addExercise(nombre)}
              onClose={() => setShowLib(false)}
            />
          )}

          {/* Pasos normales */}
          {!showLib && (
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* Paso 1 — Tipo */}
              {step === 1 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted mb-4">¿Qué tipo de rutina quieres crear?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ROUTINE_TYPES).map(([key, { label, badge, icon }]) => (
                      <button key={key} onClick={() => handleSelectTipo(key)}
                        className={clsx(
                          "flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm border-2 transition-all",
                          data.tipo === key
                            ? `${badge} text-white border-transparent scale-[0.98]`
                            : "bg-surface2 text-text border-transparent hover:border-primary/30"
                        )}>
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Paso 2 — Nombre + descripción */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted font-medium block mb-1.5">Nombre *</label>
                    <input autoFocus type="text" value={data.titulo}
                      onChange={e => setData(d => ({ ...d, titulo: e.target.value }))}
                      placeholder="Ej: Fuerza Día 5"
                      className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted font-medium block mb-1.5">Descripción <span className="opacity-50">opcional</span></label>
                    <textarea value={data.descripcion}
                      onChange={e => setData(d => ({ ...d, descripcion: e.target.value }))}
                      placeholder="Ej: 4 series de cada ejercicio. Descansos 30-60s."
                      rows={3}
                      className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}

              {/* Paso 3 — Ejercicios */}
              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-xs text-muted">Opcional — puedes añadir ejercicios ahora o editarlos más tarde.</p>

                  {data.ejercicios.length > 0 && (
                    <div className="space-y-1.5">
                      {data.ejercicios.map(ex => (
                        <div key={ex.orden} className="flex items-center gap-2 bg-surface2 px-3 py-2 rounded-lg">
                          <span className="text-xs text-muted w-4 text-center">{ex.orden}</span>
                          <span className="flex-1 text-sm font-medium">{ex.nombre}</span>
                          <div className="flex gap-1">
                            {ex.series && <span className="text-xs bg-bg px-2 py-0.5 rounded-full">{ex.series}s</span>}
                            {ex.reps && <span className="text-xs text-muted bg-bg px-2 py-0.5 rounded-full">{ex.reps}</span>}
                          </div>
                          <button onClick={() => removeExercise(ex.orden)} className="text-muted hover:text-danger transition-colors ml-1">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botones añadir */}
                  {!addingEx ? (
                    <div className="flex gap-2">
                      <button onClick={() => setShowLib(true)}
                        className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary hover:text-primary text-muted text-sm font-medium py-2.5 rounded-xl transition-colors">
                        <BookOpen size={15} />
                        Desde librería
                      </button>
                      <button onClick={() => setAddingEx(true)}
                        className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary hover:text-primary text-muted text-sm font-medium py-2.5 rounded-xl transition-colors">
                        <PlusCircle size={15} />
                        Escribir nombre
                      </button>
                    </div>
                  ) : (
                    <div className="bg-surface2 rounded-xl p-3 space-y-2.5">
                      <input autoFocus type="text" value={newEx.nombre}
                        onChange={e => setNewEx(n => ({ ...n, nombre: e.target.value }))}
                        placeholder="Nombre del ejercicio"
                        onKeyDown={e => e.key === 'Enter' && addExercise()}
                        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted block mb-1">Series</label>
                          <MinimalNumberInput value={newEx.series} onChange={e => setNewEx(n => ({ ...n, series: e.target.value }))} min={0} placeholder="0" />
                        </div>
                        <div>
                          <label className="text-xs text-muted block mb-1">Reps</label>
                          <input type="text" value={newEx.reps}
                            onChange={e => setNewEx(n => ({ ...n, reps: e.target.value }))}
                            placeholder="Ej: 10-12"
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => addExercise()} disabled={!newEx.nombre.trim()}
                          className="flex-1 bg-primary disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg">
                          Añadir
                        </button>
                        <button onClick={() => { setAddingEx(false); setNewEx(EMPTY_EX); }}
                          className="px-3 text-xs text-muted hover:text-text bg-bg rounded-lg border border-border">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!showLib && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0 gap-3">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 text-sm text-muted hover:text-text font-medium transition-colors">
                <ArrowLeft size={15} /> Atrás
              </button>
            ) : <div />}

            {step === 1 && (
              /* En paso 1 el botón "Siguiente" existe por si el usuario quiere usarlo,
                 pero el flujo principal es hacer click directo en el tipo */
              <button onClick={() => data.tipo && setStep(2)} disabled={!data.tipo}
                className="flex items-center gap-1.5 bg-surface2 disabled:opacity-30 text-muted text-xs py-2 px-4 rounded-xl">
                Siguiente <ChevronRight size={13} />
              </button>
            )}
            {step === 2 && (
              <button onClick={() => setStep(3)} disabled={!canNext2}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white font-semibold text-sm py-2.5 px-5 rounded-xl transition-colors">
                Siguiente <ChevronRight size={15} />
              </button>
            )}
            {step === 3 && (
              <button onClick={handleCreate} disabled={!canNext2}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white font-semibold text-sm py-2.5 px-5 rounded-xl transition-colors">
                Crear rutina
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

// ─── Pantalla de selección de tipo ───────────────────────────────────────────

function TypePickerScreen({ routines, onSelect, onCreateRoutine, onResetRoutines }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <p className="text-sm text-muted mb-6">¿Qué tipo de rutina quieres ver?</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {TAB_ORDER.filter(t => t !== 'ALL').map(tipo => {
          const info  = ROUTINE_TYPES[tipo];
          const count = routines.filter(r => r.tipo === tipo).length;
          return (
            <button key={tipo} onClick={() => onSelect(tipo)}
              className="group flex flex-col items-start gap-3 p-5 bg-surface border border-border rounded-lg hover:shadow-md hover:border-primary/30 transition-all text-left">
              <div className={clsx("flex items-center justify-center w-10 h-10 rounded-xl text-white", info.badge)}>
                {info.icon && <span className="scale-150">{info.icon}</span>}
              </div>
              <div>
                <p className="font-bold text-sm">{info.label}</p>
                <p className="text-xs text-muted mt-0.5">{count} {count === 1 ? 'rutina' : 'rutinas'}</p>
              </div>
            </button>
          );
        })}
        {/* Card "Todas" */}
        <button onClick={() => onSelect('ALL')}
          className="flex flex-col items-start gap-3 p-5 bg-surface border-2 border-dashed border-border rounded-lg hover:border-primary/40 hover:shadow-md transition-all text-left">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface2 text-muted">
            <Dumbbell size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">Todas</p>
            <p className="text-xs text-muted mt-0.5">{routines.length} rutinas</p>
          </div>
        </button>
      </div>

      {onCreateRoutine && (
        <div className="mt-8 flex items-center gap-5 flex-wrap">
          <button onClick={onCreateRoutine}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-semibold transition-colors">
            <PlusCircle size={16} />
            Crear nueva rutina
          </button>
          {onResetRoutines && (
            <button onClick={onResetRoutines}
              className="flex items-center gap-2 text-sm text-muted hover:text-danger font-semibold transition-colors">
              <RefreshCw size={14} />
              Restaurar rutinas por defecto
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

export function Dashboard({ routines, exerciseLibrary, onSelectRoutine, onEditRoutine, onCreateRoutine, onResetRoutines }) {
  const [activeTab,  setActiveTab]  = useState(null); // null = pantalla de selección
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [showModal,  setShowModal]  = useState(false);

  const handleSelectTab = (tipo) => {
    setActiveTab(tipo);
    setSearchTerm('');
    setExpandedId(null);
  };

  const handleBack = () => {
    setActiveTab(null);
    setSearchTerm('');
    setExpandedId(null);
  };

  const filtered = (routines || []).filter(r => {
    const matchSearch = !searchTerm || (
      r.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (activeTab === 'ALL' || r.tipo === activeTab) && matchSearch;
  });

  const handleCreate = (routineData) => {
    const id = `routine_${Date.now()}`;
    onCreateRoutine({ id, ...routineData });
  };

  const activeInfo = activeTab && activeTab !== 'ALL' ? ROUTINE_TYPES[activeTab] : null;

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          {activeTab !== null && (
            <button onClick={handleBack}
              className="p-2 rounded-full hover:bg-surface2 text-muted hover:text-text transition-colors shrink-0">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl">Rutinas</h1>
              {activeInfo && (
                <span className={clsx("text-xs text-white font-semibold px-2.5 py-0.5 rounded-full shrink-0", activeInfo.badge)}>
                  {activeInfo.label}
                </span>
              )}
              {activeTab === 'ALL' && (
                <span className="text-xs text-muted font-medium">· Todas</span>
              )}
            </div>
          </div>
          {onCreateRoutine && activeTab !== null && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs py-2 px-3.5 rounded-xl transition-colors shrink-0">
              <PlusCircle size={14} />
              Nueva
            </button>
          )}
        </div>

        {/* Buscador: solo visible en la lista */}
        {activeTab !== null && (
          <div className="relative mt-3">
            <input type="text" placeholder="Buscar rutina..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-xl py-2 pl-9 pr-4 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          </div>
        )}
      </div>

      {/* Contenido */}
      {activeTab === null ? (
        /* Pantalla de selección de tipo */
        <TypePickerScreen
          routines={routines}
          onSelect={handleSelectTab}
          onCreateRoutine={onCreateRoutine ? () => setShowModal(true) : undefined}
          onResetRoutines={onResetRoutines}
        />
      ) : (
        /* Lista filtrada */
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted gap-3">
              <Search size={36} className="opacity-20" />
              <p className="text-sm">Sin resultados{searchTerm && <> para <strong>"{searchTerm}"</strong></>}</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-3xl mx-auto">
              {filtered.map(routine => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  isExpanded={expandedId === routine.id}
                  onToggle={() => setExpandedId(prev => prev === routine.id ? null : routine.id)}
                  onSelect={onSelectRoutine}
                  onEdit={onEditRoutine}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <CreateRoutineModal onClose={() => setShowModal(false)} onCreate={handleCreate} library={exerciseLibrary || []} />
      )}
    </div>
  );
}
