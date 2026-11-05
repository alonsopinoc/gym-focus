import { useState } from 'react';
import { clsx } from 'clsx';
import {
  ChevronRight, ChevronLeft, Plus, Minus, Wand2, CheckCircle2, CalendarDays, ArrowLeft,
} from 'lucide-react';
import { ROUTINE_TYPES } from '../routineTypes';
import { addDays, dateKey, getDoneCounts, parseDateKey, programToDraft } from '../program';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const WEEKDAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const toKey = dateKey;

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

function Counter({ value, onChange, min = 0, max = 7 }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
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

function ProgramPreview({ program, startDate }) {
  const startKey = dateKey(startDate);
  const formatDay = (key) =>
    new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(parseDateKey(key));
  const weeks = Array.from({ length: program.repeticiones }, () => program.semanas).flat();

  return (
    <div className="space-y-1.5 max-h-80 overflow-y-auto">
      {weeks.map((week, index) => {
        const start = addDays(startKey, index * 7);
        const chips = Object.entries(week.plan).filter(([, count]) => count > 0);
        return (
          <div key={index} className="px-3 py-2 bg-surface2 rounded-xl">
            <p className="text-xs font-semibold">
              Semana {index + 1}
              <span className="font-normal text-muted"> · {formatDay(start)} al {formatDay(addDays(start, 6))}</span>
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {chips.length === 0 && <span className="text-[10px] text-muted">Sin sesiones</span>}
              {chips.map(([tipo, count]) => (
                <span key={tipo} className={clsx("text-[10px] font-bold text-white px-2 py-0.5 rounded-full", ROUTINE_TYPES[tipo]?.badge)}>
                  {count} {ROUTINE_TYPES[tipo]?.label}
                </span>
              ))}
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
  repeticiones: 1,
};

export function ProgramCreator({ routines, hasExisting, editingProgram, onCreate, onCancel }) {
  const isEditing = Boolean(editingProgram);
  const [step,          setStep]          = useState(1); // 1: info, 2: semanas, 3: aplicar
  const [program,       setProgram]       = useState(() => isEditing ? programToDraft(editingProgram) : DEFAULT_PROGRAM);
  const [startDate,     setStartDate]     = useState(() => {
    if (isEditing) return parseDateKey(editingProgram.startDate);
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });
  const [showConfirm,   setShowConfirm]   = useState(false);

  // Lo ya hecho no se puede quitar: fija los mínimos de cada semana y tipo.
  const doneCounts = isEditing ? getDoneCounts(editingProgram) : [];
  const minWeeks = Math.max(1, doneCounts.reduce((last, counts, index) => (Object.keys(counts).length > 0 ? index + 1 : last), 0));
  const hasProgress = doneCounts.some(counts => Object.keys(counts).length > 0);
  const maxWeeks = Math.max(12, program.semanas.length);

  const availableTypes = Object.entries(ROUTINE_TYPES).filter(([key]) => routines.some(r => r.tipo === key));
  const cycleSessions = program.semanas.reduce((acc, w) =>
    acc + Object.values(w.plan).reduce((a, b) => a + b, 0), 0
  );
  const totalSessions = cycleSessions * program.repeticiones;
  const totalWeeks = program.semanas.length * program.repeticiones;
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
    const num = Math.min(maxWeeks, Math.max(minWeeks, n));
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
      const plan = { ...semanas[weekIndex - 1].plan };
      Object.entries(doneCounts[weekIndex] || {}).forEach(([tipo, done]) => {
        plan[tipo] = Math.max(plan[tipo] || 0, done);
      });
      semanas[weekIndex] = { plan };
      return { ...p, semanas };
    });
  };

  const handleApply = () => {
    onCreate(program, startDate);
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
          {(step > 1 || onCancel) && (
            <button onClick={() => (step > 1 ? setStep(s => s - 1) : onCancel())} aria-label="Volver"
              className="p-2 rounded-full hover:bg-surface2 text-muted hover:text-text transition-colors shrink-0">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex-1">
            <h1 className="font-display text-2xl">{isEditing ? 'Modificar programa' : 'Crear Programa'}</h1>
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
                <Counter value={program.semanas.length} onChange={setNumWeeks} min={minWeeks} max={maxWeeks} />
                <span className="text-sm text-muted">{program.semanas.length} {program.semanas.length === 1 ? 'semana' : 'semanas'}</span>
              </div>
              {isEditing && minWeeks > 1 && (
                <p className="text-xs text-muted mt-2">Mínimo {minWeeks} semanas, porque ya tienes sesiones hechas hasta ahí.</p>
              )}
            </div>
            {!isEditing && <div>
              <label className="text-xs font-semibold text-muted block mb-3">Repetir estas semanas</label>
              <div className="flex items-center gap-4">
                <Counter
                  value={program.repeticiones}
                  min={1}
                  max={6}
                  onChange={repeticiones => setProgram(p => ({ ...p, repeticiones }))}
                />
                <span className="text-sm text-muted">
                  {program.repeticiones} {program.repeticiones === 1 ? 'vez' : 'veces'} · {totalWeeks} {totalWeeks === 1 ? 'semana' : 'semanas'} en total
                </span>
              </div>
            </div>}
          </div>
        )}

        {/* ── Paso 2: Planificación ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-muted">
              Define cuántas sesiones de cada tipo tendrá cada semana. Luego eliges cada día cuál hacer, incluidos los fines de semana.
              {hasProgress && ' Las sesiones ya hechas no se pueden quitar.'}
            </p>

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
                      {availableTypes.map(([key, { label, badge, icon: Icon }]) => {
                        const val = week.plan[key] || 0;
                        return (
                          <div key={key} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className={clsx("w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0", badge)}>
                                <Icon size={11} />
                              </div>
                              <span className={clsx("text-sm", val > 0 ? "font-semibold" : "text-muted")}>{label}</span>
                            </div>
                            <Counter value={val} min={doneCounts[wi]?.[key] || 0} onChange={v => handlePlanChange(wi, key, v)} />
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

            {/* Fecha de inicio */}
            <div className="bg-surface border border-border rounded-lg p-4 self-start">
              <p className="text-xs font-semibold text-muted mb-3 border-l-2 border-primary pl-2">Fecha de inicio</p>
              {hasProgress ? (
                <>
                  <p className="text-sm font-semibold">
                    {new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(startDate)}
                  </p>
                  <p className="text-xs text-muted mt-2">No se puede cambiar porque ya tienes sesiones hechas.</p>
                </>
              ) : (
                <>
                  <MiniCalendar value={startDate} onChange={setStartDate} />
                  <p className="text-xs text-muted mt-3">Cada semana del programa dura 7 días desde esta fecha.</p>
                </>
              )}
            </div>

            {/* Preview */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted border-l-2 border-primary pl-2">Vista previa</p>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {totalSessions} sesiones
                </span>
              </div>
              <ProgramPreview program={program} startDate={startDate} />
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
            {isEditing ? 'Guardar cambios' : 'Crear programa'}
          </button>
        )}
      </div>

      {/* ── Modal confirmación ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center sm:p-4"
          onClick={e => e.target === e.currentTarget && setShowConfirm(false)}>
          <div className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-lg border-t sm:border border-border p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl shrink-0">
                <CalendarDays size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base">{isEditing ? 'Guardar cambios' : 'Crear programa'}</h3>
                <p className="text-sm text-muted mt-1">
                  <strong className="text-text">"{program.titulo}"</strong> — {totalSessions} sesiones en {totalWeeks} {totalWeeks === 1 ? 'semana' : 'semanas'} a partir del{' '}
                  <strong className="text-text">
                    {new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(startDate)}
                  </strong>.
                </p>
                {isEditing && (
                  <p className="text-xs text-muted mt-2">Se conservan las sesiones hechas y las rutinas que ya elegiste. Si bajas una cantidad, se quitan sesiones pendientes de ese tipo.</p>
                )}
                {!isEditing && hasExisting && (
                  <p className="text-xs text-danger mt-2">Reemplazará tu programa actual y se perderá su avance. Tu calendario no cambia.</p>
                )}
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
