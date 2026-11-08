import { Clock, Flame, HeartPulse, Watch } from 'lucide-react';
import { formatWorkoutTime } from '../watchImport';

// Valores del Apple Watch en una fila de cifras; omite los que el atajo no mandó.
export function WatchStats({ workout, compact = false }) {
  const stats = [
    workout.durationMin !== null && { icon: Clock, value: workout.durationMin, unit: 'min', label: 'Duración' },
    workout.kcal !== null && { icon: Flame, value: workout.kcal, unit: 'kcal', label: 'Calorías' },
    workout.hrAvg !== null && { icon: HeartPulse, value: workout.hrAvg, unit: 'lpm', label: 'FC prom.' },
    workout.hrMax !== null && { icon: HeartPulse, value: workout.hrMax, unit: 'lpm', label: 'FC máx.' },
  ].filter(Boolean);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        {stats.map(({ icon: Icon, value, unit, label }) => (
          <span key={label} className="inline-flex items-center gap-1" title={label}>
            <Icon size={12} className="text-danger/80" />
            <span className="font-semibold text-text">{value}</span> {unit}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {stats.map(({ icon: Icon, value, unit, label }) => (
        <div key={label} className="bg-surface2 rounded-lg px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] text-muted font-medium">
            <Icon size={13} className="text-danger/80" /> {label}
          </p>
          <p className="mt-0.5"><span className="text-xl font-bold">{value}</span> <span className="text-xs text-muted">{unit}</span></p>
        </div>
      ))}
    </div>
  );
}

export function WatchMetricsCard({ workouts }) {
  if (!workouts?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
        <Watch size={14} /> Apple Watch
      </p>
      {workouts.map((workout) => (
        <div key={workout.start} className="space-y-2">
          {workouts.length > 1 && <p className="text-xs text-muted">{formatWorkoutTime(workout)}</p>}
          <WatchStats workout={workout} />
        </div>
      ))}
    </div>
  );
}
