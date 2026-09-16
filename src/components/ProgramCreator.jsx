import { useState } from 'react';
import { clsx } from 'clsx';
import {
  Dumbbell, Zap, HeartPulse, Star, Repeat, ChevronRight, ChevronLeft,
  Plus, Minus, Wand2, X, CheckCircle2, CalendarDays, ArrowLeft,
  Weight, Target,
} from 'lucide-react';

// ─── Constantes ───────────────────────────────────────────────────────────────

const ROUTINE_TYPES = {
  F:        { label: 'Fuerza',      badge: 'bg-blue-500',    border: 'border-blue-500',    icon: Dumbbell   },
  F_BASICOS:{ label: 'Básicos F',   badge: 'bg-sky-400',     border: 'border-sky-400',     icon: Star       },
  HIBRIDA:  { label: 'Híbrido',     badge: 'bg-purple-500',  border: 'border-purple-500',  icon: Repeat     },
  M:        { label: 'Metabólico',  badge: 'bg-red-500',     border: 'border-red-500',     icon: Zap        },
  AM:       { label: 'Activación',  badge: 'bg-emerald-500', border: 'border-emerald-500', icon: HeartPulse },
  RM:       { label: 'Resistencia', badge: 'bg-orange-500',  border: 'border-orange-500',  icon: HeartPulse },
  K:        { label: 'Kettlebell',  badge: 'bg-amber-500',   border: 'border-amber-500',   icon: Weight     },
  B:        { label: 'Básico',      badge: 'bg-teal-500',    border: 'border-teal-500',    icon: Target     },
};

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const WEEKDAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const START_DAYS = [
  { value: 1, label: 'Lunes'     },
  { value: 2, label: 'Martes'    },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves'    },
  { value: 5, label: 'Viernes'   },
];

function toKey(d) { return d.toISOString().split('T')[0]; }

// ─── Mini calendario (sin librería) ──────────────────────────────────────────

