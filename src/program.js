// Lógica del programa semanal: cada semana es una lista de sesiones sin día
// asignado. El usuario elige cuál hacer cada día, incluidos los fines de semana.

const DAY_MS = 24 * 60 * 60 * 1000;

const keyToUtc = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

// Fecha local en formato YYYY-MM-DD
export function dateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(key, days) {
  return new Date(keyToUtc(key) + days * DAY_MS).toISOString().split('T')[0];
}

// Crea el programa a partir del borrador. Las rutinas rotan por tipo a lo largo
// de todas las semanas (R.M 1, 2, 3, 4, 1...) para recorrerlas todas.
export function buildProgram(draft, startKey, routines, id = `program_${Date.now()}`) {
  const usedByType = {};
  const nextRoutineId = (tipo) => {
    const options = routines.filter((routine) => routine.tipo === tipo);
    if (options.length === 0) return null;
    const used = usedByType[tipo] || 0;
    usedByType[tipo] = used + 1;
    return options[used % options.length].id;
  };

  const repetitions = draft.repeticiones || 1;
  const weeks = [];
  for (let repetition = 0; repetition < repetitions; repetition++) {
    draft.semanas.forEach((semana) => {
      const weekIndex = weeks.length;
      const sessions = [];
      Object.entries(semana.plan).forEach(([tipo, count]) => {
        for (let i = 0; i < count; i++) {
          sessions.push({
            id: `w${weekIndex}_s${sessions.length}`,
            tipo,
            routineId: nextRoutineId(tipo),
            doneOn: null,
          });
        }
      });
      weeks.push({ sessions });
    });
  }

  return {
    id,
    titulo: draft.titulo.trim(),
    descripcion: (draft.descripcion || '').trim(),
    startDate: startKey,
    weeks,
  };
}

const countByType = (sessions) =>
  sessions.reduce((counts, session) => ({ ...counts, [session.tipo]: (counts[session.tipo] || 0) + 1 }), {});

// Borrador para editar: cada semana con sus cantidades por tipo.
export function programToDraft(program) {
  return {
    titulo: program.titulo,
    descripcion: program.descripcion || '',
    semanas: program.weeks.map((week) => ({ plan: countByType(week.sessions) })),
    repeticiones: 1,
  };
}

// Por semana, cuántas sesiones hechas tiene cada tipo: son el mínimo al editar.
export function getDoneCounts(program) {
  return program.weeks.map((week) => countByType(week.sessions.filter((session) => session.doneOn)));
}

function mergeWeek(oldSessions, plan, weekIndex) {
  const kept = new Set();
  const newTypes = [];
  const counts = { ...plan };
  oldSessions.forEach((session) => {
    if (session.doneOn) counts[session.tipo] = Math.max(counts[session.tipo] || 0, countByType(oldSessions.filter((item) => item.doneOn))[session.tipo]);
  });

  Object.entries(counts).forEach(([tipo, count]) => {
    const ofType = oldSessions.filter((session) => session.tipo === tipo);
    const prioritized = [...ofType.filter((session) => session.doneOn), ...ofType.filter((session) => !session.doneOn)];
    prioritized.slice(0, count).forEach((session) => kept.add(session.id));
    for (let i = ofType.length; i < count; i++) newTypes.push(tipo);
  });

  const usedNumbers = oldSessions.map((session) => Number(session.id.split('_s')[1]));
  let nextNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 0;
  return [
    ...oldSessions.filter((session) => kept.has(session.id)),
    ...newTypes.map((tipo) => ({ id: `w${weekIndex}_s${nextNumber++}`, tipo, routineId: null, doneOn: null })),
  ];
}

