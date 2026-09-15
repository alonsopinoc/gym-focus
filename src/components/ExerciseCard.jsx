import { useState, lazy, Suspense } from 'react';
import { CheckCircle2, Circle, ChevronDown, Info, Video, VideoOff, Timer as TimerIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { MinimalNumberInput } from './MinimalNumberInput';

const ReactPlayer = lazy(() => import('react-player/youtube'));

export function ExerciseCard({ exercise, exerciseId, isCompleted, onToggleComplete, logData, onLogChange }) {
  const [expanded, setExpanded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const navigate = useNavigate();

  const handleStartTimer = () => {
    if (!exercise.timer_config) return;
    const timerConfig = {
      type: exercise.timer_config.type || 'AMRAP',
      config: {
        duration: exercise.timer_config.trabajo || 300,
        rounds:   exercise.timer_config.rounds   || 8,
        work:     exercise.timer_config.work     || exercise.timer_config.trabajo || 20,
        rest:     exercise.timer_config.descanso || 10,
      },
    };
    if (exercise.sub_ejercicios) timerConfig.sub_ejercicios = exercise.sub_ejercicios;
    navigate('/timer', { state: { timerConfig } });
  };

  const hasDetails = exercise.nota || exercise.video_url || exercise.es_timer || onLogChange;

  return (
    <div className={clsx(
      "rounded-xl border transition-all duration-200",
      isCompleted ? "bg-primary/5 border-primary/20" : "bg-surface border-border"
    )}>
      {/* ── Fila compacta siempre visible ── */}
      <div
        className={clsx(
          "flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none transition-colors",
          hasDetails && "hover:bg-surface2/40 active:bg-surface2/60 rounded-xl"
        )}
        onClick={() => hasDetails && setExpanded(e => !e)}
      >
        {/* Toggle completado */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(exerciseId); }}
          className={clsx(
            "shrink-0 transition-colors",
            isCompleted ? "text-primary" : "text-muted hover:text-primary"
          )}
          aria-label={isCompleted ? "Marcar incompleto" : "Marcar completo"}
        >
          {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </button>

        {/* Orden */}
        <span className="text-xs text-muted w-4 shrink-0 text-center">{exercise.orden}</span>

        {/* Nombre */}
        <span className={clsx(
          "flex-1 text-sm font-semibold truncate",
          isCompleted && "line-through text-muted"
        )}>
          {exercise.nombre}
        </span>

        {/* Pills series/reps */}
        <div className="hidden sm:flex gap-1.5 shrink-0">
          {exercise.series && (
            <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full font-medium">
              {exercise.series}s
            </span>
          )}
          {exercise.reps && (
            <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full font-medium text-muted">
              {exercise.reps}
            </span>
          )}
        </div>

        {/* Carga rápida si hay log */}
        {logData?.weight && !expanded && (
          <span className="hidden md:block text-xs text-primary font-semibold shrink-0">
            {logData.weight} kg
          </span>
        )}

        {/* Chevron */}
        {hasDetails && (
          <ChevronDown
            size={15}
            className={clsx(
              "shrink-0 text-muted transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        )}
      </div>

      {/* Pills en mobile (debajo de la fila) */}
      {(exercise.series || exercise.reps) && (
        <div className="sm:hidden flex gap-1.5 px-3 pb-2 -mt-1">
          {exercise.series && (
            <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full font-medium">
              {exercise.series} series
            </span>
          )}
          {exercise.reps && (
            <span className="text-xs bg-surface2 px-2 py-0.5 rounded-full font-medium text-muted">
              {exercise.reps}
            </span>
          )}
        </div>
      )}

      {/* ── Panel expandible ── */}
      {expanded && hasDetails && (
        <div className="border-t border-border px-3 py-3 space-y-3">

          {/* Carga */}
          {onLogChange && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted font-medium w-12 shrink-0">Carga</span>
              <div className="w-28">
                <MinimalNumberInput
                  value={logData?.weight || ''}
                  onChange={(e) => onLogChange({ weight: e.target.value })}
                  placeholder="0"
                  min={0}
                />
              </div>
              <span className="text-xs text-muted">kg</span>
            </div>
          )}

          {/* Nota */}
          {exercise.nota && (
            <div className="bg-info/10 border border-info/20 text-info text-xs rounded-lg p-2.5 flex items-start gap-2">
              <Info size={13} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{exercise.nota}</span>
            </div>
          )}

          {/* Timer */}
          {exercise.es_timer && (
            <button
              onClick={handleStartTimer}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold text-xs py-2 px-3.5 rounded-lg transition-colors"
            >
              <TimerIcon size={13} />
              Iniciar Timer
            </button>
          )}

          {/* Video */}
          {exercise.video_url && (
            <>
              <button
                onClick={() => setShowVideo(v => !v)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors"
              >
                {showVideo ? <VideoOff size={13} /> : <Video size={13} />}
                {showVideo ? 'Ocultar video' : 'Ver video'}
              </button>
              {showVideo && (
                <div className="aspect-video overflow-hidden rounded-lg">
                  <Suspense fallback={
                    <div className="w-full h-full bg-surface2 animate-pulse flex items-center justify-center text-xs text-muted">
                      Cargando...
                    </div>
                  }>
                    <ReactPlayer url={exercise.video_url} width="100%" height="100%" controls playing />
                  </Suspense>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
