import { useRef, useState } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, RotateCcw, Zap } from 'lucide-react';
import { ExerciseCard } from './ExerciseCard';
import {
  exerciseKey, getCurrentRound, getExercisesInRound, getRoundCount, getRoundInfo, isRoundComplete, isSeriesDone, toggleSeries,
} from '../circuit';

// El botón no se mueve al avanzar de vuelta: un doble toque no debe completar también la siguiente.
const DOUBLE_TAP_MS = 800;

export function CircuitWorkout({ routineId, exercises, progress, logsToday, onToggleRound, onLogExercise }) {
  // Vuelta elegida a mano para revisarla o corregirla; sin ella se sigue la vuelta en curso.
  const [selectedRound, setSelectedRound] = useState(null);
  const lastTapAt = useRef(null);

  const totalRounds = getRoundCount(exercises);
  const currentRound = getCurrentRound(exercises, progress, routineId);
  const round = selectedRound ?? currentRound ?? totalRounds;
  const { isExtra, series, total } = getRoundInfo(exercises, round);
  const roundLabel = isExtra ? `vuelta ${series} del extra` : `vuelta ${series}`;
  const roundExercises = getExercisesInRound(exercises, round);
  const nextExercise = roundExercises.find(
    (exercise) => !isSeriesDone(progress, exerciseKey(routineId, exercise), series)
  );

  const handleToggle = (exercise) => {
    const updated = toggleSeries(progress, exerciseKey(routineId, exercise), series);
    onToggleRound(exercise, series);
    if (isRoundComplete(exercises, updated, routineId, round)) setSelectedRound(null);
  };

  const pendingInRound = roundExercises.filter(
    (exercise) => !isSeriesDone(progress, exerciseKey(routineId, exercise), series)
  );

  const isDoubleTap = (event) => {
    const previous = lastTapAt.current;
    lastTapAt.current = event.timeStamp;
    return previous !== null && event.timeStamp - previous < DOUBLE_TAP_MS;
  };

  const handleCompleteRound = (event) => {
    if (isDoubleTap(event)) return;
    pendingInRound.forEach((exercise) => onToggleRound(exercise, series));
    setSelectedRound(null);
  };

  const handleUndoRound = (event) => {
    if (isDoubleTap(event)) return;
    roundExercises.forEach((exercise) => onToggleRound(exercise, series));
  };

  const renderCard = (exercise) => {
    const key = exerciseKey(routineId, exercise);
    return (
      <div
        key={`${round}_${exercise.orden}`}
        className={clsx('rounded-xl', exercise === nextExercise && 'ring-2 ring-primary/60')}>
        <ExerciseCard
          exercise={exercise}
          exerciseId={key}
          seriesLabel={`Serie ${series} de ${exercise.series || 1}`}
          isCompleted={isSeriesDone(progress, key, series)}
          onToggleComplete={() => handleToggle(exercise)}
          logData={logsToday[key] || {}}
          onLogChange={(data) => onLogExercise(key, data)}
        />
      </div>
    );
  };

  const items = roundExercises.reduce((groups, exercise) => {
    const superset = exercise.superset_id && groups.find((group) => group.id === exercise.superset_id);
    if (superset) superset.exercises.push(exercise);
    else groups.push({ id: exercise.superset_id || `ex${exercise.orden}`, isSuperset: Boolean(exercise.superset_id), exercises: [exercise] });
    return groups;
  }, []);

  return (
    <div className="space-y-3">
      {currentRound === null && (
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
          <CheckCircle2 size={20} className="text-primary shrink-0" />
          <p className="text-sm font-semibold">Circuito completo: hiciste todas las vueltas.</p>
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-xl leading-none">{isExtra ? 'Extra · vuelta' : 'Vuelta'} {series} de {total}</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: totalRounds }, (_, index) => index + 1).map((item) => {
            const isComplete = isRoundComplete(exercises, progress, routineId, item);
            const info = getRoundInfo(exercises, item);
            return (
              <button
                key={item}
                onClick={() => setSelectedRound(item === currentRound ? null : item)}
                aria-label={`Ver vuelta ${info.series}${info.isExtra ? ' del extra' : ''}${isComplete ? ', completa' : ''}`}
                aria-current={item === round ? 'step' : undefined}
                className={clsx(
                  'h-7 rounded-full text-xs font-bold transition-colors',
                  info.isExtra ? 'px-2' : 'w-7',
                  info.isExtra && info.series === 1 && 'ml-2',
                  isComplete ? 'bg-primary text-white' : 'bg-surface2 text-muted hover:text-text',
                  item === round && 'ring-2 ring-primary ring-offset-1 ring-offset-surface',
                )}>
                {info.isExtra ? `E${info.series}` : info.series}
              </button>
            );
          })}
        </div>
        {pendingInRound.length > 0 ? (
          <button
            onClick={handleCompleteRound}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold py-2.5 rounded-lg transition-colors">
            <CheckCircle2 size={16} /> Completar {roundLabel}
          </button>
        ) : (
          <button
            onClick={handleUndoRound}
            className="w-full flex items-center justify-center gap-2 border border-border text-muted hover:text-text text-sm font-semibold py-2.5 rounded-lg transition-colors">
            <RotateCcw size={15} /> Desmarcar {roundLabel}
          </button>
        )}
      </div>

      {items.map((item) => (
        item.isSuperset ? (
          <div key={item.id} className="rounded-lg border-2 border-dashed border-accent/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-accent" />
              <span className="text-sm font-bold text-accent">Superset</span>
            </div>
            {item.exercises.map(renderCard)}
          </div>
        ) : renderCard(item.exercises[0])
      ))}
    </div>
  );
}