// Aplica los cambios conservando las sesiones hechas y las rutinas ya elegidas.
// Las sesiones nuevas siguen la rotación desde la última rutina anterior de su tipo.
export function updateProgram(program, draft, startKey, routines) {
  const lastDoneWeek = program.weeks.reduce(
    (last, week, index) => (week.sessions.some((session) => session.doneOn) ? index : last),
    -1
  );
  const weekCount = Math.max(draft.semanas.length, lastDoneWeek + 1);
  const nextIndexByType = {};

  const weeks = Array.from({ length: weekCount }, (_, weekIndex) => {
    const merged = mergeWeek(program.weeks[weekIndex]?.sessions || [], draft.semanas[weekIndex]?.plan || {}, weekIndex);
    return {
      sessions: merged.map((session) => {
        const options = routines.filter((routine) => routine.tipo === session.tipo);
        const nextIndex = nextIndexByType[session.tipo] || 0;
        const currentIndex = options.findIndex((routine) => routine.id === session.routineId);
        if (session.routineId && currentIndex >= 0) {
          nextIndexByType[session.tipo] = currentIndex + 1;
          return session;
        }
        if (session.routineId || options.length === 0) return session;
        nextIndexByType[session.tipo] = nextIndex + 1;
        return { ...session, routineId: options[nextIndex % options.length].id };
      }),
    };
  });

  return {
    ...program,
    titulo: draft.titulo.trim(),
    descripcion: (draft.descripcion || '').trim(),
    startDate: startKey,
    weeks,
  };
}

export function getCurrentWeekIndex(program, today = dateKey()) {
  const elapsedDays = Math.round((keyToUtc(today) - keyToUtc(program.startDate)) / DAY_MS);
  return Math.floor(elapsedDays / 7);
}

export function getProgramStatus(program, today = dateKey()) {
  const weekIndex = getCurrentWeekIndex(program, today);
  if (weekIndex < 0) return 'upcoming';
  if (weekIndex >= program.weeks.length) return 'finished';
  return 'active';
}

export function getWeekRange(program, weekIndex) {
  const start = addDays(program.startDate, weekIndex * 7);
  return { start, end: addDays(start, 6) };
}

export function countDone(sessions) {
  return sessions.filter((session) => session.doneOn).length;
}

export function getProgress(program) {
  const sessions = program.weeks.flatMap((week) => week.sessions);
  return { done: countDone(sessions), total: sessions.length };
}

// Sesiones que vienen: las pendientes de esta semana o, si no quedan, las de la
// siguiente semana con sesiones. Las sesiones no tienen día: startsOn indica desde cuándo se pueden hacer.
export function getUpcomingSessions(program, today = dateKey()) {
  const status = getProgramStatus(program, today);
  if (status === 'finished') return null;

  const currentWeek = Math.max(getCurrentWeekIndex(program, today), 0);
  if (status === 'active') {
    const pending = program.weeks[currentWeek].sessions.filter((session) => !session.doneOn);
    if (pending.length > 0) {
      return { weekIndex: currentWeek, isCurrentWeek: true, startsOn: null, sessions: pending };
    }
  }

  const firstWeek = status === 'upcoming' ? 0 : currentWeek + 1;
  for (let weekIndex = firstWeek; weekIndex < program.weeks.length; weekIndex++) {
    const { sessions } = program.weeks[weekIndex];
    if (sessions.length > 0) {
      return { weekIndex, isCurrentWeek: false, startsOn: getWeekRange(program, weekIndex).start, sessions };
    }
  }
  return null;
}

export function findSession(program, sessionId) {
  return program?.weeks.flatMap((week) => week.sessions).find((session) => session.id === sessionId) || null;
}

function updateSession(program, sessionId, changes) {
  return {
    ...program,
    weeks: program.weeks.map((week) => ({
      ...week,
      sessions: week.sessions.map((session) =>
        session.id === sessionId ? { ...session, ...changes } : session
      ),
    })),
  };
}

export const setSessionRoutine = (program, sessionId, routineId) =>
  updateSession(program, sessionId, { routineId });

export const markSessionDone = (program, sessionId, doneOn) =>
  updateSession(program, sessionId, { doneOn });

export const markSessionPending = (program, sessionId) =>
  updateSession(program, sessionId, { doneOn: null });

export function hasSessionDoneOn(program, key) {
  return program.weeks.some((week) => week.sessions.some((session) => session.doneOn === key));
}
