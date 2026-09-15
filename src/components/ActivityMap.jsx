import { Tooltip } from 'react-tooltip';

export function ActivityMap({ completedDays }) {
  const today = new Date();
  const days = [];
  const daysToShow = 90; // Mostrar los últimos 90 días

  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    days.push({
      date: dateKey,
      isCompleted: completedDays[dateKey] === true,
    });
  }
  days.reverse(); // Ordenar de más antiguo a más reciente

  return (
    <>
      <div className="grid grid-cols-15 gap-1.5">
        {days.map(day => (
          <div
            key={day.date}
            data-tooltip-id="activity-tooltip"
            data-tooltip-content={new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            className={`w-4 h-4 rounded-sm ${
              day.isCompleted
                ? 'bg-primary'
                : 'bg-surface2'
            }`}
          ></div>
        ))}
      </div>
      <Tooltip id="activity-tooltip" />
    </>
  );
}

// Añade esto a tu tailwind.config.js para que funcione grid-cols-15
// theme: {
//   extend: {
//     gridTemplateColumns: {
//       '15': 'repeat(15, minmax(0, 1fr))',
//     }
//   },
// },