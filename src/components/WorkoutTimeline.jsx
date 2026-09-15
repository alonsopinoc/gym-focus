import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { CheckCircle2, Dumbbell, Zap, HeartPulse, Star, Repeat } from 'lucide-react';

const routineTypes = {
  F: { label: "Fuerza", color: "bg-blue-500", icon: <Dumbbell size={20} className="text-white" /> },
  F_BASICOS: { label: "Básicos", color: "bg-sky-500", icon: <Star size={20} className="text-white" /> },
  HIBRIDA: { label: "Híbrido", color: "bg-purple-500", icon: <Repeat size={20} className="text-white" /> },
  M: { label: "Metabólico", color: "bg-red-500", icon: <Zap size={20} className="text-white" /> },
  AM: { label: "Activación", color: "bg-green-500", icon: <HeartPulse size={20} className="text-white" /> },
  RM: { label: "Resistencia", color: "bg-orange-500", icon: <HeartPulse size={20} className="text-white" /> },
};

const formatDate = (date, index) => {
  const dayOffset = index - 2; // -2, -1, 0, 1, 2, 3
  if (dayOffset === 0) return "Hoy";
  if (dayOffset === 1) return "Mañana";
  if (dayOffset === -1) return "Ayer";
  if (dayOffset < -1) return `Hace ${-dayOffset} días`;
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
};

export function WorkoutTimeline({ routines, scheduledRoutines, completedDays }) {
  const timelineDays = [];
  const today = new Date();

  for (let i = -2; i <= 3; i++) { // Desde hace 2 días hasta 3 días en el futuro
    const date = new Date();
    date.setDate(today.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];

    const routineId = scheduledRoutines[dateKey];
    const routineDetails = routineId ? routines.find(r => r.id === routineId) : null;
    const isCompleted = completedDays[dateKey] === true;
    const isToday = i === 0;

    timelineDays.push({
      date: formatDate(date, i + 2),
      dateKey,
      routine: routineDetails,
      isCompleted,
      isToday,
    });
  }

  return (
    <div className="space-y-3">
      {timelineDays.map(day => (
        day.routine && (
          <Link
            to={`/rutina/${day.routine.id}`}
            key={day.dateKey}
            className={clsx(
              "flex items-center gap-4 p-3 rounded-lg transition-all",
              day.isToday && !day.isCompleted && "border-2 border-primary",
              day.isCompleted ? "bg-primary-soft bg-primary-soft/50" : "bg-surface2 hover:bg-surface2 hover:bg-surface2"
            )}
          >
            <div className={clsx("p-2 rounded-md", routineTypes[day.routine.tipo]?.color || 'bg-gray-500')}>
              {routineTypes[day.routine.tipo]?.icon || <Dumbbell size={20} className="text-white" />}
            </div>
            <div className="flex-grow">
              <p className={clsx(
                "text-sm font-semibold capitalize",
                day.isToday ? "text-primary-hover text-primary" : "text-muted"
              )}>
                {day.date}
              </p>
              <h3 className="text-md font-bold text-text mt-0.5">{day.routine.titulo}</h3>
            </div>
            {day.isCompleted && <CheckCircle2 size={24} className="text-primary flex-shrink-0" />}
          </Link>
        )
      ))}
    </div>
  );
}
