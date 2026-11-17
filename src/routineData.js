// Las rutinas guardadas pueden traer "Al fallo"; la app usa un solo término: "Máximas".
const unifyReps = (reps) => (typeof reps === 'string' ? reps.replace(/\bal fallo\b/gi, 'Máximas') : reps);

export function normalizeRoutines(routines) {
  return routines.map((routine) => ({
    ...routine,
    // Sin "reps" no se agrega la clave: Firestore rechaza los campos undefined.
    ejercicios: (routine.ejercicios || []).map((exercise) => (
      'reps' in exercise ? { ...exercise, reps: unifyReps(exercise.reps) } : exercise
    )),
  }));
}
