import { clsx } from 'clsx';
import { CalendarDays, CheckCircle2, Flame, Dumbbell, Zap, HeartPulse, Star, Repeat } from 'lucide-react';
import { WeeklyWorkoutChart } from './WeeklyWorkoutChart';

const ROUTINE_TYPES = {
  F:        { label: 'Fuerza',      badge: 'bg-blue-500'    },
  F_BASICOS:{ label: 'Básicos',     badge: 'bg-sky-400'     },
  HIBRIDA:  { label: 'Híbrido',     badge: 'bg-purple-500'  },
  M:        { label: 'Metabólico',  badge: 'bg-red-500'     },
  AM:       { label: 'Activación',  badge: 'bg-emerald-500' },
  RM:       { label: 'Resistencia', badge: 'bg-orange-500'  },
};

function toKey(d) { return d.toISOString().split('T')[0]; }

function getStreak(completedDays) {
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (completedDays[toKey(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function ProgressView({ routines, completedExercises, completedDays = {} }) {
  const workoutsByDate = Object.entries(completedExercises)
    .map(([date, exerciseIds]) => {
      if (!exerciseIds?.length) return null;
      const routinesWorked = exerciseIds.reduce((acc, exId) => {
        const routineId = exId.split('_ex')[0];
        if (!acc[routineId]) {
          const details = routines.find(r => r.id === routineId);
          acc[routineId] = { ...details, completedCount: 0 };
        }
        acc[routineId].completedCount++;
        return acc;
      }, {});
      return { date, routines: Object.values(routinesWorked) };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalDays      = Object.keys(completedDays).length;
  const totalExercises = Object.values(completedExercises).flat().length;
  const streak         = getStreak(completedDays);

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-4 border-b border-border shrink-0">
        <h1 className="text-xl font-bold">Progreso</h1>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface border border-border rounded-lg p-4 flex flex-col items-center text-center gap-1">
            <Flame size={20} className="text-orange-400" />
            <p className="text-2xl font-bold">{streak}</p>
            <p className="text-[11px] text-muted font-medium">Racha</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 flex flex-col items-center text-center gap-1">
            <CalendarDays size={20} className="text-primary" />
            <p className="text-2xl font-bold">{totalDays}</p>
            <p className="text-[11px] text-muted font-medium">Días</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 flex flex-col items-center text-center gap-1">
            <CheckCircle2 size={20} className="text-blue-400" />
            <p className="text-2xl font-bold">{totalExercises}</p>
            <p className="text-[11px] text-muted font-medium">Ejercicios</p>
          </div>
        </div>

        {/* Layout desktop: gráfico + historial */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] gap-5">

          {/* Historial */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Historial</p>
            {workoutsByDate.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-muted">
                <CalendarDays size={40} className="opacity-20" />
                <p className="text-sm text-center">Aún no hay entrenamientos registrados.<br />¡Ve a entrenar!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workoutsByDate.map(({ date, routines: rs }) => (
                  <div key={date} className="bg-surface border border-border rounded-lg overflow-hidden">
                    {/* Fecha */}
                    <div className="px-4 py-2.5 bg-surface2 border-b border-border">
                      <p className="text-xs font-semibold text-muted capitalize">
                        {new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(date))}
                      </p>
                    </div>
                    {/* Rutinas del día */}
                    <div className="divide-y divide-border">
                      {rs.map(routine => {
                        const type = routine?.tipo ? ROUTINE_TYPES[routine.tipo] : null;
                        const total = routine?.ejercicios?.length ?? 0;
                        const pct   = total > 0 ? Math.round((routine.completedCount / total) * 100) : 0;
                        return (
                          <div key={routine?.id || routine?.titulo} className="px-4 py-3 flex items-center gap-3">
                            {type && (
                              <span className={clsx("text-[10px] font-bold text-white px-2 py-0.5 rounded-full shrink-0", type.badge)}>
                                {type.label}
                              </span>
                            )}
                            <span className="flex-1 text-sm font-semibold truncate">{routine?.titulo ?? 'Rutina'}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-16 h-1.5 bg-surface2 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-muted w-16 text-right">
                                {routine.completedCount}/{total} ej.
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gráfico semanal */}
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-lg p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Entrenamientos por semana</p>
              <div style={{ height: 200 }}>
                <WeeklyWorkoutChart completedExercises={completedExercises} />
              </div>
            </div>

            {/* Desglose por tipo */}
            {workoutsByDate.length > 0 && (() => {
              const counts = {};
              workoutsByDate.forEach(({ routines: rs }) => {
                rs.forEach(r => {
                  if (r?.tipo) counts[r.tipo] = (counts[r.tipo] || 0) + 1;
                });
              });
              const total = Object.values(counts).reduce((a, b) => a + b, 0);
              return (
                <div className="bg-surface border border-border rounded-lg p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Por tipo</p>
                  <div className="space-y-2.5">
                    {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([tipo, count]) => {
                      const type = ROUTINE_TYPES[tipo];
                      const pct  = Math.round((count / total) * 100);
                      return (
                        <div key={tipo}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium">{type?.label ?? tipo}</span>
                            <span className="text-xs text-muted">{count} sesiones</span>
                          </div>
                          <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                            <div className={clsx("h-full rounded-full", type?.badge ?? 'bg-primary')}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
