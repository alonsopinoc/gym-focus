import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Check, Loader2, Watch } from 'lucide-react';
import { findCandidateRoutineIds, formatWorkoutTime, parseWatchHash, workoutDate, workoutId } from '../watchImport';
import { WatchStats } from './WatchMetrics';

const dayFormat = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

const NO_ROUTINE = '';

export function WatchImportView({ routines, scheduledRoutines, program, completedExercises, workoutMetrics, isDataLoaded, onSave }) {
  const location = useLocation();
  const navigate = useNavigate();
  // Se lee una sola vez: al guardar se limpia el "#" de la dirección.
  const [workout] = useState(() => parseWatchHash(location.hash));
  const [choice, setChoice] = useState(null);

  const leave = (to) => navigate(to, { replace: true });

  if (!workout) {
    return (
      <Shell>
        <div className="flex items-start gap-3 text-sm">
          <AlertCircle size={20} className="text-danger shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">No llegaron datos del reloj</p>
            <p className="text-muted">Abre esta página desde el atajo de Apple Watch: la dirección tiene que traer al menos el inicio del entrenamiento y alguna métrica.</p>
          </div>
        </div>
        <button onClick={() => leave('/')} className="w-full border border-border rounded-lg py-2.5 text-sm font-semibold">Ir al inicio</button>
      </Shell>
    );
  }

  if (!isDataLoaded) {
    return (
      <Shell>
        <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={16} className="animate-spin" /> Cargando tus datos…</p>
      </Shell>
    );
  }

  const day = workoutDate(workout);
  const candidates = findCandidateRoutineIds(day, { scheduledRoutines, program, completedExercises })
    .map((id) => routines.find((routine) => routine.id === id))
    .filter(Boolean);
  const previous = workoutMetrics[workoutId(workout)];
  const routineId = choice ?? previous?.routineId ?? candidates[0]?.id ?? NO_ROUTINE;
  const otherRoutines = routines.filter((routine) => !candidates.includes(routine));

  const handleSave = () => {
    onSave({ ...workout, date: day, routineId: routineId || null, importedAt: new Date().toISOString() });
    leave(routineId ? `/rutina/${routineId}` : '/progreso');
  };

  return (
    <Shell>
      <div>
        <p className="text-sm font-semibold first-letter:uppercase">{dayFormat.format(new Date(workout.start))}</p>
        <p className="text-xs text-muted">{formatWorkoutTime(workout)}{workout.activity ? ` · ${workout.activity}` : ''}</p>
      </div>

      <WatchStats workout={workout} />

      {previous && (
        <p className="text-xs text-muted bg-surface2 rounded-lg px-3 py-2">Este entrenamiento ya estaba importado: si guardas, se actualiza.</p>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">¿A qué rutina corresponde?</span>
        <select value={routineId} onChange={(event) => setChoice(event.target.value)}
          className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm">
          {candidates.length > 0 && (
            <optgroup label="Hiciste ese día">
              {candidates.map((routine) => <option key={routine.id} value={routine.id}>{routine.titulo}</option>)}
            </optgroup>
          )}
          <optgroup label="Otras rutinas">
            {otherRoutines.map((routine) => <option key={routine.id} value={routine.id}>{routine.titulo}</option>)}
          </optgroup>
          <option value={NO_ROUTINE}>Sin rutina (solo guardar las métricas)</option>
        </select>
        {candidates.length === 0 && (
          <span className="block text-xs text-muted">No encontré una rutina agendada ni marcada ese día: elige cuál fue.</span>
        )}
      </label>

      <div className="flex gap-2">
        <button onClick={() => leave('/')}
          className="flex-1 border border-border rounded-lg py-2.5 text-sm font-semibold text-muted hover:text-text">
          Descartar
        </button>
        <button onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-lg py-2.5 text-sm font-bold">
          <Check size={16} /> Guardar
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-full flex items-start sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg p-5 space-y-4">
        <h1 className="flex items-center gap-2 text-lg font-bold"><Watch size={20} className="text-primary" /> Entrenamiento del Apple Watch</h1>
        {children}
      </div>
    </div>
  );
}
