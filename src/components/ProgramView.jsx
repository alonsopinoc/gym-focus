import { useState } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Pencil, Play, RotateCcw, Trash2, Zap } from 'lucide-react';
import { ProgramCreator } from './ProgramCreator';
import { ROUTINE_TYPES } from '../routineTypes';
import {
  countDone, dateKey, getCurrentWeekIndex, getProgramStatus, getProgress, getWeekRange, parseDateKey,
} from '../program';

const formatDay = (key, options = { day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat('es-ES', options).format(parseDateKey(key));

function RoutineDetails({ routine }) {
  const exercises = (routine.ejercicios || []).slice().sort((a, b) => a.orden - b.orden);

  return (
    <div className="px-4 pb-4">
      <div className="bg-surface2 rounded-lg overflow-hidden">
        {routine.descripcion && (
          <p className="px-3 py-2.5 text-xs text-muted border-b border-border">{routine.descripcion}</p>
        )}
        {exercises.length === 0 ? (
          <p className="px-3 py-2.5 text-xs text-muted">Esta rutina no tiene ejercicios.</p>
        ) : (
          <div className="divide-y divide-border">
            {exercises.map((exercise) => (
              <div key={exercise.orden} className="px-3 py-2.5 flex items-start gap-3">
                <span className="text-xs text-muted w-4 text-center shrink-0 mt-0.5">{exercise.orden}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                    {exercise.nombre}
                    {exercise.es_extra && (
                      <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">EXTRA</span>
                    )}
                    {exercise.superset_id && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-accent">
                        <Zap size={10} /> Superset
                      </span>
                    )}
                  </p>
                  {exercise.nota && <p className="text-xs text-muted mt-0.5">{exercise.nota}</p>}
                </div>
                <div className="flex flex-wrap justify-end gap-1 shrink-0 max-w-[45%]">
                  {exercise.series && (
                    <span className="text-xs bg-surface px-2 py-0.5 rounded-full font-medium">
                      {exercise.series} {exercise.series === 1 ? 'serie' : 'series'}
                    </span>
                  )}
                  {exercise.reps && (
                    <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-full">{exercise.reps}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionRow({ session, routines, canAct, weekIsPast, onStart, onSelectRoutine, onMarkDone, onUndo }) {
  const [showDetails, setShowDetails] = useState(false);
  const type = ROUTINE_TYPES[session.tipo];
  const Icon = type?.icon;
  const options = routines.filter((routine) => routine.tipo === session.tipo);
  const routine = routines.find((item) => item.id === session.routineId);
  const isDone = Boolean(session.doneOn);

  return (
    <div className={clsx(isDone && 'bg-primary/5')}>
    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0', isDone ? 'bg-primary' : type?.badge || 'bg-surface2')}>
          {isDone ? <CheckCircle2 size={17} /> : Icon && <Icon size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted">{type?.label || session.tipo}</p>
          {canAct && !isDone && options.length > 0 ? (
            <select
              aria-label={`Rutina de ${type?.label || session.tipo}`}
              value={session.routineId || ''}
              onChange={(event) => onSelectRoutine(session.id, event.target.value)}
              className="mt-1 w-full max-w-sm bg-surface2 border border-border rounded-lg px-2 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40">
              {options.map((option) => (
                <option key={option.id} value={option.id}>{option.titulo}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm font-semibold truncate">{routine?.titulo || 'Rutina no disponible'}</p>
          )}
          {isDone && (
            <p className="text-xs text-primary font-medium mt-0.5">
              Hecha el {formatDay(session.doneOn, { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          )}
          {!isDone && weekIsPast && <p className="text-xs text-muted mt-0.5">No hecha</p>}
          {routine && (
            <button
              onClick={() => setShowDetails((visible) => !visible)}
              aria-expanded={showDetails}
              className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors">
              {showDetails ? 'Ocultar ejercicios' : `Ver ejercicios (${routine.ejercicios?.length ?? 0})`}
              <ChevronDown size={13} className={clsx('transition-transform', showDetails && 'rotate-180')} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isDone ? (
          <button onClick={() => onUndo(session.id)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text px-3 py-2 rounded-lg hover:bg-surface2 transition-colors">
            <RotateCcw size={13} /> Deshacer
          </button>
        ) : canAct && (
          <>
            <button onClick={() => onMarkDone(session.id)} disabled={!routine}
              className="text-xs font-semibold text-muted hover:text-text px-3 py-2 rounded-lg hover:bg-surface2 disabled:opacity-40 transition-colors">
              Marcar hecha
            </button>
            <button onClick={() => onStart(session.id)} disabled={!routine}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
              <Play size={14} /> Hacer hoy
            </button>
          </>
        )}
      </div>
    </div>
    {showDetails && routine && <RoutineDetails routine={routine} />}
    </div>
  );
}

export function ProgramView({ program, routines, onCreate, onUpdate, onDelete, onStartSession, onSelectRoutine, onMarkDone, onUndo }) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);

  if (program && isEditing) {
    return (
      <ProgramCreator
        key={program.id}
        routines={routines}
        editingProgram={program}
        onCancel={() => setIsEditing(false)}
        onCreate={(draft, startDate) => {
          onUpdate(draft, startDate);
          setIsEditing(false);
          setSelectedWeek(null);
        }}
      />
    );
  }

  if (!program || isCreating) {
    return (
      <ProgramCreator
        routines={routines}
        hasExisting={Boolean(program)}
        onCancel={program ? () => setIsCreating(false) : undefined}
        onCreate={(draft, startDate) => {
          onCreate(draft, startDate);
          setIsCreating(false);
          setSelectedWeek(null);
        }}
      />
    );
  }

  const today = dateKey();
  const status = getProgramStatus(program, today);
  const currentWeek = getCurrentWeekIndex(program, today);
  const lastWeek = program.weeks.length - 1;
  const weekIndex = selectedWeek ?? Math.min(Math.max(currentWeek, 0), lastWeek);
  const week = program.weeks[weekIndex];
  const range = getWeekRange(program, weekIndex);
  const isCurrentWeek = status === 'active' && weekIndex === currentWeek;
  const weekIsPast = weekIndex < currentWeek;
  const progress = getProgress(program);
  const progressPct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar "${program.titulo}"? Se perderá el avance del programa. Tu calendario no cambia.`)) {
      setSelectedWeek(null);
      onDelete();
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-6 space-y-4">

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Programa</p>
            <h1 className="font-display text-3xl mt-0.5 break-words">{program.titulo}</h1>
            {program.descripcion && <p className="text-sm text-muted mt-1">{program.descripcion}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors">
              <Pencil size={14} /> Modificar
            </button>
            <Link to="/planificacion/calendario"
              className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text p-2 rounded-lg hover:bg-surface2 transition-colors">
              <CalendarDays size={15} /> Calendario
            </Link>
          </div>
        </div>

        {status === 'upcoming' && (
          <p className="text-sm bg-primary/10 text-primary font-semibold rounded-lg px-4 py-3">
            Empieza el {formatDay(program.startDate, { weekday: 'long', day: 'numeric', month: 'long' })}.
          </p>
        )}
        {status === 'finished' && (
          <p className="text-sm bg-primary/10 text-primary font-semibold rounded-lg px-4 py-3">
            Programa terminado: hiciste {progress.done} de {progress.total} sesiones.
          </p>
        )}

        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-muted">Avance total</span>
            <span>{progress.done} de {progress.total} sesiones</span>
          </div>
          <div className="h-2 rounded-full bg-surface2 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-2 py-2 border-b border-border bg-surface2">
            <button onClick={() => setSelectedWeek(weekIndex - 1)} disabled={weekIndex === 0} aria-label="Semana anterior"
              className="p-2 rounded-full hover:bg-surface text-muted disabled:opacity-30 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center min-w-0">
              <p className="font-bold text-sm">
                Semana {weekIndex + 1} de {program.weeks.length}{isCurrentWeek && ' · esta semana'}
              </p>
              <p className="text-xs text-muted">
                {formatDay(range.start)} al {formatDay(range.end)} · {countDone(week.sessions)} de {week.sessions.length} hechas
              </p>
            </div>
            <button onClick={() => setSelectedWeek(weekIndex + 1)} disabled={weekIndex === lastWeek} aria-label="Semana siguiente"
              className="p-2 rounded-full hover:bg-surface text-muted disabled:opacity-30 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {week.sessions.length > 0 ? (
            <div className="divide-y divide-border">
              {week.sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  routines={routines}
                  canAct={isCurrentWeek}
                  weekIsPast={weekIsPast}
                  onStart={onStartSession}
                  onSelectRoutine={onSelectRoutine}
                  onMarkDone={onMarkDone}
                  onUndo={onUndo}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted">
              <ClipboardList size={20} className="mx-auto mb-2 opacity-60" />
              Semana sin sesiones.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button onClick={handleDelete}
            className="flex items-center gap-1.5 text-xs font-semibold text-danger hover:bg-danger/10 px-3 py-2 rounded-lg transition-colors">
            <Trash2 size={13} /> Eliminar programa
          </button>
          <button onClick={() => setIsCreating(true)}
            className="text-xs font-semibold text-muted hover:text-text px-3 py-2 rounded-lg hover:bg-surface2 transition-colors">
            Crear otro programa
          </button>
        </div>
      </div>
    </div>
  );
}
