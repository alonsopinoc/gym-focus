// Las rutinas guardadas pueden traer "Al fallo"; la app usa un solo término: "Máximas".
const unifyReps = (reps) => (typeof reps === 'string' ? reps.replace(/\bal fallo\b/gi, 'Máximas') : reps);

export function normalizeRoutines(routines) {
  return routines.map((routine) => ({
    ...routine,
    ejercicios: (routine.ejercicios || []).map((exercise) => ({ ...exercise, reps: unifyReps(exercise.reps) })),
  }));
}
