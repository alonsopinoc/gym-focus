import { Bar } from 'react-chartjs-2';
import { useTheme } from '../../ThemeContext.jsx';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function WeeklyWorkoutChart({ completedExercises }) {
  const { theme } = useTheme();

  const weeklyCounts = Object.keys(completedExercises).reduce((acc, dateStr) => {
    if (!completedExercises[dateStr]?.length) return acc;
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const firstDay = new Date(year, 0, 1);
    const pastDays = (date - firstDay) / 86400000;
    const weekNum  = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
    const key = `${year}-W${String(weekNum).padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const sortedWeeks = Object.keys(weeklyCounts).sort().slice(-10);

  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tickColor = theme === 'dark' ? '#71717a' : '#a1a1aa';

  const chartData = {
    labels: sortedWeeks.map(w => `S${w.split('-W')[1]}`),
    datasets: [{
      label: 'Días',
      data: sortedWeeks.map(w => weeklyCounts[w]),
      backgroundColor: 'rgba(99,102,241,0.7)',
      borderColor: 'rgba(99,102,241,1)',
      borderWidth: 0,
      borderRadius: 6,
      barPercentage: 0.55,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.raw} ${ctx.raw === 1 ? 'día' : 'días'}` },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 7,
        ticks: { color: tickColor, stepSize: 1, font: { size: 11 } },
        grid: { color: gridColor },
        border: { display: false },
      },
      x: {
        ticks: { color: tickColor, font: { size: 11 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  if (sortedWeeks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        Sin datos todavía
      </div>
    );
  }

  return <Bar options={options} data={chartData} />;
}