function MiniCalendar({ value, onChange }) {
  const [year,  setYear]  = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());

  const first  = new Date(year, month, 1).getDay();
  const offset = first === 0 ? 6 : first - 1;
  const total  = new Date(year, month + 1, 0).getDate();
  const cells  = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));

  const prevMonth = () => month === 0  ? (setYear(y=>y-1), setMonth(11)) : setMonth(m=>m-1);
  const nextMonth = () => month === 11 ? (setYear(y=>y+1), setMonth(0))  : setMonth(m=>m+1);
  const todayKey  = toKey(new Date());

  return (
    <div className="select-none">
      {/* Nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-surface2 text-muted">
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-bold">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-surface2 text-muted">
          <ChevronRight size={15} />
        </button>
      </div>
      {/* Días */}
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-muted py-1">{d}</div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key     = toKey(date);
          const isToday = key === todayKey;
          const isSel   = key === toKey(value);
          const isPast  = date < new Date(new Date().setHours(0,0,0,0));
          return (
            <button key={key} onClick={() => !isPast && onChange(date)}
              disabled={isPast}
              className={clsx(
                "aspect-square rounded-lg text-xs font-semibold transition-all",
                isPast  && "text-muted/30 cursor-default",
                !isPast && !isSel && "hover:bg-surface2",
                isToday && !isSel && "ring-1 ring-primary text-primary",
                isSel   && "bg-primary text-white",
              )}>
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stepper de cantidad ──────────────────────────────────────────────────────

function Counter({ value, onChange, max = 7 }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted hover:border-primary hover:text-primary disabled:opacity-30 transition-all">
        <Minus size={12} />
      </button>
      <span className="w-5 text-center font-bold text-sm">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted hover:border-primary hover:text-primary disabled:opacity-30 transition-all">
        <Plus size={12} />
      </button>
    </div>
  );
}

// ─── Vista previa del programa ────────────────────────────────────────────────

function ProgramPreview({ program, startDate, startDayOfWeek }) {
  // Reconstruye las fechas que se agendarían
  const entries = [];
  let current = new Date(startDate);

  program.semanas.forEach((weekData, wi) => {
    while (current.getDay() !== startDayOfWeek) current.setDate(current.getDate() + 1);
    const queue = [];
    Object.entries(weekData.plan).forEach(([type, count]) => {
      for (let i = 0; i < count; i++) queue.push(type);
    });
    queue.forEach(tipo => {
      while (current.getDay() === 0 || current.getDay() === 6)
        current.setDate(current.getDate() + 1);
      entries.push({ date: new Date(current), tipo, week: wi + 1 });
      current.setDate(current.getDate() + 1);
    });
  });

  if (entries.length === 0) {
    return <p className="text-sm text-muted text-center py-6">Sin sesiones configuradas.</p>;
  }

  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto">
      {entries.map((e, i) => {
        const type = ROUTINE_TYPES[e.tipo];
        const Icon = type?.icon;
        return (
          <div key={i} className="flex items-center gap-3 px-3 py-2 bg-surface2 rounded-xl">
            {Icon && (
              <div className={clsx("w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0", type.badge)}>
                <Icon size={13} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">
                {new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).format(e.date)}
              </p>
              <p className="text-[10px] text-muted">Semana {e.week} · {type?.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const DEFAULT_PROGRAM = {
  titulo: '',
  descripcion: '',
  semanas: [{ plan: {} }, { plan: {} }, { plan: {} }, { plan: {} }],
};

export function ProgramCreator({ onApplyProgram }) {
  const [step,          setStep]          = useState(1); // 1: info, 2: semanas, 3: aplicar
  const [program,       setProgram]       = useState(DEFAULT_PROGRAM);
  const [startDate,     setStartDate]     = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });
  const [startDay,      setStartDay]      = useState(1);
  const [showConfirm,   setShowConfirm]   = useState(false);

  const totalSessions = program.semanas.reduce((acc, w) =>
    acc + Object.values(w.plan).reduce((a, b) => a + b, 0), 0
  );
  const canNext1 = program.titulo.trim().length > 0;
  const canNext2 = totalSessions > 0;

  const handlePlanChange = (weekIndex, typeKey, val) => {
    setProgram(p => {
      const semanas = [...p.semanas];
      semanas[weekIndex] = { ...semanas[weekIndex], plan: { ...semanas[weekIndex].plan, [typeKey]: val } };
      return { ...p, semanas };
    });
  };

  const setNumWeeks = (n) => {
    const num = Math.min(12, Math.max(1, n));
    setProgram(p => ({
      ...p,
      semanas: Array.from({ length: num }, (_, i) => p.semanas[i] || { plan: {} }),
    }));
  };

  // Copia el plan de la semana anterior
  const copyPrevWeek = (weekIndex) => {
    if (weekIndex === 0) return;
    setProgram(p => {
      const semanas = [...p.semanas];
      semanas[weekIndex] = { plan: { ...semanas[weekIndex - 1].plan } };
      return { ...p, semanas };
    });
  };

  const handleApply = () => {
    onApplyProgram(program, startDate, startDay);
    setShowConfirm(false);
    setStep(1);
    setProgram(DEFAULT_PROGRAM);
  };

  // Sesiones por semana
  const weekTotal = (week) => Object.values(week.plan).reduce((a, b) => a + b, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="p-2 rounded-full hover:bg-surface2 text-muted hover:text-text transition-colors shrink-0">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex-1">
            <h1 className="font-display text-2xl">Crear Programa</h1>
            <p className="text-xs text-muted mt-0.5">
              {step === 1 && 'Paso 1 de 3 — Información básica'}
              {step === 2 && 'Paso 2 de 3 — Planificación semanal'}
              {step === 3 && 'Paso 3 de 3 — Fecha de inicio'}
            </p>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5 shrink-0">
            {[1,2,3].map(s => (
              <div key={s} className={clsx(
                "h-1.5 rounded-full transition-all",
                s === step ? "w-6 bg-primary" : s < step ? "w-3 bg-primary/40" : "w-3 bg-surface2"
              )} />
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">

        {/* ── Paso 1: Info ── */}
        {step === 1 && (
          <div className="max-w-lg bg-surface border border-border rounded-lg p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted block mb-1.5">Nombre del programa *</label>
              <input
                autoFocus
                type="text"
                value={program.titulo}
                onChange={e => setProgram(p => ({ ...p, titulo: e.target.value }))}
                placeholder="Ej: Programa 4 semanas fuerza"
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1.5">
                Descripción <span className="opacity-50 font-normal">opcional</span>
              </label>
              <textarea
                value={program.descripcion}
                onChange={e => setProgram(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Ej: Programa progresivo de fuerza con énfasis en piernas..."
                rows={3}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-3">Número de semanas</label>
              <div className="flex items-center gap-4">
                <Counter value={program.semanas.length} onChange={setNumWeeks} max={12} />
                <span className="text-sm text-muted">{program.semanas.length} {program.semanas.length === 1 ? 'semana' : 'semanas'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Paso 2: Planificación ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-muted">Define cuántas sesiones de cada tipo tendrá cada semana. Puedes copiar el plan de la semana anterior.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {program.semanas.map((week, wi) => {
                const total = weekTotal(week);
                return (
                  <div key={wi} className="bg-surface border border-border rounded-lg overflow-hidden">
                    {/* Header semana */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">Semana {wi + 1}</span>
                        {total > 0 && (
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            {total} sesiones
                          </span>
                        )}
                      </div>
                      {wi > 0 && (
                        <button onClick={() => copyPrevWeek(wi)}
                          className="text-[10px] font-semibold text-muted hover:text-primary transition-colors">
                          Copiar semana anterior
                        </button>
                      )}
                    </div>

                    {/* Tipos */}
                    <div className="divide-y divide-border">
                      {Object.entries(ROUTINE_TYPES).map(([key, { label, badge, icon: Icon }]) => {
                        const val = week.plan[key] || 0;
                        return (
                          <div key={key} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className={clsx("w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0", badge)}>
                                <Icon size={11} />
                              </div>
                              <span className={clsx("text-sm", val > 0 ? "font-semibold" : "text-muted")}>{label}</span>
                            </div>
                            <Counter value={val} onChange={v => handlePlanChange(wi, key, v)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Paso 3: Fecha + preview ── */}
        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">

            {/* Fecha y día de inicio */}
            <div className="space-y-5">
              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-xs font-semibold text-muted mb-3 border-l-2 border-primary pl-2">Fecha de inicio</p>
                <MiniCalendar value={startDate} onChange={setStartDate} />
              </div>

              <div className="bg-surface border border-border rounded-lg p-4">
                <p className="text-xs font-semibold text-muted mb-3 border-l-2 border-primary pl-2">Empezar los entrenamientos en</p>
                <div className="grid grid-cols-5 gap-1">
                  {START_DAYS.map(({ value, label }) => (
                    <button key={value} onClick={() => setStartDay(value)}
                      className={clsx(
                        "py-2 rounded-xl text-xs font-semibold transition-all",
                        startDay === value ? "bg-primary text-white" : "bg-surface2 text-muted hover:text-text"
                      )}>
                      {label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted border-l-2 border-primary pl-2">Vista previa</p>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {totalSessions} sesiones
                </span>
              </div>
              <ProgramPreview program={program} startDate={startDate} startDayOfWeek={startDay} />
            </div>
          </div>
        )}
      </div>

      {/* Footer navegación */}
      <div className="shrink-0 px-4 md:px-6 py-4 border-t border-border flex items-center justify-between gap-3">
        {step > 1 ? (
          <button onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-text font-medium transition-colors">
            <ChevronLeft size={15} /> Atrás
          </button>
        ) : <div />}

        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 ? !canNext1 : !canNext2}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white font-semibold text-sm py-2.5 px-6 rounded-xl transition-colors">
            Siguiente <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm py-2.5 px-6 rounded-xl transition-colors">
            <Wand2 size={15} />
            Aplicar al calendario
          </button>
        )}
      </div>

      {/* ── Modal confirmación ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowConfirm(false)}>
          <div className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-lg border-t sm:border border-border p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl shrink-0">
                <CalendarDays size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base">Aplicar programa</h3>
                <p className="text-sm text-muted mt-1">
                  <strong className="text-text">"{program.titulo}"</strong> — {totalSessions} sesiones a partir del{' '}
                  <strong className="text-text">
                    {new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(startDate)}
                  </strong>.
                </p>
                <p className="text-xs text-muted mt-2">Las rutinas existentes en esas fechas serán sobreescritas.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-surface2 text-muted hover:text-text border border-border transition-colors">
                Cancelar
              </button>
              <button onClick={handleApply}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-primary hover:bg-primary-hover text-white transition-colors flex items-center justify-center gap-2">
                <CheckCircle2 size={15} />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
