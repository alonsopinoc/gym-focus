import { useState } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Dumbbell, Zap, HeartPulse, Star, Repeat,
  CheckCircle2, CalendarDays, ChevronRight,
  Scale, TrendingUp, Flame, CalendarX2,
  User, LogOut, Sun, Moon, X,
} from 'lucide-react';
import { useTheme } from '../../ThemeContext.jsx';

const ROUTINE_TYPES = {
  F:        { label: 'Fuerza',      badge: 'bg-blue-500',    icon: <Dumbbell size={13} />  },
  F_BASICOS:{ label: 'Básicos',     badge: 'bg-sky-400',     icon: <Star size={13} />      },
  HIBRIDA:  { label: 'Híbrido',     badge: 'bg-purple-500',  icon: <Repeat size={13} />    },
  M:        { label: 'Metabólico',  badge: 'bg-red-500',     icon: <Zap size={13} />       },
  AM:       { label: 'Activación',  badge: 'bg-emerald-500', icon: <HeartPulse size={13} />},
  RM:       { label: 'Resistencia', badge: 'bg-orange-500',  icon: <HeartPulse size={13} />},
};

function toKey(d) { return d.toISOString().split('T')[0]; }

// Calcula racha actual de días completados consecutivos
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

// Tira de 7 días (hoy centrado en pos 3, lun-dom de la semana actual)
function buildWeekStrip(scheduledRoutines, completedDays, routines) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay() === 0 ? 6 : today.getDay() - 1; // lunes=0
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key     = toKey(d);
    const rid     = scheduledRoutines[key];
    const routine = rid ? routines.find(r => r.id === rid) : null;
    const done    = !!completedDays[key];
    const isToday = key === toKey(today);
    return { d, key, routine, done, isToday, dayLabel: ['L','M','X','J','V','S','D'][i] };
  });
}

