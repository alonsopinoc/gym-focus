import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { Dumbbell, Zap, HeartPulse, Star, Repeat, CalendarX2 } from 'lucide-react';

const routineTypes = {
  F: { label: "Fuerza", color: "bg-blue-500", icon: <Dumbbell size={14} /> },
  F_BASICOS: { label: "Básicos", color: "bg-sky-500", icon: <Star size={14} /> },
  HIBRIDA: { label: "Híbrido", color: "bg-purple-500", icon: <Repeat size={14} /> },
  M: { label: "Metabólico", color: "bg-red-500", icon: <Zap size={14} /> },
  AM: { label: "Activación", color: "bg-green-500", icon: <HeartPulse size={14} /> },
  RM: { label: "Resistencia", color: "bg-orange-500", icon: <HeartPulse size={14} /> },
};

const formatDate = (date, index) => {
  if (index === 0) return "Hoy";
  if (index === 1) return "Mañana";
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric' }).format(date);
};

export function UpcomingWorkouts({ routines, scheduledRoutines }) {
  const upcoming = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) { // Buscamos en los próximos 7 días
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];

    const routineId = scheduledRoutines[dateKey];
    if (routineId) {
      const routineDetails = routines.find(r => r.id === routineId);
      if (routineDetails) {
        upcoming.push({
          date: formatDate(date, i),
          routine: routineDetails,
        });
      }
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-text mb-4">Próximas Rutinas</h2>
      {upcoming.length > 0 ? (
        <div className="space-y-3">
          {upcoming.map(({ date, routine }) => {
            const typeInfo = routineTypes[routine.tipo];
            return (
              <Link to={`/rutina/${routine.id}`} key={routine.id + date} className="block bg-surface2 p-4 rounded-lg hover:bg-surface2 hover:bg-surface2 transition-colors">
                <p className="text-sm font-semibold text-primary-hover text-primary capitalize">{date}</p>
                <h3 className="text-lg font-bold text-text mt-1">{routine.titulo}</h3>
                {typeInfo && (
                  <div className={clsx("inline-flex items-center gap-1.5 text-xs font-semibold text-white px-2 py-1 rounded-full mt-2", typeInfo.color)}>
                    {typeInfo.icon}
                    <span>{typeInfo.label}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center bg-surface2 p-8 rounded-lg">
          <CalendarX2 size={40} className="text-muted dark:text-muted mb-4" />
          <h3 className="font-bold text-text">No hay rutinas agendadas</h3>
          <p className="text-sm text-muted mt-1">Haz clic en el calendario para planificar tus próximos entrenamientos.</p>
        </div>
      )}
    </div>
  );
}