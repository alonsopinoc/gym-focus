import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  ArrowLeft, Save, Trash2, PlusCircle, ChevronDown, ChevronUp,
  BookOpen, X, Search, GripVertical, Edit2, Check,
} from 'lucide-react';
import { MinimalNumberInput } from './MinimalNumberInput';
import { formatQuantity, MAX_REPS, parseReps, REPS_TYPES } from '../repsFormat';

const ROUTINE_TYPES = {
  F:         { label: 'Fuerza',      badge: 'bg-blue-500' },
  F_BASICOS: { label: 'Básicos F',   badge: 'bg-sky-400' },
  HIBRIDA:   { label: 'Híbrido',     badge: 'bg-purple-500' },
  M:         { label: 'Metabólico',  badge: 'bg-red-500' },
  AM:        { label: 'Activación',  badge: 'bg-emerald-500' },
  RM:        { label: 'Resistencia', badge: 'bg-orange-500' },
  K:         { label: 'Kettlebell',  badge: 'bg-amber-500' },
  B:         { label: 'Básico',      badge: 'bg-teal-500' },
};

// ─── Picker de librería ────────────────────────────────────────────────────────

function LibraryPicker({ library, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [cat, setCat]     = useState('Todas');
  const inputRef          = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const categories = ['Todas', ...Array.from(new Set((library || []).map(e => e.categoria).filter(Boolean)))];
  const filtered = (library || []).filter(e => {
    const matchCat   = cat === 'Todas' || e.categoria === cat;
    const matchQuery = !query || e.nombre.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface w-full sm:w-[460px] rounded-t-3xl sm:rounded-lg border-t sm:border border-border flex flex-col max-h-[80vh]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface2 text-muted">
            <X size={16} />
          </button>
          <span className="font-semibold text-sm flex-1">Librería de ejercicios</span>
          <span className="text-xs text-muted">{library?.length ?? 0} ejercicios</span>
        </div>
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="relative">
            <input ref={inputRef} type="text" placeholder="Buscar ejercicio..." value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-xl py-2 pl-8 pr-3 text-sm placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          </div>
        </div>
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto shrink-0">
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={clsx("shrink-0 text-xs font-medium px-2.5 py-1 rounded-full transition-all",
                cat === c ? "bg-primary text-white" : "bg-surface2 text-muted hover:text-text")}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
          {filtered.length === 0
            ? <p className="text-xs text-muted text-center py-8">Sin resultados</p>
            : filtered.map(ex => (
              <button key={ex.nombre} onClick={() => onSelect(ex.nombre)}
                className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface2 transition-colors group">
                <div>
                  <p className="text-sm font-medium">{ex.nombre}</p>
                  <p className="text-xs text-muted">{ex.categoria}</p>
                </div>
                <Check size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── Selector de repeticiones: tipo y cantidad ─────────────────────────────────

const CUSTOM_QUANTITY = '__custom__';
const REPS_FIELD = 'min-w-0 bg-surface2 border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40';

function RepsPicker({ value, onChange }) {
  const [draft, setDraft] = useState(null); // Texto de la cantidad mientras se escribe a mano
  const { type, quantity } = parseReps(value);
  const typeInfo = REPS_TYPES.find(item => item.id === type);
  const isCustomQuantity = quantity !== '' && !typeInfo.quantities?.includes(quantity);
  const quantityField = clsx(REPS_FIELD, 'flex-1 sm:flex-none sm:w-28');

  const handleTypeChange = (next) => {
    onChange(next === 'max' ? MAX_REPS : REPS_TYPES.find(item => item.id === next).initial);
  };

  const handleQuantityChange = (next) => {
    if (next === CUSTOM_QUANTITY) setDraft(quantity);
    else onChange(formatQuantity(type, next));
  };

  const commitDraft = () => {
    onChange(formatQuantity(type, draft));
    setDraft(null);
  };

  return (
    <div className="flex gap-1.5 w-full sm:w-auto">
      <select value={type} aria-label="Tipo de repeticiones"
        onChange={e => handleTypeChange(e.target.value)}
        className={clsx(REPS_FIELD, 'flex-1 sm:flex-none sm:w-32')}>
        {REPS_TYPES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>

      {type === 'max' && (
        <select disabled value="" aria-label="Cantidad" className={clsx(quantityField, 'opacity-50 cursor-not-allowed')}>
          <option value="">—</option>
        </select>
      )}

      {type !== 'max' && (draft !== null ? (
        <input autoFocus type="text" value={draft} aria-label="Cantidad"
          placeholder={type === 'reps' ? 'Ej: 12-15' : 'Ej: 90 segundos'}
          onFocus={e => e.target.select()}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={e => e.key === 'Enter' && e.target.blur()}
          className={quantityField}
        />
      ) : (
        <select value={quantity} aria-label="Cantidad"
          onChange={e => handleQuantityChange(e.target.value)}
          className={quantityField}>
          <option value="">Cantidad…</option>
          {isCustomQuantity && <option value={quantity}>{quantity}</option>}
          {typeInfo.quantities.map(item => <option key={item} value={item}>{item}</option>)}
          <option value={CUSTOM_QUANTITY}>{isCustomQuantity ? 'Editar cantidad…' : 'Escribir otra…'}</option>
        </select>
      ))}
    </div>
  );
}

// ─── Fila de ejercicio editable ────────────────────────────────────────────────

function ExerciseRow({ ex, index, total, onChange, onDelete, onMoveUp, onMoveDown, onToggleExtra }) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const nameRef = useRef(null);

  const handleNameClick = () => { setEditingName(true); setTimeout(() => nameRef.current?.select(), 0); };
  const handleNameBlur  = () => setEditingName(false);

  return (
    <div className={clsx(
      "bg-surface border border-border rounded-lg overflow-hidden transition-shadow",
      expanded ? "shadow-md" : "hover:shadow-sm"
    )}>
      {/* Fila principal */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-3">
        {/* Número + grip */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 w-6">
          <button onClick={onMoveUp} disabled={index === 0}
            className="p-0.5 text-muted hover:text-text disabled:opacity-20 transition-colors">
            <ChevronUp size={13} />
          </button>
          <span className="text-xs font-bold text-muted">{index + 1}</span>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="p-0.5 text-muted hover:text-text disabled:opacity-20 transition-colors">
            <ChevronDown size={13} />
          </button>
        </div>

        {/* Nombre */}
        <div className="flex-1 min-w-0" onClick={!editingName ? handleNameClick : undefined}>
          {editingName ? (
            <input
              ref={nameRef}
              type="text"
              value={ex.nombre}
              onChange={e => onChange('nombre', e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={e => e.key === 'Enter' && handleNameBlur()}
              className="w-full bg-surface2 border border-primary/40 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          ) : (
            <div className="flex items-center gap-1.5 cursor-pointer group">
              <p className="text-sm font-semibold truncate">{ex.nombre || 'Sin nombre'}</p>
              <Edit2 size={11} className="text-muted opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
            </div>
          )}
        </div>

        {/* Series × Reps rápido */}
        <div className="order-last w-full pl-8 lg:order-none lg:w-auto lg:pl-0 flex flex-wrap items-center gap-1.5 shrink-0">
          <span className="text-xs text-muted">Series</span>
          <div className="w-28">
            <MinimalNumberInput value={ex.series ?? ''} min={0}
              onChange={e => onChange('series', e.target.value)} />
          </div>
          <span className="hidden sm:inline text-xs text-muted">×</span>
          <RepsPicker value={ex.reps} onChange={value => onChange('reps', value)} />
        </div>

        {/* Expandir / borrar */}
        <button onClick={() => setExpanded(v => !v)}
          className="p-1.5 rounded-full text-muted hover:text-text hover:bg-surface2 transition-colors shrink-0">
          <ChevronDown size={15} className={clsx("transition-transform duration-200", expanded && "rotate-180")} />
        </button>
        <button onClick={onDelete}
          className="p-1.5 rounded-full text-muted hover:text-danger hover:bg-danger/10 transition-colors shrink-0">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          <div>
            <label className="text-xs text-muted font-medium block mb-1">Nota</label>
            <textarea value={ex.nota ?? ''} rows={2}
              onChange={e => onChange('nota', e.target.value)}
              placeholder="Ej: descanso 60s, tempos, indicaciones..."
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs text-muted font-medium block mb-1">URL Video (YouTube)</label>
            <input type="text" value={ex.video_url ?? ''}
              onChange={e => onChange('video_url', e.target.value)}
              placeholder="https://youtube.com/..."
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button onClick={onToggleExtra}
            className="text-xs font-semibold text-primary hover:underline">
            {ex.es_extra ? 'Pasar a ejercicios' : 'Pasar a extra'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Añadir ejercicio (desde la librería o escribiendo el nombre) ─────────────

function AddExerciseControls({ onOpenLibrary, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [name,   setName]   = useState('');

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name);
    setName('');
    setAdding(false);
  };

  if (!adding) {
    return (
      <div className="flex gap-2">
        <button onClick={onOpenLibrary}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary hover:text-primary text-muted text-sm font-medium py-3 rounded-lg transition-colors">
          <BookOpen size={15} /> Desde librería
        </button>
        <button onClick={() => setAdding(true)}
          className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary hover:text-primary text-muted text-sm font-medium py-3 rounded-lg transition-colors">
          <PlusCircle size={15} /> Escribir nombre
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-2.5">
      <input autoFocus type="text" value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Nombre del ejercicio"
        className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <div className="flex gap-2">
        <button onClick={submit} disabled={!name.trim()}
          className="flex-1 bg-primary disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
          Añadir
        </button>
        <button onClick={() => { setAdding(false); setName(''); }}
          className="px-4 text-sm text-muted hover:text-text bg-surface2 rounded-xl border border-border">
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Modal confirmación borrar rutina ─────────────────────────────────────────

function DeleteModal({ routineName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-sm space-y-4">
        <h3 className="font-bold text-lg">Eliminar rutina</h3>
        <p className="text-sm text-muted">
          ¿Seguro que quieres eliminar <span className="text-text font-semibold">"{routineName}"</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2 pt-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-surface2 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vista principal ───────────────────────────────────────────────────────────

export function EditRoutineView({ routine, exerciseLibrary, onSave, onCancel, onDelete }) {
  const [data,        setData]        = useState(routine);
  const [libraryTarget, setLibraryTarget] = useState(null); // 'main' | 'extra' mientras la librería está abierta
  const [showDelete,  setShowDelete]  = useState(false);
  const [hasChanges,  setHasChanges]  = useState(false);
  const [sharedSeries, setSharedSeries] = useState('');

  // Si cambia la rutina recibida, descartamos el borrador durante el render
  const [prevRoutine, setPrevRoutine] = useState(routine);
  if (routine !== prevRoutine) {
    setPrevRoutine(routine);
    setData(routine);
    setHasChanges(false);
    setSharedSeries('');
  }

  const mutate = (updater) => {
    setData(updater);
    setHasChanges(true);
  };

  // Renumera tras cada cambio, con los extras siempre después de los ejercicios
  const reorder = (exercises) =>
    [...exercises.filter(ex => !ex.es_extra), ...exercises.filter(ex => ex.es_extra)]
      .map((ex, i) => ({ ...ex, orden: i + 1 }));

  const handleExerciseChange = (order, field, value) => {
    mutate(prev => ({
      ...prev,
      ejercicios: prev.ejercicios.map(ex => ex.orden === order ? { ...ex, [field]: value } : ex),
    }));
  };

  // Mueve un ejercicio dentro de su sección; nunca cruza entre ejercicios y extras
  const handleMove = (order, delta) => {
    mutate(prev => {
      const arr = [...prev.ejercicios].sort((a, b) => a.orden - b.orden);
      const from = arr.findIndex(ex => ex.orden === order);
      const to = from + delta;
      if (!arr[to] || Boolean(arr[to].es_extra) !== Boolean(arr[from].es_extra)) return prev;
      [arr[from], arr[to]] = [arr[to], arr[from]];
      return { ...prev, ejercicios: reorder(arr) };
    });
  };

  // Los extras tienen su propia sección y conservan sus series
  const handleApplySharedSeries = () => {
    const series = Number(sharedSeries);
    if (!series) return;
    mutate(prev => ({
      ...prev,
      ejercicios: prev.ejercicios.map(ex => ex.es_extra ? ex : { ...ex, series }),
    }));
  };

  const handleToggleExtra = (order) => {
    mutate(prev => ({
      ...prev,
      ejercicios: reorder(
        [...prev.ejercicios]
          .sort((a, b) => a.orden - b.orden)
          .map(ex => {
            if (ex.orden !== order) return ex;
            const { es_extra, ...rest } = ex;
            return es_extra ? rest : { ...rest, es_extra: true };
          })
      ),
    }));
  };

  const handleDeleteExercise = (order) => {
    mutate(prev => ({
      ...prev,
      ejercicios: reorder(prev.ejercicios.filter(ex => ex.orden !== order)),
    }));
  };

  const addExercise = (nombre, asExtra) => {
    if (!nombre.trim()) return;
    mutate(prev => {
      const nextOrder = prev.ejercicios.length > 0 ? Math.max(...prev.ejercicios.map(e => e.orden)) + 1 : 1;
      const exercise = { orden: nextOrder, nombre: nombre.trim(), series: '', reps: '', nota: '', video_url: '', es_timer: false };
      return {
        ...prev,
        ejercicios: reorder([
          ...[...prev.ejercicios].sort((a, b) => a.orden - b.orden),
          asExtra ? { ...exercise, es_extra: true } : exercise,
        ]),
      };
    });
    setLibraryTarget(null);
  };

  const handleSave = () => {
    onSave(data);
  };

  if (!data) return null;

  const sorted   = [...data.ejercicios].sort((a, b) => a.orden - b.orden).filter(ex => !ex.es_extra);
  const extras   = [...data.ejercicios].sort((a, b) => a.orden - b.orden).filter(ex => ex.es_extra);
  const typeInfo = ROUTINE_TYPES[data.tipo] || { label: 'General', badge: 'bg-gray-400' };

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur px-4 md:px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onCancel}
            className="p-2 rounded-full hover:bg-surface2 text-muted hover:text-text transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-lg leading-tight">Editar rutina</h1>
              <span className={clsx("text-xs text-white font-semibold px-2.5 py-0.5 rounded-full shrink-0", typeInfo.badge)}>
                {typeInfo.label}
              </span>
            </div>
            <p className="text-xs text-muted truncate">{data.titulo}</p>
          </div>
          <button onClick={handleSave}
            className={clsx(
              "flex items-center gap-1.5 font-semibold text-sm py-2 px-4 rounded-xl transition-all shrink-0",
              hasChanges
                ? "bg-primary hover:bg-primary-hover text-white shadow-sm"
                : "bg-surface2 text-muted"
            )}>
            <Save size={15} />
            Guardar
          </button>
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

        {/* Info de la rutina */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Info de la rutina</h2>
          <div>
            <label className="text-xs text-muted font-medium block mb-1.5">Título</label>
            <input type="text" value={data.titulo ?? ''}
              onChange={e => mutate(prev => ({ ...prev, titulo: e.target.value }))}
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs text-muted font-medium block mb-1.5">Descripción <span className="opacity-50">opcional</span></label>
            <textarea value={data.descripcion ?? ''} rows={2}
              onChange={e => mutate(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Ej: 4 series. Descansos 60s."
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Ejercicios */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
              Ejercicios <span className="normal-case font-normal">({sorted.length})</span>
            </h2>
            <p className="text-xs text-muted">Toca el nombre para editar</p>
          </div>

          {sorted.length > 1 && (
            <div className="bg-surface border border-border rounded-lg px-3 py-2.5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted flex-1 min-w-[140px]">Misma cantidad de series para todos</span>
              <div className="w-28">
                <MinimalNumberInput value={sharedSeries} min={1} placeholder="-"
                  onChange={e => setSharedSeries(e.target.value)} />
              </div>
              <button onClick={handleApplySharedSeries} disabled={!Number(sharedSeries)}
                className="bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                Aplicar
              </button>
            </div>
          )}

          {sorted.length === 0 && (
            <div className="text-center py-8 text-muted text-sm">
              Sin ejercicios aún — añade uno abajo
            </div>
          )}

          {sorted.map((ex, i) => (
            <ExerciseRow
              key={ex.orden}
              ex={ex}
              index={i}
              total={sorted.length}
              onChange={(field, value) => handleExerciseChange(ex.orden, field, value)}
              onDelete={() => handleDeleteExercise(ex.orden)}
              onMoveUp={() => handleMove(ex.orden, -1)}
              onMoveDown={() => handleMove(ex.orden, 1)}
              onToggleExtra={() => handleToggleExtra(ex.orden)}
            />
          ))}
        </div>

        {/* Añadir ejercicio */}
        <AddExerciseControls
          onOpenLibrary={() => setLibraryTarget('main')}
          onAdd={(nombre) => addExercise(nombre, false)}
        />

        {/* Extra */}
        <div className="space-y-2 pt-4 border-t border-border">
          <div>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
              Extra <span className="normal-case font-normal">({extras.length})</span>
            </h2>
            <p className="text-xs text-muted mt-0.5">Opcional. Se hace al final, después de todos los ejercicios.</p>
          </div>

          {extras.map((ex, i) => (
            <ExerciseRow
              key={ex.orden}
              ex={ex}
              index={i}
              total={extras.length}
              onChange={(field, value) => handleExerciseChange(ex.orden, field, value)}
              onDelete={() => handleDeleteExercise(ex.orden)}
              onMoveUp={() => handleMove(ex.orden, -1)}
              onMoveDown={() => handleMove(ex.orden, 1)}
              onToggleExtra={() => handleToggleExtra(ex.orden)}
            />
          ))}

          <AddExerciseControls
            onOpenLibrary={() => setLibraryTarget('extra')}
            onAdd={(nombre) => addExercise(nombre, true)}
          />
        </div>

        {/* Zona de peligro */}
        <div className="pt-4 border-t border-border">
          <button onClick={() => setShowDelete(true)}
            className="w-full flex items-center justify-center gap-2 border border-red-500/30 hover:bg-red-500/10 text-red-500 font-semibold text-sm py-3 rounded-lg transition-colors">
            <Trash2 size={15} />
            Eliminar rutina
          </button>
        </div>
      </div>

      {/* Modales */}
      {libraryTarget && (
        <LibraryPicker
          library={exerciseLibrary}
          onSelect={(nombre) => addExercise(nombre, libraryTarget === 'extra')}
          onClose={() => setLibraryTarget(null)}
        />
      )}
      {showDelete && (
        <DeleteModal
          routineName={data.titulo}
          onConfirm={() => onDelete(routine.id)}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
