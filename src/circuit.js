// Modo circuito: las series de una rutina se reparten en vueltas. Un ejercicio
// aparece solo en las vueltas que le tocan según su número de series. Los ejercicios
// marcados como extra no se mezclan: forman un circuito aparte, al final de la rutina.
// Lo guardado por ejercicio es el número de serie, no el de vuelta (ver getRoundInfo).

const seriesOf = (exercise) => Math.max(exercise.series || 1, 1);
const maxSeries = (exercises) => exercises.reduce((max, exercise) => Math.max(max, seriesOf(exercise)), 0);

const isExtra = (exercise) => Boolean(exercise.es_extra);
const mainOf = (exercises) => exercises.filter((exercise) => !isExtra(exercise));
const extrasOf = (exercises) => exercises.filter(isExtra);

export const exerciseKey = (routineId, exercise) => `${routineId}_ex${exercise.orden}`;

// Solo tiene sentido si al menos dos ejercicios, sin contar los extras, tienen varias series.
export function isCircuitAvailable(exercises) {
  return mainOf(exercises).filter((exercise) => seriesOf(exercise) > 1).length >= 2;
}

export function getRoundCount(exercises) {
  return maxSeries(mainOf(exercises)) + maxSeries(extrasOf(exercises));
}

// Traduce una vuelta del recorrido completo a su bloque y a la serie que le toca a cada ejercicio.
export function getRoundInfo(exercises, round) {
  const mainRounds = maxSeries(mainOf(exercises));
  return round <= mainRounds
    ? { isExtra: false, series: round, total: mainRounds }
    : { isExtra: true, series: round - mainRounds, total: maxSeries(extrasOf(exercises)) };
}

export function getExercisesInRound(exercises, round) {
  const { isExtra: inExtra, series } = getRoundInfo(exercises, round);
  return (inExtra ? extrasOf(exercises) : mainOf(exercises)).filter((exercise) => seriesOf(exercise) >= series);
}

const roundsDone = (progress, key) => progress?.[key] || [];

export function isSeriesDone(progress, key, series) {
  return roundsDone(progress, key).includes(series);
}

export function toggleSeries(progress, key, series) {
  const done = roundsDone(progress, key);
  const next = done.includes(series)
    ? done.filter((item) => item !== series)
    : [...done, series].sort((a, b) => a - b);
  return { ...progress, [key]: next };
}

export function isRoundComplete(exercises, progress, routineId, round) {
  const { series } = getRoundInfo(exercises, round);
  return getExercisesInRound(exercises, round).every((exercise) =>
    isSeriesDone(progress, exerciseKey(routineId, exercise), series)
  );
}

// Primera vuelta con algo pendiente; null si el circuito está completo.
export function getCurrentRound(exercises, progress, routineId) {
  const total = getRoundCount(exercises);
  for (let round = 1; round <= total; round++) {
    if (!isRoundComplete(exercises, progress, routineId, round)) return round;
  }
  return null;
}

export function getSeriesDone(exercise, progress, routineId) {
  const series = seriesOf(exercise);
  return roundsDone(progress, exerciseKey(routineId, exercise)).filter((round) => round <= series).length;
}

export function isExerciseFinished(exercise, progress, routineId) {
  return getSeriesDone(exercise, progress, routineId) === seriesOf(exercise);
}

export function getCircuitProgress(exercises, progress, routineId) {
  return exercises.reduce(
    (totals, exercise) => ({
      done: totals.done + getSeriesDone(exercise, progress, routineId),
      total: totals.total + seriesOf(exercise),
    }),
    { done: 0, total: 0 }
  );
}
