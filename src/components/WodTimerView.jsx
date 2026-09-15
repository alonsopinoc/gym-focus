import { useEffect, useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Repeat, Zap, X, RefreshCw, ArrowLeft, Timer, Minus, Volume2, VolumeX } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { MinimalNumberInput } from './MinimalNumberInput';
import { useTimer } from '../TimerContext.jsx';

// Chips de selección de segundos
const SecondsPicker = ({ value, onChange, options = [10, 15, 20, 30, 45, 60] }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(s => (
      <button
        key={s}
        type="button"
        onClick={() => onChange(s)}
        className={clsx(
          "px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all",
          value === s
            ? "bg-primary border-primary text-white"
            : "border-border text-muted hover:border-primary hover:text-primary"
        )}
      >
        {s}s
      </button>
    ))}
  </div>
);

const ProgressDots = ({ total, completed }) => {
  if (total < 1 || total > 50) return null;
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            "w-3 h-3 rounded-full transition-colors",
            i < completed ? "bg-primary" : "bg-surface2"
          )}
        />
      ))}
    </div>
  );
};

export function WodTimerView() {
  const location = useLocation();
  const initialRoutineConfig = location.state?.timerConfig;
  const navigate = useNavigate();
  const subEjercicios = initialRoutineConfig?.sub_ejercicios;
  const [showSubEjercicios, setShowSubEjercicios] = useState(false);

  const {
    screen, minimized, minimize, expand,
    timerType, setTimerType, config, setConfig,
    timeLeft, intervalTimeLeft, isActive, setIsActive, phase,
    currentRound, currentInterval, totalTime, countdown,
    volume, setVolume,
    handleStart, handleFinish, handleRestart, handleResetConfig, formatTime,
  } = useTimer();

  // Si llegamos a /timer y había una sesión minimizada, la volvemos a mostrar.
  useEffect(() => {
    if (minimized) expand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si se recibe una configuración desde una rutina, inicia el temporizador automáticamente
  // (solo si no hay ya una sesión corriendo, para no interrumpir un WOD en curso).
  useEffect(() => {
    if (initialRoutineConfig && screen === 'setup') {
      setTimerType(initialRoutineConfig.type);
      setConfig(initialRoutineConfig.config);
      const startTimeout = setTimeout(() => {
        handleStart();
        navigate(location.pathname, { replace: true, state: {} });
      }, 100);
      return () => clearTimeout(startTimeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMinimize = () => { minimize(); navigate(-1); };

  const handleTerminar = () => {
    handleFinish();
    if (initialRoutineConfig) navigate(-1);
  };

  const lastVolumeRef = useRef(volume || 0.8);
  const isMuted = volume === 0;
  const toggleMute = () => {
    if (volume > 0) { lastVolumeRef.current = volume; setVolume(0); }
    else setVolume(lastVolumeRef.current || 0.8);
  };

  // Lógica para el indicador de progreso por minutos
  const totalMinutes = (timerType === 'INTERVALS' || timerType === 'AMRAP') ? Math.floor(config.duration / 60) : 0;
  const completedMinutes = (timerType === 'INTERVALS' || timerType === 'AMRAP') ? Math.floor((totalTime - timeLeft + 1) / 60) : 0;

  if (screen === 'countdown') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 text-text bg-bg">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <button onClick={handleMinimize} title="Minimizar"
            className="p-2 bg-bg/10 rounded-full hover:bg-bg/20 transition-colors">
            <Minus size={22} />
          </button>
          <button onClick={handleTerminar}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-danger/10 text-danger font-semibold text-sm hover:bg-danger/15 transition-colors">
            <X size={16} /> Terminar
          </button>
        </div>
        <h2 className="font-display text-4xl opacity-80 mb-4">¡Prepárate!</h2>
        <h1 className="font-display-num text-9xl md:text-[15rem] leading-none">
          {countdown > 0 ? countdown : 'YA!'}
        </h1>
      </div>
    );
  }

  const SubEjerciciosPanel = () => (
    <div className="w-full md:w-80 bg-black/10 dark:bg-black/20 p-6 overflow-y-auto h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold">Ejercicios del WOD</h3>
        <button onClick={() => setShowSubEjercicios(false)} className="md:hidden p-1 rounded-full hover:bg-black/20 hover:bg-bg/20"><X size={20} /></button>
      </div>
      <div className="space-y-4">
        {subEjercicios.map((subEx, index) => (
          <div key={index} className="bg-black/10 dark:bg-bg/10 p-3 rounded-md">
            <p className="font-bold">{subEx.nombre}</p>
            <p className="text-sm opacity-80">{subEx.reps}</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (screen === 'running') {
    const isRest = timerType === 'TABATA' && phase === 'REST';
    return (
      <div className={clsx(
        "fixed inset-0 flex flex-col items-center justify-center z-50 transition-colors duration-500 px-6",
        isRest
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
          : 'bg-bg text-text',
        (timeLeft <= 3 && timeLeft > 0 && isActive) && 'animate-pulse'
      )}>
        {/* Minimizar / Terminar */}
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <button onClick={handleMinimize} title="Minimizar — sigue corriendo mientras navegas"
            className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
            <Minus size={20} />
          </button>
          <button onClick={handleTerminar}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-danger/10 text-danger font-semibold text-sm hover:bg-danger/15 transition-colors">
            <X size={16} /> Terminar
          </button>
        </div>

        {/* Info superior */}
        <div className="flex flex-col items-center mb-2">
          {timerType === 'TABATA' ? (
            <>
              <span className={clsx(
                "text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3",
                isRest ? "bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200" : "bg-primary/10 text-primary"
              )}>
                {isRest ? 'Descanso' : 'Trabajo'}
              </span>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-xs opacity-50 uppercase tracking-wide">Ronda</p>
                  <p className="text-xl font-bold">{currentRound}/{config.rounds}</p>
                </div>
                <div>
                  <p className="text-xs opacity-50 uppercase tracking-wide">Trabajo</p>
                  <p className="text-xl font-bold">{config.work}s</p>
                </div>
                <div>
                  <p className="text-xs opacity-50 uppercase tracking-wide">Descanso</p>
                  <p className="text-xl font-bold">{config.rest}s</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm font-semibold uppercase tracking-widest opacity-40">
              {timerType === 'INTERVALS' ? 'Intervalos' : 'AMRAP'}
            </p>
          )}

          {timerType === 'INTERVALS' && (
            <p className="text-base font-mono opacity-50 mt-1">aviso en {formatTime(intervalTimeLeft)}</p>
          )}
        </div>

        {/* Tiempo principal */}
        <h1 className="font-display-num text-[20vw] sm:text-[18vw] md:text-[14vw] lg:text-[11vw] leading-none my-4">
          {formatTime(timeLeft)}
        </h1>

        {/* Controles */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setIsActive(prev => !prev)}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 transition-colors"
          >
            {isActive ? <Pause size={22} /> : <Play size={22} />}
            <span>{isActive ? 'Pausar' : 'Reanudar'}</span>
          </button>
          <button onClick={toggleMute} title={isMuted ? 'Activar sonido' : 'Silenciar'}
            className="p-3 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 transition-colors">
            {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>
          <button
            onClick={handleRestart}
            className="p-3 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 transition-colors"
          >
            <RotateCcw size={22} />
          </button>
        </div>

        {/* Progreso */}
        <div className="flex flex-col items-center gap-2">
          {timerType === 'TABATA' && (
            <ProgressDots total={config.rounds} completed={phase === 'WORK' ? currentRound - 1 : currentRound} />
          )}
          {(timerType === 'INTERVALS' || timerType === 'AMRAP') && (
            <ProgressDots total={totalMinutes} completed={completedMinutes} />
          )}
          {timerType === 'TABATA' && (
            <p className="font-mono text-sm opacity-50">{currentRound} / {config.rounds} rondas</p>
          )}
          {(timerType === 'INTERVALS' || timerType === 'AMRAP') && totalMinutes > 0 && (
            <p className="font-mono text-sm opacity-50">{completedMinutes} / {totalMinutes} min</p>
          )}
        </div>
      </div>
    );
  }

  const timerModes = [
    {
      id: 'AMRAP', label: 'AMRAP', icon: <Repeat size={18} />,
      desc: 'La mayor cantidad de rondas posibles dentro del tiempo.',
      howto: ['Configura la duración', 'Pulsa Empezar', 'Completa tantas rondas como puedas', 'Anota el número de rondas al terminar'],
    },
    {
      id: 'INTERVALS', label: 'Intervalos', icon: <Zap size={18} />,
      desc: 'Recibe un aviso sonoro cada X segundos durante el tiempo total.',
      howto: ['Configura duración total y frecuencia de aviso', 'Cada pitido indica que empieza un nuevo intervalo', 'Usa el aviso para marcar rondas o cambiar ejercicio'],
    },
    {
      id: 'TABATA', label: 'Tabata', icon: <Timer size={18} />,
      desc: 'Protocolo de alta intensidad: trabajo / descanso en rondas cortas.',
      howto: ['El estándar es 20s trabajo / 10s descanso × 8 rondas', 'Descansa 0s para máxima intensidad', 'Personaliza rondas y tiempos a tu nivel'],
    },
  ];

  const activeMode = timerModes.find(m => m.id === timerType);

  // Preview del tiempo total para Tabata
  const tabataTotal = timerType === 'TABATA'
    ? config.rounds * (config.work + config.rest)
    : null;

  return (
    <div className="h-full flex flex-col md:grid md:grid-cols-[420px_1fr] lg:grid-cols-[460px_1fr] overflow-hidden">

      {/* ── Columna izquierda: configuración ── */}
      <div className="flex flex-col p-5 md:p-8 overflow-y-auto md:border-r border-border">

        {/* Header */}
        <header className="flex items-center gap-2 mb-7">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-surface2 text-muted hover:text-text transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-2xl flex-1">WOD Timer</h1>
          <button onClick={handleResetConfig} title="Resetear configuración"
            className="p-2 rounded-full text-muted hover:bg-surface2 hover:text-primary transition-colors">
            <RefreshCw size={15} />
          </button>
        </header>

        {/* Segmented control */}
        <div className="flex rounded-xl bg-surface2 p-1 gap-0.5 mb-6">
          {timerModes.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTimerType(id)}
              className={clsx(
                "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-semibold transition-all",
                timerType === id ? "bg-bg shadow text-primary" : "text-muted hover:text-text"
              )}>
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Configuración */}
        <div className="bg-surface rounded-lg border border-border p-5 space-y-6 mb-6">

          {timerType === 'AMRAP' && (
            <div>
              <p className="text-xs font-semibold text-muted mb-3 border-l-2 border-primary pl-2">Duración</p>
              <div className="flex items-center gap-4">
                <div className="w-36"><MinimalNumberInput value={config.duration / 60} onChange={(e) => setConfig(prev => ({ ...prev, duration: Number(e.target.value) * 60 }))} min={1} max={120} /></div>
                <span className="text-muted text-sm">minutos</span>
              </div>
            </div>
          )}

          {timerType === 'TABATA' && (
            <>
              <div>
                <p className="text-xs font-semibold text-muted mb-3 border-l-2 border-primary pl-2">Rondas</p>
                <div className="flex items-center gap-4">
                  <div className="w-36"><MinimalNumberInput value={config.rounds} onChange={(e) => setConfig(prev => ({ ...prev, rounds: Number(e.target.value) }))} min={1} max={99} /></div>
                  <span className="text-muted text-sm">rondas</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted mb-2 border-l-2 border-primary pl-2">Trabajo</p>
                <SecondsPicker value={config.work} onChange={(s) => setConfig(prev => ({ ...prev, work: s }))} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted mb-2 border-l-2 border-primary pl-2">Descanso</p>
                <SecondsPicker value={config.rest} onChange={(s) => setConfig(prev => ({ ...prev, rest: s }))} options={[0, 5, 10, 15, 20, 30, 45, 60]} />
              </div>
            </>
          )}

          {timerType === 'INTERVALS' && (
            <>
              <div>
                <p className="text-xs font-semibold text-muted mb-3 border-l-2 border-primary pl-2">Duración</p>
                <div className="flex items-center gap-4">
                  <div className="w-36"><MinimalNumberInput value={config.duration / 60} onChange={(e) => setConfig(prev => ({ ...prev, duration: Number(e.target.value) * 60 }))} min={1} max={120} /></div>
                  <span className="text-muted text-sm">minutos</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted mb-2 border-l-2 border-primary pl-2">Avisar cada</p>
                <SecondsPicker value={config.work} onChange={(s) => setConfig(prev => ({ ...prev, work: s }))} />
              </div>
            </>
          )}
        </div>

        <button onClick={handleStart}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl text-lg tracking-wide transition-colors mt-auto">
          ¡Empezar!
        </button>
      </div>

      {/* ── Columna derecha: info del modo ── */}
      <div className="hidden md:flex flex-col p-8 gap-8 overflow-y-auto">

        {/* Preview visual del timer */}
        <div className="bg-surface rounded-lg border border-border p-8 flex flex-col items-center gap-4">
          <p className="text-xs font-semibold text-muted border-l-2 border-primary pl-2">{activeMode.label} — Vista previa</p>

          {timerType === 'AMRAP' && (
            <>
              <div className="text-7xl font-display-num text-text/20 tabular-nums select-none">
                {String(Math.floor(config.duration / 60)).padStart(2,'0')}:00
              </div>
              <p className="text-muted text-sm">{config.duration / 60} minutos de trabajo continuo</p>
            </>
          )}

          {timerType === 'INTERVALS' && (
            <>
              <div className="text-7xl font-display-num text-text/20 tabular-nums select-none">
                {String(Math.floor(config.duration / 60)).padStart(2,'0')}:00
              </div>
              <div className="flex items-center gap-3 text-sm text-muted">
                <span>Aviso cada</span>
                <span className="font-bold text-primary text-base">{config.work}s</span>
                <span>→ {Math.floor(config.duration / config.work)} avisos totales</span>
              </div>
            </>
          )}

          {timerType === 'TABATA' && (
            <>
              <div className="w-full grid grid-cols-2 gap-4 text-center">
                <div className="bg-primary/10 rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">Trabajo</p>
                  <p className="text-3xl font-bold text-primary">{config.work}s</p>
                </div>
                <div className="bg-info/10 rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">Descanso</p>
                  <p className="text-3xl font-bold text-info">{config.rest}s</p>
                </div>
                <div className="bg-surface2 rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">Rondas</p>
                  <p className="text-3xl font-bold">{config.rounds}</p>
                </div>
                <div className="bg-surface2 rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">Total</p>
                  <p className="text-3xl font-bold">{tabataTotal}s</p>
                </div>
              </div>
              {/* Barra visual de rondas */}
              <div className="w-full">
                <p className="text-xs text-muted mb-2">Estructura de rondas</p>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: Math.min(config.rounds, 20) }).map((_, i) => (
                    <div key={i} className="flex gap-0.5">
                      <div className="h-4 rounded-sm bg-primary" style={{ width: `${Math.max(config.work / 2, 6)}px` }} />
                      <div className="h-4 rounded-sm bg-info/40" style={{ width: `${Math.max(config.rest / 2, 3)}px` }} />
                    </div>
                  ))}
                  {config.rounds > 20 && <span className="text-xs text-muted self-center ml-1">+{config.rounds - 20} más</span>}
                </div>
                <div className="flex gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted"><div className="w-3 h-2 rounded-sm bg-primary" />Trabajo</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted"><div className="w-3 h-2 rounded-sm bg-info/40" />Descanso</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Descripción + cómo usarlo */}
        <div className="bg-surface rounded-lg border border-border p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted mb-1 border-l-2 border-primary pl-2">¿Qué es {activeMode.label}?</p>
            <p className="text-sm text-muted leading-relaxed">{activeMode.desc}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted mb-2 border-l-2 border-primary pl-2">Cómo usarlo</p>
            <ol className="space-y-1.5">
              {activeMode.howto.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted">
                  <span className="text-primary font-bold w-4 shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
