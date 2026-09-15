import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTheme } from '../../ThemeContext.jsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { MinimalNumberInput } from './MinimalNumberInput';
import { clsx } from 'clsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function StatCard({ label, value, unit, delta, lowerIsBetter = false }) {
  const hasDelta  = delta !== null && delta !== undefined;
  const isPositive = hasDelta && delta > 0;
  const isNegative = hasDelta && delta < 0;
  const isGood     = lowerIsBetter ? isNegative : isPositive;

  return (
    <div className="bg-surface rounded-lg border border-border p-4 flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      {value != null ? (
        <>
          <p className="text-2xl font-bold">
            {value}
            <span className="text-sm font-normal text-muted ml-1">{unit}</span>
          </p>
          {hasDelta && delta !== 0 && (
            <div className={clsx('flex items-center gap-1 text-xs font-semibold', isGood ? 'text-primary' : 'text-danger')}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{isPositive ? '+' : ''}{delta} {unit} vs anterior</span>
            </div>
          )}
          {hasDelta && delta === 0 && (
            <div className="flex items-center gap-1 text-xs text-muted">
              <Minus size={12} /><span>Sin cambio</span>
            </div>
          )}
        </>
      ) : (
        <p className="text-2xl font-bold text-muted/30">—</p>
      )}
    </div>
  );
}

