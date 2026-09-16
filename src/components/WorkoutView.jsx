import { ArrowLeft, CheckCircle2, Circle, Timer, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ExerciseCard } from './ExerciseCard';

const ROUTINE_TYPES = {
  F:         { label: 'Fuerza',      badge: 'bg-blue-500'   },
  F_BASICOS: { label: 'Básicos F',   badge: 'bg-sky-400'    },
  HIBRIDA:   { label: 'Híbrido',     badge: 'bg-purple-500' },
  M:         { label: 'Metabólico',  badge: 'bg-red-500'    },
  AM:        { label: 'Activación',  badge: 'bg-emerald-500'},
  RM:        { label: 'Resistencia', badge: 'bg-orange-500' },
  K:         { label: 'Kettlebell',  badge: 'bg-amber-500'  },
  B:         { label: 'Básico',      badge: 'bg-teal-500'   },
};

export function WorkoutView({ routine, onBack, completedExercises, onToggleComplete, exerciseLogs, onLogExercise }) {
  const navigate = useNavigate();
  const today    = new Date().toISOString().split('T')[0];
  const typeInfo = ROUTINE_TYPES[routine?.tipo];

  // Agrupar ejercicios por superset_id
  const processedExercises = routine.ejercicios
    .sort((a, b) => a.orden - b.orden)
    .reduce((acc, ex) => {
      if (ex.superset_id) {
        const existing = acc.find(item => item.isSuperset && item.id === ex.superset_id);
        if (existing) { existing.exercises.push(ex); }
        else { acc.push({ isSuperset: true, id: ex.superset_id, exercises: [ex], orden: ex.orden }); }
      } else {
        acc.push(ex);
      }
      return acc;
    }, [])
    .sort((a, b) => a.orden - b.orden);

  // Lista plana de todos los ejercicios para el panel lateral
  const allExercises = routine.ejercicios.sort((a, b) => a.orden - b.orden);
  const completedToday = completedExercises[today] || [];
  const completedCount = allExercises.filter(ex => completedToday.includes(`${routine.id}_ex${ex.orden}`)).length;
  const totalCount     = allExercises.length;
  const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Ejercicio con timer (si lo hay)
  const timerExercise = allExercises.find(ex => ex.es_timer && ex.timer_config);
  const handleStartTimer = () => {
    if (!timerExercise) return;
    const tc = timerExercise.timer_config;
    navigate('/timer', {
      state: {
        timerConfig: {
          type:   tc.type || 'AMRAP',
          config: { duration: tc.trabajo || 300, rounds: tc.rounds || 8, work: tc.work || tc.trabajo || 20, rest: tc.descanso || 10 },
          sub_ejercicios: timerExercise.sub_ejercicios,
        }
      }
    });
  };

  // Cargas registradas hoy
  const logsToday = exerciseLogs?.[today] || {};
  const logsWithData = allExercises.filter(ex => {
    const id  = `${routine.id}_ex${ex.orden}`;
    return logsToday[id]?.weight;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-border shrink-0">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-surface2 text-muted hover:text-text transition-colors shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold leading-tight truncate">{routine.titulo}</h1>
            {typeInfo && (
              <span className={clsx('text-xs text-white font-semibold px-2.5 py-0.5 rounded-full shrink-0', typeInfo.badge)}>
                {typeInfo.label}
              </span>
            )}
          </div>
          {routine.descripcion && (
            <p className="text-xs text-muted mt-0.5 line-clamp-1">{routine.descripcion}</p>
          )}
        </div>
        {/* Progreso compacto en mobile */}
        <div className="md:hidden shrink-0 text-right">
          <span className="font-display-num text-2xl leading-none text-primary">{completedCount}/{totalCount}</span>
          <p className="text-xs text-muted">ejerc.</p>
        </div>
      </div>

      {/* ── Body: ejercicios + panel ── */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] overflow-hidden">

        {/* Columna izquierda: lista de ejercicios */}
        <div className="overflow-y-auto p-3 md:p-4 space-y-3">
          {processedExercises.map((item) => {
            if (item.isSuperset) {
              return (
                <div key={item.id} className="rounded-lg border-2 border-dashed border-accent/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-accent" />
                    <span className="text-sm font-bold text-accent">Superset</span>
                  </div>
                  {item.exercises.map(ex => {
                    const exerciseId = `${routine.id}_ex${ex.orden}`;
                    return (
                      <ExerciseCard
                        key={ex.orden}
                        exercise={ex}
                        exerciseId={exerciseId}
                        isCompleted={completedToday.includes(exerciseId)}
                        onToggleComplete={onToggleComplete}
                        logData={logsToday[exerciseId] || {}}
                        onLogChange={(data) => onLogExercise(exerciseId, data)}
                      />
                    );
                  })}
                </div>
              );
            }

            const exerciseId = `${routine.id}_ex${item.orden}`;
            return (
              <ExerciseCard
                key={item.orden}
                exercise={item}
                exerciseId={exerciseId}
                isCompleted={completedToday.includes(exerciseId)}
                onToggleComplete={onToggleComplete}
                logData={logsToday[exerciseId] || {}}
                onLogChange={(data) => onLogExercise(exerciseId, data)}
              />
            );
          })}
        </div>

        {/* Columna derecha: panel de progreso (solo desktop) */}
        <div className="hidden md:flex flex-col border-l border-border overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Progreso */}
            <div className="bg-surface rounded-lg border border-border p-5">
              <div className="flex justify-between items-baseline mb-3">
                <p className="text-sm font-semibold text-muted border-l-2 border-primary pl-2">Progreso</p>
                <span className="font-display-num text-3xl leading-none text-primary">{completedCount}/{totalCount}</span>
              </div>
              {/* Barra */}
              <div className="h-3 bg-surface2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-sm text-muted mt-2 text-right">{progressPct}% completado</p>

              {/* Lista resumen */}
              <div className="mt-3 space-y-1.5">
                {allExercises.map(ex => {
                  const id   = `${routine.id}_ex${ex.orden}`;
                  const done = completedToday.includes(id);
                  return (
                    <div key={ex.orden} className="flex items-center gap-2">
                      {done
                        ? <CheckCircle2 size={13} className="text-primary shrink-0" />
                        : <Circle size={13} className="text-muted shrink-0" />
                      }
                      <span className={clsx(
                        "text-xs truncate",
                        done ? "line-through text-muted" : "text-text"
                      )}>
                        {ex.nombre}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botón WOD Timer */}
            {timerExercise && (
              <button
                onClick={handleStartTimer}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover active:scale-95 text-white font-semibold py-3 rounded-xl text-sm transition-all"
              >
                <Timer size={16} />
                Iniciar WOD Timer
              </button>
            )}

            {/* Cargas del día */}
            {logsWithData.length > 0 && (
              <div className="bg-surface rounded-lg border border-border p-4">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Cargas de hoy</p>
                <div className="space-y-1.5">
                  {logsWithData.map(ex => {
                    const id = `${routine.id}_ex${ex.orden}`;
                    return (
                      <div key={ex.orden} className="flex justify-between items-center">
                        <span className="text-xs text-muted truncate flex-1 mr-2">{ex.nombre}</span>
                        <span className="text-xs font-bold text-text shrink-0">
                          {logsToday[id].weight} kg
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