export function DashboardView({ routines, scheduledRoutines, completedExercises, bodyMetrics, completedDays, user, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toKey(today);

  const todayRoutineId  = scheduledRoutines[todayKey];
  const todayRoutine    = routines.find(r => r.id === todayRoutineId);
  const isTodayDone     = !!completedDays[todayKey] || (completedExercises[todayKey]?.length > 0);
  const typeInfo        = todayRoutine ? ROUTINE_TYPES[todayRoutine.tipo] : null;

  const totalDays       = Object.keys(completedDays).length;
  const totalExercises  = Object.values(completedExercises).flat().length;
  const streak          = getStreak(completedDays);
  const lastMetric      = bodyMetrics.length > 0 ? bodyMetrics[bodyMetrics.length - 1] : null;
  const weekStrip       = buildWeekStrip(scheduledRoutines, completedDays, routines);

  // Próximos 5 días con rutina (excluyendo hoy)
  const upcoming = [];
  for (let i = 1; i <= 14 && upcoming.length < 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = toKey(d);
    const rid = scheduledRoutines[key];
    if (!rid) continue;
    const routine = routines.find(r => r.id === rid);
    if (!routine) continue;
    const label = i === 1 ? 'Mañana'
      : new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric' }).format(d);
    upcoming.push({ key, label, routine });
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* ── Encabezado ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              {new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(today)}
            </p>
            <h1 className="font-display text-3xl mt-0.5">{greeting}</h1>
          </div>
          {/* Avatar — solo en mobile (el sidebar ya lo muestra en desktop) */}
          <button
            onClick={() => setShowProfile(true)}
            className="md:hidden shrink-0 active:scale-90 transition-transform"
            aria-label="Perfil">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={18} className="text-primary" />
              </div>
            )}
          </button>
        </div>

        {/* ── Bottom sheet perfil (mobile) ── */}
        {showProfile && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:hidden"
            onClick={e => e.target === e.currentTarget && setShowProfile(false)}>
            <div className="bg-surface w-full rounded-t-3xl border-t border-border p-6 space-y-4"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
              {/* Handle */}
              <div className="w-10 h-1 bg-border rounded-full mx-auto -mt-2 mb-2" />

              {/* Usuario */}
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full border-2 border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User size={20} className="text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-bold">{user?.displayName || 'Usuario'}</p>
                  <p className="text-xs text-muted">{user?.email}</p>
                </div>
              </div>

              {/* Acciones */}
              <button onClick={toggleTheme}
                className="w-full flex items-center gap-3 h-12 px-4 rounded-xl bg-surface2 text-sm font-medium active:bg-surface2/70 transition-colors">
                {theme === 'dark' ? <Sun size={18} className="text-muted" /> : <Moon size={18} className="text-muted" />}
                {theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              </button>

              <button onClick={() => { setShowProfile(false); onLogout?.(); }}
                className="w-full flex items-center gap-3 h-12 px-4 rounded-xl bg-danger/10 text-sm font-semibold text-danger active:bg-danger/20 transition-colors">
                <LogOut size={18} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* ── Card de hoy ── */}
        {todayRoutine ? (
          isTodayDone ? (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-5 flex items-center gap-4">
              <div className="bg-primary/20 rounded-xl p-3 shrink-0">
                <CheckCircle2 size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">Día completado</p>
                <p className="font-bold text-lg mt-0.5">{todayRoutine.titulo}</p>
                <p className="text-sm text-muted">¡Excelente trabajo! 💪</p>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg p-5">
              <p className="text-xs font-semibold text-muted mb-3 border-l-2 border-primary pl-2">Entrenamiento de hoy</p>
              <div className="flex items-start gap-4">
                {typeInfo && (
                  <div className={clsx("rounded-xl p-3 shrink-0 text-white", typeInfo.badge)}>
                    <span className="block scale-125">{typeInfo.icon}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-display text-xl leading-tight">{todayRoutine.titulo}</h2>
                    {typeInfo && (
                      <span className={clsx("text-[10px] font-bold text-white px-2 py-0.5 rounded-full", typeInfo.badge)}>
                        {typeInfo.label}
                      </span>
                    )}
                  </div>
                  {todayRoutine.descripcion && (
                    <p className="text-sm text-muted mt-1 line-clamp-2">{todayRoutine.descripcion}</p>
                  )}
                  <p className="text-xs text-muted mt-1">{todayRoutine.ejercicios?.length ?? 0} ejercicios</p>
                </div>
              </div>
              <Link to={`/rutina/${todayRoutine.id}`}
                className="mt-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl text-sm transition-colors">
                Iniciar entrenamiento <ChevronRight size={16} />
              </Link>
            </div>
          )
        ) : (
          <div className="bg-surface border border-border rounded-lg p-5 flex items-center gap-4">
            <div className="bg-surface2 rounded-xl p-3 shrink-0">
              <CalendarX2 size={22} className="text-muted" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Sin entrenamiento hoy</p>
              <p className="text-sm text-muted mt-0.5">Descansa o planifica tu semana.</p>
            </div>
            <Link to="/planificacion/calendario"
              className="shrink-0 text-xs font-semibold text-primary hover:underline">
              Planificar
            </Link>
          </div>
        )}

        {/* ── Tira semanal ── */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-xs font-semibold text-muted mb-3 border-l-2 border-primary pl-2">Esta semana</p>
          <div className="grid grid-cols-7 gap-1">
            {weekStrip.map(({ key, d, routine, done, isToday, dayLabel }) => {
              const type = routine ? ROUTINE_TYPES[routine.tipo] : null;
              return (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <span className={clsx("text-[10px] font-semibold", isToday ? "text-primary" : "text-muted")}>
                    {dayLabel}
                  </span>
                  <div className={clsx(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                    isToday && !done && "ring-2 ring-primary ring-offset-1 ring-offset-surface",
                    done ? "bg-primary/15" : type ? `${type.badge} opacity-80` : "bg-surface2",
                  )}>
                    {done
                      ? <CheckCircle2 size={15} className="text-primary" />
                      : type
                        ? <span className="text-white scale-90">{type.icon}</span>
                        : <span className="text-[10px] font-bold text-muted">{d.getDate()}</span>
                    }
                  </div>
                  <span className={clsx(
                    "text-[10px] font-medium",
                    isToday ? "text-primary" : "text-muted"
                  )}>
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface border border-border rounded-md p-4 flex flex-col items-center text-center gap-1">
            <Flame size={18} className="text-orange-400" />
            <p className="font-display-num text-3xl leading-none">{streak}</p>
            <p className="text-[11px] text-muted font-medium">Racha</p>
          </div>
          <div className="bg-surface border border-border rounded-md p-4 flex flex-col items-center text-center gap-1">
            <CalendarDays size={18} className="text-primary" />
            <p className="font-display-num text-3xl leading-none">{totalDays}</p>
            <p className="text-[11px] text-muted font-medium">Días</p>
          </div>
          <div className="bg-surface border border-border rounded-md p-4 flex flex-col items-center text-center gap-1">
            <CheckCircle2 size={18} className="text-blue-400" />
            <p className="font-display-num text-3xl leading-none">{totalExercises}</p>
            <p className="text-[11px] text-muted font-medium">Ejercicios</p>
          </div>
        </div>

        {/* ── Próximos + Métricas (desktop 2 col) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Próximos */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs font-semibold text-muted mb-3 border-l-2 border-primary pl-2">Próximos</p>
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-muted">
                <CalendarX2 size={28} className="opacity-25" />
                <p className="text-xs text-center">Sin rutinas agendadas<br />en los próximos días</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(({ key, label, routine }) => {
                  const type = ROUTINE_TYPES[routine.tipo];
                  return (
                    <Link key={key} to={`/rutina/${routine.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface2 transition-colors group">
                      {type && (
                        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0", type.badge)}>
                          {type.icon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted capitalize">{label}</p>
                        <p className="text-sm font-semibold truncate">{routine.titulo}</p>
                      </div>
                      <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>
            )}
            <Link to="/planificacion/calendario"
              className="mt-3 flex items-center justify-center gap-1 text-xs text-primary hover:text-primary-hover font-semibold transition-colors border-t border-border pt-3">
              Ver calendario <ChevronRight size={12} />
            </Link>
          </div>

          {/* Última métrica */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs font-semibold text-muted mb-3 border-l-2 border-primary pl-2">Última métrica</p>
            {lastMetric ? (
              <>
                <p className="text-xs text-muted mb-3">
                  {new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(new Date(lastMetric.date))}
                </p>
                <div className="space-y-3">
                  {lastMetric.weight != null && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale size={14} className="text-primary shrink-0" />
                        <span className="text-sm text-muted">Peso</span>
                      </div>
                      <span className="font-bold text-sm">{lastMetric.weight} kg</span>
                    </div>
                  )}
                  {lastMetric.fat != null && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-red-400 shrink-0" />
                        <span className="text-sm text-muted">Grasa</span>
                      </div>
                      <span className="font-bold text-sm">{lastMetric.fat}%</span>
                    </div>
                  )}
                  {lastMetric.muscle != null && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Dumbbell size={14} className="text-blue-400 shrink-0" />
                        <span className="text-sm text-muted">Músculo</span>
                      </div>
                      <span className="font-bold text-sm">{lastMetric.muscle}%</span>
                    </div>
                  )}
                </div>
                <Link to="/metricas"
                  className="mt-3 flex items-center justify-center gap-1 text-xs text-primary hover:text-primary-hover font-semibold transition-colors border-t border-border pt-3">
                  Ver métricas <ChevronRight size={12} />
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-muted">
                <Scale size={28} className="opacity-25" />
                <p className="text-xs text-center">Sin métricas registradas</p>
                <Link to="/metricas" className="text-xs text-primary font-semibold">Registrar ahora</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
