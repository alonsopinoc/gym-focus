import { useState } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  ChevronLeft, ChevronRight, ChevronDown, X, ArrowLeft, Trash2, Replace,
  CheckCircle2, CalendarX2, Dumbbell, Zap, HeartPulse, Star, Repeat,
} from 'lucide-react';

// ─── Constantes ──────────────────────────────────────────────────────────────

const ROUTINE_TYPES = {
  F:        { label: 'Fuerza',      dot: 'bg-blue-500',   badge: 'bg-blue-500',   icon: <Dumbbell size={13} /> },
  F_BASICOS:{ label: 'Básicos',     dot: 'bg-sky-400',    badge: 'bg-sky-400',    icon: <Star size={13} /> },
  HIBRIDA:  { label: 'Híbrido',     dot: 'bg-purple-500', badge: 'bg-purple-500', icon: <Repeat size={13} /> },
  M:        { label: 'Metabólico',  dot: 'bg-red-500',    badge: 'bg-red-500',    icon: <Zap size={13} /> },
  AM:       { label: 'Activación',  dot: 'bg-emerald-500',badge: 'bg-emerald-500',icon: <HeartPulse size={13} /> },
  RM:       { label: 'Resistencia', dot: 'bg-orange-500', badge: 'bg-orange-500', icon: <HeartPulse size={13} /> },
};

const WEEKDAYS_FULL = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAYS_MIN  = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toKey(date) {
  return date.toISOString().split('T')[0];
}

function buildGrid(year, month) {
  const first = new Date(year, month, 1).getDay();
  const offset = first === 0 ? 6 : first - 1; // Monday-first
  const total  = new Date(year, month + 1, 0).getDate();
  const prev   = new Date(year, month, 0).getDate();
  const cells  = [];

  for (let i = offset - 1; i >= 0; i--)
    cells.push({ day: prev - i, current: false, date: new Date(year, month - 1, prev - i) });
  for (let d = 1; d <= total; d++)
    cells.push({ day: d, current: true,  date: new Date(year, month, d) });
  let nd = 1;
  while (cells.length < 42)
    cells.push({ day: nd, current: false, date: new Date(year, month + 1, nd++) });

  return cells;
}

// ─── Panel de próximos entrenamientos ────────────────────────────────────────

