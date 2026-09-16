import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadUserData } from '../userData';
import { clsx } from 'clsx';
import {
  ArrowLeft, User, Calendar, BarChart3, Scale,
  CalendarDays, CheckCircle, TrendingUp, TrendingDown, Minus,
  ChevronLeft, ChevronRight, Dumbbell, Zap, HeartPulse, Star, Repeat, CheckCircle2,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../../ThemeContext.jsx';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import { WeeklyWorkoutChart } from './WeeklyWorkoutChart';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// ─── Helpers calendario ───────────────────────────────────────────────────────

const ROUTINE_TYPES = {
  F:        { label: 'Fuerza',      dot: 'bg-blue-500',    badge: 'bg-blue-500'    },
  F_BASICOS:{ label: 'Básicos F',   dot: 'bg-sky-400',     badge: 'bg-sky-400'     },
  HIBRIDA:  { label: 'Híbrido',     dot: 'bg-purple-500',  badge: 'bg-purple-500'  },
  M:        { label: 'Metabólico',  dot: 'bg-red-500',     badge: 'bg-red-500'     },
  AM:       { label: 'Activación',  dot: 'bg-emerald-500', badge: 'bg-emerald-500' },
  RM:       { label: 'Resistencia', dot: 'bg-orange-500',  badge: 'bg-orange-500'  },
  K:        { label: 'Kettlebell',  dot: 'bg-amber-500',   badge: 'bg-amber-500'   },
  B:        { label: 'Básico',      dot: 'bg-teal-500',    badge: 'bg-teal-500'    },
};

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const WEEKDAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

function toKey(d) { return d.toISOString().split('T')[0]; }

function buildGrid(year, month) {
  const first  = new Date(year, month, 1).getDay();
  const offset = first === 0 ? 6 : first - 1;
  const total  = new Date(year, month + 1, 0).getDate();
  const prev   = new Date(year, month, 0).getDate();
  const cells  = [];
  for (let i = offset - 1; i >= 0; i--)
    cells.push({ day: prev - i, current: false, date: new Date(year, month - 1, prev - i) });
  for (let d = 1; d <= total; d++)
    cells.push({ day: d, current: true, date: new Date(year, month, d) });
  let nd = 1;
  while (cells.length < 42)
    cells.push({ day: nd, current: false, date: new Date(year, month + 1, nd++) });
  return cells;
}

// ─── Tab: Planificación (solo lectura) ───────────────────────────────────────

function PlanningTab({ routines, scheduledRoutines, completedDays }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const grid = buildGrid(year, month);

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); };

  const todayKey = toKey(today);

  return (
    <div className="space-y-4">
      {/* Navegación mes */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-surface2 text-muted"><ChevronLeft size={18} /></button>
        <p className="font-bold text-base">{MONTHS[month]} {year}</p>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-surface2 text-muted"><ChevronRight size={18} /></button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-[10px] font-bold text-muted py-1">{d}</div>
        ))}
        {grid.map((cell, i) => {
          const key       = toKey(cell.date);
          const routineId = scheduledRoutines?.[key];
          const routine   = routineId ? routines.find(r => r.id === routineId) : null;
          const typeInfo  = routine ? ROUTINE_TYPES[routine.tipo] : null;
          const done      = completedDays?.[key];
          const isToday   = key === todayKey;

          return (
            <div key={i} className={clsx(
              "aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs transition-all",
              !cell.current && "opacity-30",
              isToday && "ring-2 ring-primary",
              done && "bg-primary/10",
            )}>
              <span className={clsx("font-semibold text-xs leading-none", isToday && "text-primary")}>{cell.day}</span>
              {typeInfo && !done && (
                <span className={clsx("w-1.5 h-1.5 rounded-full", typeInfo.dot)} />
              )}
              {done && <CheckCircle2 size={10} className="text-primary" />}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 pt-2">
        {Object.entries(ROUTINE_TYPES).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={clsx("w-2 h-2 rounded-full", v.dot)} />
            <span className="text-xs text-muted">{v.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-primary" />
          <span className="text-xs text-muted">Completado</span>
        </div>
      </div>

      {/* Próximas rutinas */}
      {scheduledRoutines && Object.keys(scheduledRoutines).length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Próximas rutinas</p>
          <div className="space-y-1.5">
            {Object.entries(scheduledRoutines)
              .filter(([k]) => k >= toKey(today))
              .sort(([a],[b]) => a.localeCompare(b))
              .slice(0, 5)
              .map(([dateKey, routineId]) => {
                const routine  = routines.find(r => r.id === routineId);
                const typeInfo = routine ? ROUTINE_TYPES[routine.tipo] : null;
                return (
                  <div key={dateKey} className="flex items-center gap-3 bg-surface2 px-3 py-2 rounded-xl">
                    <span className="text-xs text-muted w-20 shrink-0">
                      {new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(dateKey))}
                    </span>
                    {typeInfo && (
                      <span className={clsx("text-[10px] font-bold text-white px-2 py-0.5 rounded-full shrink-0", typeInfo.badge)}>
                        {typeInfo.label}
                      </span>
                    )}
                    <span className="text-sm font-medium truncate">{routine?.titulo || routineId}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Progreso ────────────────────────────────────────────────────────────

function ProgressTab({ routines, completedExercises }) {
  const completedWorkoutsByDate = Object.entries(completedExercises || {})
    .map(([date, exerciseIds]) => {
      if (!exerciseIds?.length) return null;
      const routinesWorked = exerciseIds.reduce((acc, exId) => {
        const routineId = exId.split('_ex')[0];
        if (!acc[routineId]) {
          const routineDetails = routines.find(r => r.id === routineId);
          acc[routineId] = { ...routineDetails, completedCount: 0 };
        }
        acc[routineId].completedCount++;
        return acc;
      }, {});
      return { date, routines: Object.values(routinesWorked) };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalDays       = completedWorkoutsByDate.length;
  const totalExercises  = Object.values(completedExercises || {}).flat().length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface2 rounded-lg p-4 flex items-center gap-3">
          <CalendarDays size={24} className="text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted">Días entrenados</p>
            <p className="text-2xl font-bold">{totalDays}</p>
          </div>
        </div>
        <div className="bg-surface2 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle size={24} className="text-blue-500 shrink-0" />
          <div>
            <p className="text-xs text-muted">Ejercicios</p>
            <p className="text-2xl font-bold">{totalExercises}</p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-surface2 rounded-lg p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Entrenamientos por semana</p>
        <WeeklyWorkoutChart completedExercises={completedExercises || {}} />
      </div>

      {/* Historial */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Historial</p>
        {completedWorkoutsByDate.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">Sin entrenamientos registrados</p>
        ) : (
          <div className="space-y-2">
            {completedWorkoutsByDate.slice(0, 10).map(({ date, routines: rs }) => (
              <div key={date} className="bg-surface2 rounded-xl p-3">
                <p className="text-xs font-semibold text-primary capitalize">
                  {new Intl.DateTimeFormat('es-ES', { dateStyle: 'full' }).format(new Date(date))}
                </p>
                <div className="mt-2 space-y-1">
                  {rs.map(r => (
                    <div key={r?.id || r?.titulo} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{r?.titulo || 'Rutina desconocida'}</span>
                      <span className="text-xs text-muted">{r.completedCount} ejercicios</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Métricas ────────────────────────────────────────────────────────────

function MetricsMini({ label, value, unit, delta, lowerIsBetter = false }) {
  const hasDelta   = delta !== null && delta !== undefined;
  const isGood     = hasDelta ? (lowerIsBetter ? delta < 0 : delta > 0) : null;
  const Icon       = !hasDelta ? null : delta === 0 ? Minus : isGood ? TrendingUp : TrendingDown;

  return (
    <div className="bg-surface2 rounded-lg p-4 flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      {value != null ? (
        <>
          <p className="text-2xl font-bold">{value} <span className="text-sm font-normal text-muted">{unit}</span></p>
          {hasDelta && Icon && (
            <div className={clsx("flex items-center gap-1 text-xs font-semibold", isGood ? 'text-success' : 'text-danger')}>
              <Icon size={12} />
              <span>{delta > 0 ? '+' : ''}{delta.toFixed(1)} {unit}</span>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted">Sin datos</p>
      )}
    </div>
  );
}

function MetricsTab({ metrics }) {
  const { theme } = useTheme();

  const sorted = [...(metrics || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

  const latest  = sorted[sorted.length - 1];
  const prev    = sorted[sorted.length - 2];

  const delta = (key) => latest && prev && latest[key] != null && prev[key] != null
    ? parseFloat((latest[key] - prev[key]).toFixed(1)) : null;

  const lineColor = (hex) => ({
    borderColor: hex,
    backgroundColor: hex + '20',
    tension: 0.4,
    fill: true,
    pointRadius: 4,
    pointHoverRadius: 6,
  });

  const labels   = sorted.map(m => new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date(m.date)));
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const tickColor = theme === 'dark' ? '#888' : '#aaa';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: tickColor, font: { size: 11 } } }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } },
      y: { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } },
    },
  };

  const chartData = {
    labels,
    datasets: [
      { label: 'Peso (kg)',      data: sorted.map(m => m.weight),  ...lineColor('#6366f1') },
      { label: 'Grasa (%)',      data: sorted.map(m => m.fat),     ...lineColor('#ef4444') },
      { label: 'Músculo (%)',    data: sorted.map(m => m.muscle),  ...lineColor('#3b82f6') },
    ],
  };

  if (!metrics || metrics.length === 0) {
    return <p className="text-sm text-muted text-center py-12">Sin métricas registradas</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <MetricsMini label="Peso"    value={latest?.weight} unit="kg" delta={delta('weight')} />
        <MetricsMini label="Grasa"   value={latest?.fat}    unit="%" delta={delta('fat')}    lowerIsBetter />
        <MetricsMini label="Músculo" value={latest?.muscle} unit="%" delta={delta('muscle')} />
      </div>
      <div className="bg-surface2 rounded-lg p-4" style={{ height: 220 }}>
        <Line data={chartData} options={chartOptions} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Historial</p>
        <div className="space-y-1.5">
          {[...sorted].reverse().slice(0, 8).map(m => (
            <div key={m.id} className="flex items-center gap-3 bg-surface2 rounded-xl px-3 py-2 text-xs">
              <span className="text-muted w-20 shrink-0">
                {new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: '2-digit' }).format(new Date(m.date))}
              </span>
              {m.weight != null && <span className="font-semibold text-primary">{m.weight} kg</span>}
              {m.fat    != null && <span className="font-semibold text-red-400">{m.fat}% gr</span>}
              {m.muscle != null && <span className="font-semibold text-blue-400">{m.muscle}% mús</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'planning',  label: 'Planificación', icon: Calendar  },
  { key: 'progress',  label: 'Progreso',      icon: BarChart3 },
  { key: 'metrics',   label: 'Métricas',      icon: Scale     },
];

export function StudentDetailView({ routines }) {
  const { uid }    = useParams();
  const navigate   = useNavigate();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('planning');

  useEffect(() => {
    loadUserData(uid).then(d => { setData(d); setLoading(false); });
  }, [uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const profile = data?.profile || {};

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/admin')}
            className="p-2 rounded-full hover:bg-surface2 text-muted hover:text-text transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
          {profile.photoURL ? (
            <img src={profile.photoURL} alt={profile.displayName} className="w-10 h-10 rounded-full border-2 border-border shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User size={18} className="text-primary" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg leading-tight">{profile.displayName || 'Sin nombre'}</h1>
            <p className="text-xs text-muted">{profile.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                activeTab === key
                  ? "bg-primary text-white"
                  : "text-muted hover:text-text hover:bg-surface2"
              )}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 md:max-w-2xl">
        {activeTab === 'planning' && (
          <PlanningTab
            routines={routines}
            scheduledRoutines={data?.scheduledRoutines}
            completedDays={data?.completedDays}
          />
        )}
        {activeTab === 'progress' && (
          <ProgressTab
            routines={routines}
            completedExercises={data?.completedExercises}
          />
        )}
        {activeTab === 'metrics' && (
          <MetricsTab metrics={data?.bodyMetrics} />
        )}
      </div>
    </div>
  );
}
