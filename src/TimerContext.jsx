import { createContext, useContext, useState, useRef, useEffect } from 'react';

const TimerContext = createContext(null);

const DEFAULT_CONFIG = { duration: 300, rounds: 8, work: 20, rest: 10 };

export function TimerProvider({ children }) {
  const [screen, setScreen] = useState('setup'); // 'setup' | 'countdown' | 'running'
  const [minimized, setMinimized] = useState(false);

  const [timerType, setTimerType] = useState(() => localStorage.getItem('wodTimerType') || 'AMRAP');
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('wodTimerConfig');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem('wodTimerType', timerType);
    try { localStorage.setItem('wodTimerConfig', JSON.stringify(config)); } catch {}
  }, [timerType, config]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [intervalTimeLeft, setIntervalTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('WORK'); // Para Tabata
  const [currentRound, setCurrentRound] = useState(1);
  const [currentInterval, setCurrentInterval] = useState(1);
  const [totalTime, setTotalTime] = useState(0);
  const [countdown, setCountdown] = useState(5);

  // --- VOLUMEN ---
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('wodTimerVolume');
    return saved !== null ? Number(saved) : 0.8;
  });
  useEffect(() => {
    localStorage.setItem('wodTimerVolume', String(volume));
  }, [volume]);

  // --- AUDIO ---
  const audioRef = useRef(null);
  if (audioRef.current === null) {
    audioRef.current = {
      countdown: new Audio('/countdown-beep.mp3'),
      start: new Audio('/start-gong.mp3'),
      interval: new Audio('/beep.mp3'),
    };
  }

  const playAudio = (soundKey) => {
    const audio = audioRef.current[soundKey];
    if (audio) {
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch(e => console.error(`Error al reproducir ${soundKey}:`, e));
    }
  };

  // --- WAKE LOCK (mantiene la pantalla encendida mientras corre) ---
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try { wakeLock = await navigator.wakeLock.request('screen'); }
        catch (err) { console.warn('No se pudo activar el bloqueo de pantalla:', err); }
      }
    };
    if (screen === 'running' && isActive) requestWakeLock();
    return () => { if (wakeLock) wakeLock.release().catch(() => {}); };
  }, [screen, isActive]);

  // --- TICK PRINCIPAL — vive aquí para seguir corriendo aunque el usuario navegue a otra página ---
  useEffect(() => {
    if (screen !== 'running' || !isActive) return;

    const interval = setInterval(() => {
      if (timerType === 'INTERVALS') {
        setIntervalTimeLeft(prev => {
          if (prev <= 1) {
            playAudio('interval');
            if (navigator.vibrate) navigator.vibrate(200);
            setCurrentInterval(i => i + 1);
            return config.work;
          }
          return prev - 1;
        });
      }

      setTimeLeft(prev => {
        if (prev <= 1) {
          playAudio('interval');
          if (navigator.vibrate) navigator.vibrate(500);

          if (timerType === 'TABATA') {
            if (phase === 'WORK') {
              setPhase('REST');
              return config.rest;
            } else {
              if (currentRound < config.rounds) {
                setCurrentRound(r => r + 1);
                setPhase('WORK');
                return config.work;
              } else {
                setIsActive(false);
                return 0;
              }
            }
          } else {
            setIsActive(false);
            return 0;
          }
        }

        if ((timerType === 'AMRAP' || timerType === 'INTERVALS') && prev > 1) {
          const secondsWithinMinute = (prev - 1) % 60;
          if (secondsWithinMinute === 3) playAudio('countdown');
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, screen, timerType, config, phase, currentRound]);

  // --- CUENTA REGRESIVA INICIAL ---
  useEffect(() => {
    if (screen !== 'countdown') return;

    if (countdown > 0) {
      const countdownInterval = setInterval(() => setCountdown(prev => prev - 1), 1000);
      return () => clearInterval(countdownInterval);
    } else {
      playAudio('start');
      setScreen('running');
      setIsActive(true);
    }
  }, [screen, countdown]);

  const handleStart = () => {
    const unlockAndPlay = async () => {
      try {
        const unlockPromises = Object.values(audioRef.current).map(audio => {
          audio.volume = 0;
          return audio.play().then(() => { audio.pause(); audio.volume = volume; audio.currentTime = 0; });
        });
        await Promise.allSettled(unlockPromises);
      } catch (e) {
        console.warn('No se pudo pre-activar el audio.');
      }
      setTimeout(() => playAudio('countdown'), 1000);
    };
    unlockAndPlay();

    switch (timerType) {
      case 'AMRAP':
        setTimeLeft(config.duration);
        setTotalTime(config.duration);
        break;
      case 'TABATA':
        setTimeLeft(config.work);
        setCurrentRound(1);
        setPhase('WORK');
        break;
      case 'INTERVALS':
        setTimeLeft(config.duration);
        setTotalTime(config.duration);
        setIntervalTimeLeft(config.work);
        setCurrentInterval(1);
        break;
      default:
        setTimeLeft(300);
    }
    setCountdown(5);
    setScreen('countdown');
    setMinimized(false);
  };

  // Termina la sesión por completo (botón "Terminar")
  const handleFinish = () => {
    setIsActive(false);
    setTimeLeft(0);
    setScreen('setup');
    setMinimized(false);
  };

  const handleRestart = () => {
    setIsActive(false);
    if (timerType === 'TABATA') {
      setTimeLeft(config.work);
      setCurrentRound(1);
      setPhase('WORK');
    } else {
      if (timerType === 'INTERVALS') {
        setCurrentInterval(1);
        setIntervalTimeLeft(config.work);
      }
      setTimeLeft(totalTime);
    }
  };

  const handleResetConfig = () => {
    localStorage.removeItem('wodTimerType');
    localStorage.removeItem('wodTimerConfig');
    window.location.reload();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const hasActiveSession = screen !== 'setup';

  const value = {
    screen, setScreen,
    minimized, minimize: () => setMinimized(true), expand: () => setMinimized(false),
    hasActiveSession,
    timerType, setTimerType,
    config, setConfig,
    timeLeft, intervalTimeLeft, isActive, setIsActive, phase,
    currentRound, currentInterval, totalTime, countdown,
    volume, setVolume,
    handleStart, handleFinish, handleRestart, handleResetConfig, formatTime,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer debe usarse dentro de <TimerProvider>');
  return ctx;
}