function UpcomingPanel({ routines, scheduledRoutines }) {
  const items = [];
  const today = new Date();

  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = toKey(d);
    const routine = routines.find(r => r.id === scheduledRoutines[key]);
    if (!routine) continue;
    const label =
      i === 0 ? 'Hoy'
      : i === 1 ? 'Mañana'
      : new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric' }).format(d);
    items.push({ label, routine, key });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 gap-3 text-muted flex-1">
        <CalendarX2 size={36} className="opacity-25" />
        <p className="text-sm leading-relaxed">
          Sin rutinas agendadas<br />en los próximos días.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4 overflow-y-auto flex-1">
      {items.map(({ label, routine, key }) => {
        const type = ROUTINE_TYPES[routine.tipo];
        return (
          <Link
            key={key}
            to={`/rutina/${routine.id}`}
            className="block bg-surface2 hover:bg-surface2/60 rounded-xl px-4 py-3 transition-colors"
          >
            <p className="text-xs font-semibold text-primary capitalize mb-0.5">{label}</p>
            <p className="font-semibold text-sm leading-snug">{routine.titulo}</p>
            {type && (
              <div className={clsx('inline-flex items-center gap-1 text-[11px] text-white font-medium px-2 py-0.5 rounded-full mt-1.5', type.badge)}>
                {type.icon}
                {type.label}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Item de rutina con desplegable de ejercicios (paso "elegir rutina") ──────

function RoutinePickItem({ routine, onSelect, expanded, onToggleExpand }) {
  const hasEjercicios = routine.ejercicios?.length > 0;

  return (
    <div className={clsx(
      'border rounded-xl overflow-hidden transition-colors',
      expanded ? 'border-primary/50 bg-primary/5' : 'border-border'
    )}>
      <div className="flex items-center">
        <button onClick={() => onSelect(routine.id)} className="flex-1 min-w-0 text-left px-4 py-3.5">
          <p className="font-semibold text-sm">{routine.titulo}</p>
          {routine.descripcion && <p className="text-xs text-muted mt-1 line-clamp-2">{routine.descripcion}</p>}
        </button>
        {hasEjercicios && (
          <button
            onClick={onToggleExpand}
            aria-label="Ver ejercicios"
            className={clsx(
              'p-2 mr-2 rounded-full transition-colors shrink-0',
              expanded ? 'text-primary bg-primary/10' : 'text-muted hover:text-text hover:bg-surface2'
            )}
          >
            <ChevronDown size={17} className={clsx('transition-transform duration-200', expanded && 'rotate-180')} />
          </button>
        )}
      </div>

      {expanded && hasEjercicios && (
        <div className="border-t border-primary/30 divide-y divide-border">
          {routine.ejercicios.slice().sort((a, b) => a.orden - b.orden).map(ex => (
            <div key={ex.orden} className="flex items-center gap-3 px-4 py-2">
              <span className="text-xs text-muted w-4 text-center shrink-0">{ex.orden}</span>
              <span className="flex-1 text-sm truncate">{ex.nombre}</span>
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
      )}
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export function CalendarView({ routines, scheduledRoutines, onScheduleRoutine, onDeleteRoutine, completedDays, onToggleDayCompletion }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [modalView,    setModalView]    = useState('types'); // 'types' | 'routines' | 'details'
  const [selectedType, setSelectedType] = useState(null);
  const [expandedRoutineId, setExpandedRoutineId] = useState(null);

  const grid    = buildGrid(viewYear, viewMonth);
  const todayKey = toKey(today);

  const prevMonth = () => viewMonth === 0  ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0),  setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setSelectedType(null);
    setExpandedRoutineId(null);
    setModalView(scheduledRoutines[toKey(date)] ? 'details' : 'types');
    setIsModalOpen(true);
  };

  const handleRoutineSelect = (id) => { onScheduleRoutine(selectedDate, id); setIsModalOpen(false); };
  const handleDelete        = ()  => { onDeleteRoutine(selectedDate);         setIsModalOpen(false); };
  const handleToggle        = ()  => { onToggleDayCompletion(selectedDate);   setIsModalOpen(false); };

  const selKey     = toKey(selectedDate);
  const selDetails = routines.find(r => r.id === scheduledRoutines[selKey]);
  const selType    = selDetails ? ROUTINE_TYPES[selDetails.tipo] : null;
  const isDone     = !!completedDays[selKey];
  const typeRoutines = selectedType ? routines.filter(r => r.tipo === selectedType) : [];

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_300px] h-full min-h-0">

      {/* ── Columna calendario ─────────────────────────────── */}
      <div className="flex flex-col p-4 md:p-6 min-h-0 overflow-y-auto">

        {/* Navegación */}
        <div className="flex items-center gap-1 mb-5">
          <button
            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary text-muted transition-colors mr-1"
          >
            Hoy
          </button>
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-surface2 text-muted hover:text-text transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="font-display text-2xl w-56 text-center select-none capitalize whitespace-nowrap shrink-0">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-surface2 text-muted hover:text-text transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Cabecera días de la semana */}
        <div className="grid grid-cols-7 mb-1 border-b border-border pb-2">
          {WEEKDAYS_MIN.map((d, i) => (
            <div key={d} className="text-center text-xs font-semibold text-muted sm:hidden">{d}</div>
          ))}
          {WEEKDAYS_FULL.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted hidden sm:block">{d}</div>
          ))}
        </div>

        {/* Cuadrícula */}
        <div className="grid grid-cols-7 gap-1.5 flex-1">
          {grid.map((cell, idx) => {
            const key       = toKey(cell.date);
            const isToday   = key === todayKey;
            const isSel     = key === toKey(selectedDate);
            const routine   = routines.find(r => r.id === scheduledRoutines[key]);
            const type      = routine ? ROUTINE_TYPES[routine.tipo] : null;
            const completed = !!completedDays[key];

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(cell.date)}
                className={clsx(
                  'relative flex flex-col items-stretch overflow-hidden rounded-md border transition-all min-h-[56px] sm:min-h-[72px] md:min-h-[84px]',
                  !cell.current && 'text-muted/30 bg-transparent border-transparent hover:bg-surface2/40',
                  cell.current && isSel && 'bg-primary text-white border-primary',
                  cell.current && !isSel && isToday && 'bg-surface text-text border-primary hover:border-primary/70',
                  cell.current && !isSel && !isToday && 'bg-surface text-text border-border hover:border-primary/40',
                )}
              >
                {/* Barra de color del tipo de rutina */}
                {type && !isSel && (
                  <div className={clsx('h-1 w-full flex-shrink-0', type.dot)} />
                )}

                <div className="flex-1 flex flex-col items-center justify-center gap-1 px-0.5 py-1">
                  <span className={clsx(
                    'font-display-num text-base leading-none',
                    isSel ? 'text-white' : isToday ? 'text-primary' : '',
                  )}>
                    {cell.day}
                  </span>

                  {completed ? (
                    <CheckCircle2 size={13} className={isSel ? 'text-white/80' : 'text-primary'} />
                  ) : type ? (
                    <span className={clsx(
                      'hidden md:block text-[9px] font-semibold leading-none truncate max-w-full',
                      isSel ? 'text-white/80' : 'text-muted',
                    )}>
                      {type.label}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-border">
          {Object.entries(ROUTINE_TYPES).map(([k, { label, dot }]) => (
            <div key={k} className="flex items-center gap-1.5 text-xs text-muted">
              <div className={clsx('w-2.5 h-1.5 rounded-[1px] flex-shrink-0', dot)} />
              {label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <CheckCircle2 size={11} className="text-primary flex-shrink-0" />
            Completado
          </div>
        </div>

        {/* Próximos — sólo mobile */}
        <div className="md:hidden mt-6 border-t border-border pt-4">
          <p className="text-xs font-semibold text-muted mb-3 border-l-2 border-primary pl-2">Próximos entrenamientos</p>
          <UpcomingPanel routines={routines} scheduledRoutines={scheduledRoutines} />
        </div>
      </div>

      {/* ── Panel lateral — sólo desktop ───────────────────── */}
      <div className="hidden md:flex flex-col border-l border-border overflow-hidden">
        <div className="px-4 py-4 border-b border-border">
          <p className="font-display text-lg">Próximos</p>
        </div>
        <UpcomingPanel routines={routines} scheduledRoutines={scheduledRoutines} />
      </div>

      {/* ── Modal / Bottom sheet ────────────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
          onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className={clsx(
            'bg-surface w-full sm:w-[30rem] md:w-[36rem] rounded-t-3xl sm:rounded-lg border-t sm:border border-border p-6 max-h-[85vh] flex flex-col',
            modalView !== 'details' && 'sm:h-[36rem]'
          )}>

            {/* Header modal */}
            <div className="flex items-start gap-2 mb-5 shrink-0">
              {modalView === 'routines' && (
                <button onClick={() => setModalView('types')} className="p-1.5 rounded-full hover:bg-surface2 text-muted hover:text-text mt-0.5 flex-shrink-0">
                  <ArrowLeft size={17} />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted font-medium capitalize">
                  {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <h2 className="font-display text-2xl leading-tight mt-0.5">
                  {modalView === 'details'  && 'Rutina agendada'}
                  {modalView === 'types'    && 'Agendar rutina'}
                  {modalView === 'routines' && (ROUTINE_TYPES[selectedType]?.label ?? 'Elegir rutina')}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full hover:bg-surface2 text-muted hover:text-text flex-shrink-0">
                <X size={17} />
              </button>
            </div>

            {/* Tipos */}
            {modalView === 'types' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start flex-1 overflow-y-auto">
                {Object.entries(ROUTINE_TYPES).map(([key, { label, badge, icon }]) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedType(key); setExpandedRoutineId(null); setModalView('routines'); }}
                    className="flex flex-col items-start gap-3 p-4 rounded-md border border-border hover:border-primary/40 bg-surface2/40 hover:bg-surface2 font-semibold text-sm transition-all active:scale-[0.97]"
                  >
                    <span className={clsx('flex items-center justify-center w-9 h-9 rounded-[3px] text-white shrink-0', badge)}>
                      {icon}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Rutinas */}
            {modalView === 'routines' && (
              <div className="space-y-2 flex-1 overflow-y-auto">
                {typeRoutines.length === 0 ? (
                  <p className="text-muted text-sm text-center py-8">No hay rutinas de este tipo.</p>
                ) : typeRoutines.map(r => (
                  <RoutinePickItem
                    key={r.id}
                    routine={r}
                    onSelect={handleRoutineSelect}
                    expanded={expandedRoutineId === r.id}
                    onToggleExpand={() => setExpandedRoutineId(prev => prev === r.id ? null : r.id)}
                  />
                ))}
              </div>
            )}

            {/* Detalles */}
            {modalView === 'details' && selDetails && (
              <div className="flex-1 overflow-y-auto">
                <div className={clsx('rounded-xl p-4 mb-4 border', isDone ? 'bg-primary/10 border-primary/20' : 'bg-surface2 border-border')}>
                  {selType && (
                    <div className={clsx('inline-flex items-center gap-1 text-xs text-white font-semibold px-2.5 py-1 rounded-full mb-2', selType.badge)}>
                      {selType.icon}
                      {selType.label}
                    </div>
                  )}
                  <p className="font-display text-lg">{selDetails.titulo}</p>
                  {selDetails.descripcion && <p className="text-xs text-muted mt-1">{selDetails.descripcion}</p>}
                </div>

                {selDetails.ejercicios?.length > 0 && (
                  <div className="border border-border rounded-lg mb-4 overflow-hidden">
                    <p className="text-xs font-semibold text-muted px-4 pt-3 pb-2">
                      Ejercicios <span className="text-muted/60">({selDetails.ejercicios.length})</span>
                    </p>
                    <div className="divide-y divide-border">
                      {selDetails.ejercicios.slice().sort((a, b) => a.orden - b.orden).map(ex => (
                        <div key={ex.orden} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-xs text-muted w-4 text-center shrink-0">{ex.orden}</span>
                          {ex.superset_id && (
                            <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">SS</span>
                          )}
                          <span className="flex-1 text-sm truncate">{ex.nombre}</span>
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
                  </div>
                )}

                <button
                  onClick={handleToggle}
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-sm transition-colors mb-3',
                    isDone
                      ? 'bg-surface2 hover:bg-surface2/60 text-muted'
                      : 'bg-primary hover:bg-primary-hover text-white',
                  )}
                >
                  <CheckCircle2 size={16} />
                  {isDone ? 'Marcar como incompleto' : 'Marcar día como completo'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setModalView('types')}
                    className="flex items-center justify-center gap-2 bg-info/10 hover:bg-info/15 text-info font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    <Replace size={14} /> Cambiar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-2 bg-danger/10 hover:bg-danger/15 text-danger font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
