import { useNavigate } from 'react-router-dom';
import { Timer, Play, Pause, X, Maximize2 } from 'lucide-react';
import { useTimer } from '../TimerContext.jsx';

const MODE_LABELS = { AMRAP: 'AMRAP', INTERVALS: 'Intervalos', TABATA: 'Tabata' };

export function FloatingTimerWidget() {
  const navigate = useNavigate();
  const {
    screen, minimized, hasActiveSession, expand,
    timerType, timeLeft, countdown, isActive, setIsActive,
    handleFinish, formatTime,
  } = useTimer();

  if (!hasActiveSession || !minimized) return null;

  const handleExpand = () => {
    expand();
    navigate('/timer');
  };

  return (
    <div className="fixed z-40 bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] md:bottom-4 right-4 left-4 md:left-auto md:right-4 md:w-72">
      <div className="bg-surface border border-border rounded-xl shadow-lg flex items-center gap-3 p-3">
        <button onClick={handleExpand} className="flex items-center gap-3 flex-1 min-w-0 text-left" title="Expandir">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Timer size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider truncate">
              {MODE_LABELS[timerType] || 'WOD Timer'}
            </p>
            <p className="font-display-num text-xl leading-none">
              {screen === 'countdown' ? (countdown > 0 ? countdown : 'YA!') : formatTime(timeLeft)}
            </p>
          </div>
        </button>

        {screen === 'running' && (
          <button onClick={() => setIsActive(prev => !prev)} title={isActive ? 'Pausar' : 'Reanudar'}
            className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors shrink-0">
            {isActive ? <Pause size={17} /> : <Play size={17} />}
          </button>
        )}
        <button onClick={handleExpand} title="Expandir"
          className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors shrink-0">
          <Maximize2 size={16} />
        </button>
        <button onClick={handleFinish} title="Terminar"
          className="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors shrink-0">
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
