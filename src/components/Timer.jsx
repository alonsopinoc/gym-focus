import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, BellRing } from 'lucide-react';

export function Timer({ config }) {
  const isEmom = config.timer_type === 'emom';
  const initialTime = isEmom ? config.total_duration : config.trabajo;

  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [intervalTimeLeft, setIntervalTimeLeft] = useState(isEmom ? config.interval : 0);
  const [isActive, setIsActive] = useState(false);

  const reset = useCallback(() => {
    setIsActive(false);
    setTimeLeft(initialTime);
    if (isEmom) {
      setIntervalTimeLeft(config.interval);
    }
  }, [initialTime, isEmom, config.interval]);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
        if (isEmom) {
          setIntervalTimeLeft(intervalTime => intervalTime - 1);
        }
      }, 1000); // Actualiza cada segundo
    } else if (timeLeft === 0) {
      if (isActive) {
        // Reproduce un sonido cuando el tiempo de trabajo termina
        const audio = new Audio('/beep.mp3'); // Asegúrate de tener este archivo en tu carpeta `public`
        audio.play();
      }
      // Opcional: Sonido o vibración al terminar
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Efecto separado para manejar los intervalos del EMOM
  useEffect(() => {
    if (isEmom && isActive && intervalTimeLeft === 0 && timeLeft > 0) {
      const audio = new Audio('/beep.mp3'); // Sonido de intervalo
      audio.play();
      setIntervalTimeLeft(config.interval); // Reinicia el contador de intervalo
    }
  }, [isEmom, isActive, intervalTimeLeft, timeLeft, config.interval]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="flex items-center gap-4 mt-2">
      <div className="flex flex-col">
        <p className="text-4xl font-bold font-mono text-primary text-primary w-32">
          {formatTime(timeLeft)}
        </p>
        {isEmom && (
          <p className="text-lg font-mono text-muted">
            Intervalo: {formatTime(intervalTimeLeft)}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setIsActive(!isActive)} className="p-2 bg-surface2 rounded-full text-neutral-800 text-text">
          {isActive ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button onClick={reset} className="p-2 bg-surface2 rounded-full text-neutral-800 text-text">
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
}