// Importación de métricas del Apple Watch. Un atajo de iOS lee los datos de Salud y abre
// /importar#inicio=…&fin=…&kcal=…&fc_prom=…&fc_max=…; los datos van tras el "#", que el
// navegador no envía a ningún servidor.
import { dateKey } from './program.js';

// Atajos puede mandar "128,5", "128 lpm" o "350 kcal": se toma el primer número.
const parseNumber = (text) => {
  const match = String(text ?? '').replace(',', '.').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const parseDate = (text) => {
  if (!text) return null;
  // En un link, el "+" de una zona horaria como +01:00 llega convertido en espacio.
  const date = new Date(text.trim().replace(' ', '+'));
  return Number.isNaN(date.getTime()) ? null : date;
};

const round = (value) => (value === null ? null : Math.round(value));

export function parseWatchHash(hash) {
  const params = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const start = parseDate(params.get('inicio'));
  const end = parseDate(params.get('fin'));
  if (!start) return null;

  const durationFromDates = end ? (end - start) / 60000 : null;
  const workout = {
    start: start.toISOString(),
    end: end ? end.toISOString() : null,
    durationMin: round(parseNumber(params.get('duracion')) ?? durationFromDates),
    kcal: round(parseNumber(params.get('kcal'))),
    hrAvg: round(parseNumber(params.get('fc_prom'))),
    hrMax: round(parseNumber(params.get('fc_max'))),
    hrMin: round(parseNumber(params.get('fc_min'))),
    activity: params.get('tipo') || null,
  };
  const hasMetrics = ['durationMin', 'kcal', 'hrAvg', 'hrMax'].some((key) => workout[key] !== null);
  return hasMetrics ? workout : null;
}

// El inicio identifica el entrenamiento: importar dos veces el mismo lo actualiza.
export const workoutId = (workout) => workout.start;

export const workoutDate = (workout) => dateKey(new Date(workout.start));

// Rutinas probables para ese día, en orden: la agendada en el calendario, las sesiones del
// programa marcadas ese día y las rutinas con ejercicios marcados ese día.
export function findCandidateRoutineIds(day, { scheduledRoutines = {}, program, completedExercises = {} }) {
  const ids = [];
  const add = (id) => { if (id && !ids.includes(id)) ids.push(id); };

  add(scheduledRoutines[day]);
  (program?.weeks || []).forEach((week) => week.sessions.forEach((session) => {
    if (session.doneOn === day) add(session.routineId);
  }));
  (completedExercises[day] || []).forEach((exerciseId) => add(exerciseId.split('_ex')[0]));
  return ids;
}

export function metricsForRoutine(workoutMetrics = {}, day, routineId) {
  return Object.values(workoutMetrics)
    .filter((workout) => workout.date === day && workout.routineId === routineId)
    .sort((a, b) => a.start.localeCompare(b.start));
}

const timeFormat = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });

export const formatWorkoutTime = (workout) => {
  const start = timeFormat.format(new Date(workout.start));
  return workout.end ? `${start} – ${timeFormat.format(new Date(workout.end))}` : start;
};