export function BodyMetricsView({ metrics, onAddMetric, onDeleteMetric }) {
  const { theme } = useTheme();
  const [weight, setWeight] = useState('');
  const [fat,    setFat]    = useState('');
  const [muscle, setMuscle] = useState('');
  const [date,   setDate]   = useState(new Date().toISOString().split('T')[0]);

  const handleAdd = () => {
    if (!weight) return;
    const selectedDateKey = new Date(date).toISOString().split('T')[0];
    const count = metrics.filter(m => new Date(m.date).toISOString().split('T')[0] === selectedDateKey).length;
    if (count >= 2) { alert('No se pueden agregar más de dos mediciones para el mismo día.'); return; }
    onAddMetric({ id: Date.now(), date: new Date(date).toISOString(), weight: parseFloat(weight), fat: fat ? parseFloat(fat) : null, muscle: muscle ? parseFloat(muscle) : null });
    setWeight(''); setFat(''); setMuscle('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const sorted = [...metrics].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const prev   = sorted[sorted.length - 2];
  const delta  = (c, p) => c != null && p != null ? parseFloat((c - p).toFixed(1)) : null;

  const isDark = theme === 'dark';
  const tickColor  = isDark ? '#a3a3a3' : '#737373';
  const gridColor  = isDark ? '#27272a' : '#f4f4f5';

  const chartData = {
    labels: sorted.map(m => new Date(m.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })),
    datasets: [
      { label: 'Peso (kg)',  data: sorted.map(m => m.weight), borderColor: 'rgb(16,185,129)',  backgroundColor: 'rgba(16,185,129,0.1)',  borderWidth: 2, pointRadius: 4, tension: 0.3, yAxisID: 'y'  },
      { label: '% Grasa',   data: sorted.map(m => m.fat),    borderColor: 'rgb(239,68,68)',   backgroundColor: 'rgba(239,68,68,0.1)',   borderWidth: 2, pointRadius: 4, tension: 0.3, yAxisID: 'y1' },
      { label: '% Músculo', data: sorted.map(m => m.muscle), borderColor: 'rgb(59,130,246)',  backgroundColor: 'rgba(59,130,246,0.1)',  borderWidth: 2, pointRadius: 4, tension: 0.3, yAxisID: 'y1' },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { labels: { color: tickColor, boxWidth: 12, padding: 16, font: { size: 11 } } } },
    scales: {
      y:  { type: 'linear', position: 'left',  title: { display: true, text: 'Peso (kg)', color: tickColor, font: { size: 11 } }, ticks: { color: tickColor, font: { size: 11 } }, grid: { color: gridColor } },
      y1: { type: 'linear', position: 'right', title: { display: true, text: '%',         color: tickColor, font: { size: 11 } }, ticks: { color: tickColor, font: { size: 11 } }, grid: { drawOnChartArea: false } },
      x:  { ticks: { color: tickColor, font: { size: 11 } }, grid: { display: false } },
    },
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <h1 className="text-xl font-bold">Métricas Corporales</h1>
      </div>

      {/* ── Contenido scrollable ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">

        {/* Layout desktop: 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_1fr] lg:grid-cols-[340px_1fr_1fr] gap-5 h-full">

          {/* ── Col 1: Stats + Formulario ── */}
          <div className="flex flex-col gap-4">

            {/* Tarjetas resumen */}
            <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
              <StatCard label="Peso"    value={latest?.weight} unit="kg" delta={delta(latest?.weight, prev?.weight)} lowerIsBetter={false} />
              <StatCard label="Grasa"   value={latest?.fat}    unit="%"  delta={delta(latest?.fat,    prev?.fat)}    lowerIsBetter={true}  />
              <StatCard label="Músculo" value={latest?.muscle} unit="%"  delta={delta(latest?.muscle, prev?.muscle)} lowerIsBetter={false} />
            </div>

            {/* Formulario */}
            <div className="bg-surface rounded-lg border border-border p-5 flex flex-col gap-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Nueva medición</p>

              <div>
                <label className="text-xs text-muted block mb-1.5">Fecha</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-surface2 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1.5">Peso <span className="opacity-50">kg</span></label>
                <MinimalNumberInput value={weight} onChange={e => setWeight(e.target.value)} placeholder="0" min={0} />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1.5">Grasa <span className="opacity-50">% opcional</span></label>
                <MinimalNumberInput value={fat}    onChange={e => setFat(e.target.value)}    placeholder="0" min={0} />
              </div>

              <div>
                <label className="text-xs text-muted block mb-1.5">Músculo <span className="opacity-50">% opcional</span></label>
                <MinimalNumberInput value={muscle} onChange={e => setMuscle(e.target.value)} placeholder="0" min={0} />
              </div>

              <button onClick={handleAdd} disabled={!weight}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors">
                <PlusCircle size={15} />
                Añadir medición
              </button>
            </div>
          </div>

          {/* ── Col 2: Historial ── */}
          <div className="flex flex-col min-h-0">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-0.5">
              Historial
              {metrics.length > 0 && <span className="ml-2 normal-case text-text font-normal">{metrics.length} registros</span>}
            </p>

            {sorted.length === 0 ? (
              <div className="bg-surface rounded-lg border border-border p-10 text-center text-muted text-sm flex-1 flex items-center justify-center">
                Sin mediciones aún. ¡Añade la primera!
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                {sorted.slice().reverse().map(m => (
                  <div key={m.id} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">
                        {new Date(m.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <span className="text-xs"><span className="text-muted">Peso </span><span className="font-bold text-primary">{m.weight} kg</span></span>
                        {m.fat    != null && <span className="text-xs"><span className="text-muted">Grasa </span><span className="font-bold text-danger">{m.fat}%</span></span>}
                        {m.muscle != null && <span className="text-xs"><span className="text-muted">Músculo </span><span className="font-bold text-info">{m.muscle}%</span></span>}
                      </div>
                    </div>
                    <button onClick={() => onDeleteMetric(m.id)}
                      className="shrink-0 p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Col 3: Gráfico ── */}
          <div className="flex flex-col min-h-0">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-0.5">Evolución</p>
            <div className="bg-surface rounded-lg border border-border p-5 flex-1 flex flex-col min-h-0">
              {sorted.length > 1 ? (
                <div className="flex-1 min-h-[260px] md:min-h-0">
                  <Line options={chartOptions} data={chartData} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-muted text-sm gap-3">
                  <TrendingUp size={36} className="opacity-15" />
                  <p>Añade al menos dos mediciones<br />para ver el gráfico.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
