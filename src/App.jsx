import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { auth, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { loadInitialData, saveUserData, saveGlobalContent, StaleContentError, saveUserProfile } from './userData';
import { Dashboard } from './components/Dashboard';
import { WorkoutView } from './components/WorkoutView';
import { CalendarView } from './components/CalendarView';
import { NavBar } from './components/NavBar';
import { SideBar } from './components/SideBar';
import { EditRoutineView } from './components/EditRoutineView';
import { ProgressView } from './components/ProgressView';
import { BodyMetricsView } from './components/BodyMetricsView';
import { DashboardView } from './components/DashboardView';
import { WodTimerView } from './components/WodTimerView';
import { ProgramView } from './components/ProgramView';
import { buildProgram, dateKey, findSession, hasSessionDoneOn, markSessionDone, markSessionPending, setSessionRoutine, updateProgram } from './program';
import { toggleSeries } from './circuit';
import { normalizeRoutines } from './routineData';
import { createSaveQueue } from './saveQueue';
import { LoginPage } from './LoginPage';
import initialRoutines from './data/rutinas_data.json';
import { AdminUsersView } from './components/AdminUsersView';
import { ExerciseLibraryManagerView } from './components/ExerciseLibraryManagerView';
import { StudentDetailView } from './components/StudentDetailView';
import initialLibrary from './data/ejercicios_library.json';
import { TimerProvider } from './TimerProvider.jsx';
import { FloatingTimerWidget } from './components/FloatingTimerWidget';
import { WatchImportView } from './components/WatchImportView';
import { workoutId } from './watchImport';

// Componentes Wrapper para manejar la obtención de la rutina desde la URL.
// Viven fuera de AppContent para que React conserve su estado entre renders.
function WorkoutViewWrapper({ routines, program, onBack, onFinishSession, ...props }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const routine = routines.find(r => r.id === id);
  const sessionId = location.state?.programSessionId;
  const session = findSession(program, sessionId);
  const canFinishSession = session && !session.doneOn && session.routineId === id;

  if (!routine) {
    return <div className="p-6 text-sm text-muted">Rutina no encontrada.</div>;
  }

  return (
    <WorkoutView
      routine={routine}
      onBack={sessionId ? () => navigate('/programa') : onBack}
      onFinishSession={canFinishSession ? () => onFinishSession(sessionId) : undefined}
      {...props}
    />
  );
}

function EditRoutineViewWrapper({ routines, ...props }) {
  const { id } = useParams();
  const routine = routines.find(r => r.id === id);
  return <EditRoutineView routine={routine} {...props} />;
}

function AppContent({ user }) {
  // Calculamos el rol síncronamente desde el email para no bloquear el render
  const adminEmails = ['alonso.pinoo@gmail.com'];
  const isAdminEmail = user?.email ? adminEmails.includes(user.email.toLowerCase().trim()) : false;

  // --- ESTADOS DE LA APLICACIÓN ---
  const [routines, setRoutines] = useState(initialRoutines);
  const [scheduledRoutines, setScheduledRoutines] = useState({});
  const [completedExercises, setCompletedExercises] = useState({});
  const [bodyMetrics, setBodyMetrics] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [completedDays, setCompletedDays] = useState({});
  const [program, setProgram] = useState(null);
  const [circuitProgress, setCircuitProgress] = useState({});
  const [workoutMetrics, setWorkoutMetrics] = useState({}); // Apple Watch, por id de entrenamiento
  const [userRole, setUserRole] = useState(isAdminEmail ? 'admin' : 'user'); // Rol conocido síncronamente

  const [exerciseLibrary, setExerciseLibrary] = useState(initialLibrary);

  // Solo se guarda después de cargar lo que hay en Firestore: guardar antes reemplazaría
  // los datos reales con el estado vacío inicial. Si la carga falla, no se guarda nada.
  const dataLoaded = React.useRef(false);
  const [loadedAt, setLoadedAt] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  // Rutinas y librería globales: versión que tiene este dispositivo (ver saveGlobalContent)
  // y la última lista que llegó del servidor, para no volver a guardarla tal cual.
  const contentVersion = React.useRef({ routines: 0, exerciseLibrary: 0 });
  const serverContent = React.useRef({});
  const contentSaving = React.useRef({});
  const [staleNotice, setStaleNotice] = useState(false);

  // --- MANEJO DE AUTENTICACIÓN Y DATOS ---
  // AppContent solo se monta con sesión iniciada: al cerrar sesión se desmonta y su estado se descarta.
  useEffect(() => {
    if (!user) return;
    dataLoaded.current = false;
    let cancelled = false;
    let retryTimer = null;
    let attempt = 0;

    // Si Firestore no logra conectarse ("client is offline") y no hay copia local,
    // la carga falla: se reintenta con espera creciente y al recuperar la red.
    const scheduleRetry = () => {
      clearTimeout(retryTimer);
      retryTimer = setTimeout(load, Math.min(2000 * 2 ** attempt, 30000));
      attempt += 1;
    };
    const retryNow = () => { if (!dataLoaded.current) { attempt = 0; scheduleRetry(); } };

    const load = () => loadInitialData(user.uid).then(({ userData, library, globalRoutines }) => {
      if (cancelled) return;
      setLoadFailed(false);
      contentVersion.current = { routines: globalRoutines.version, exerciseLibrary: library.version };
      // Rutinas: admin usa las globales si existen, usuarios normales usan las suyas
      const loadedRoutines = normalizeRoutines(isAdminEmail
        ? globalRoutines.list || initialRoutines
        : globalRoutines.list || userData?.routines || initialRoutines);
      serverContent.current = { routines: loadedRoutines, exerciseLibrary: library.list };
      setRoutines(loadedRoutines);
      setScheduledRoutines(userData?.scheduledRoutines || {});
      setCompletedExercises(userData?.completedExercises || {});
      setBodyMetrics(userData?.bodyMetrics || []);
      setCompletedDays(userData?.completedDays || {});
      setExerciseLogs(userData?.exerciseLogs || {});
      setProgram(userData?.program || null);
      setCircuitProgress(userData?.circuitProgress || {});
      setWorkoutMetrics(userData?.workoutMetrics || {});
      if (!isAdminEmail) setUserRole(userData?.role || 'user');
      if (library.list) setExerciseLibrary(library.list);
      setLoadedAt(Date.now());

      // Guardar perfil ligero para la lista de admin (fuera del render crítico)
      const totalDays      = Object.keys(userData?.completedDays || {}).length;
      const totalExercises = Object.values(userData?.completedExercises || {}).flat().length;
      const lastWeight     = userData?.bodyMetrics?.slice(-1)[0]?.weight ?? null;
      saveUserProfile(
        user.uid,
        { displayName: user.displayName, email: user.email, photoURL: user.photoURL, role: isAdminEmail ? 'admin' : (userData?.role || 'user') },
        { totalDays, totalExercises, lastWeight }
      );
    }).catch(err => {
      if (cancelled) return;
      console.error("Error cargando datos:", err);
      setLoadFailed(true);
      scheduleRetry();
    });

    load();
    window.addEventListener('online', retryNow);
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      window.removeEventListener('online', retryNow);
    };
  }, [user, isAdminEmail]);

  // --- EFECTOS PARA GUARDAR DATOS EN FIRESTORE ---

  // Ver saveQueue.js: agrupa los guardados y no los pierde si la app se cierra antes.
  const [saveQueue] = useState(() => createSaveQueue(`gymfocus_sin_guardar_${user.uid}`));
  const scheduleSave = saveQueue.schedule;

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveQueue.flush();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', saveQueue.flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', saveQueue.flush);
    };
  }, [saveQueue]);

  const useDebouncedSave = (dataKey, data, delay = 2000) => {
    useEffect(() => {
      if (!user || !dataLoaded.current) return;
      scheduleSave(dataKey, data, () => saveUserData(user.uid, dataKey, data), delay);
    }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  };

  useDebouncedSave('scheduledRoutines', scheduledRoutines);
  useDebouncedSave('completedExercises', completedExercises);
  useDebouncedSave('bodyMetrics', bodyMetrics);
  useDebouncedSave('completedDays', completedDays);
  useDebouncedSave('exerciseLogs', exerciseLogs);
  useDebouncedSave('program', program);
  useDebouncedSave('circuitProgress', circuitProgress);
  useDebouncedSave('workoutMetrics', workoutMetrics);
  useDebouncedSave('role', userRole);

  // Guarda rutinas o librería globales (solo admin). Los guardados de una misma lista van
  // uno tras otro para que cada uno parta de la versión que dejó el anterior. Si otro
  // dispositivo guardó antes, se adopta lo del servidor y se avisa: el cambio local se pierde,
  // pero nunca se pisa una versión más nueva con una más vieja.
  const scheduleContentSave = (name, list, apply) => {
    if (!user || userRole !== 'admin' || !dataLoaded.current) return;
    if (list === serverContent.current[name]) return;
    const save = () => {
      const previous = contentSaving.current[name] || Promise.resolve();
      const current = previous.catch(() => {})
        .then(() => saveGlobalContent(name, list, contentVersion.current[name]))
        .then((version) => { contentVersion.current[name] = version; }, (err) => {
          if (!(err instanceof StaleContentError)) throw err;
          console.warn(err.message, '— se cargó la versión del servidor');
          contentVersion.current[name] = err.server.version;
          saveQueue.discardUnsaved(name);
          if (err.server.list) {
            const serverList = apply(err.server.list);
            serverContent.current[name] = serverList;
          }
          setStaleNotice(true);
        });
      contentSaving.current[name] = current;
      return current;
    };
    scheduleSave(name, list, save, 3000, () => ({ version: contentVersion.current[name] }));
  };

  useEffect(() => {
    scheduleContentSave('routines', routines, (list) => {
      const normalized = normalizeRoutines(list);
      setRoutines(normalized);
      return normalized;
    });
  }, [routines]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scheduleContentSave('exerciseLibrary', exerciseLibrary, (list) => {
      setExerciseLibrary(list);
      return list;
    });
  }, [exerciseLibrary]); // eslint-disable-line react-hooks/exhaustive-deps

  // Va después de los guardados: en el render que trae lo cargado, esos efectos aún ven
  // dataLoaded=false y no reescriben en Firestore lo que se acaba de leer.
  useEffect(() => {
    if (!loadedAt) return;
    dataLoaded.current = true;

    // Cambios que no alcanzaron a llegar a Firestore la última vez que se cerró la app:
    // se aplican sobre lo cargado, y los efectos de arriba los vuelven a guardar.
    const setters = {
      scheduledRoutines: setScheduledRoutines,
      completedExercises: setCompletedExercises,
      bodyMetrics: setBodyMetrics,
      completedDays: setCompletedDays,
      exerciseLogs: setExerciseLogs,
      program: setProgram,
      circuitProgress: setCircuitProgress,
      workoutMetrics: setWorkoutMetrics,
      ...(userRole === 'admin' && { routines: setRoutines, exerciseLibrary: setExerciseLibrary }),
    };
    Object.entries(saveQueue.readUnsaved()).forEach(([key, { value, meta }]) => {
      // Una copia de rutinas o librería hecha sobre otra versión quedó vieja: se descarta.
      if (key in contentVersion.current && meta?.version !== contentVersion.current[key]) {
        saveQueue.discardUnsaved(key);
        return;
      }
      setters[key]?.(value);
    });
  }, [loadedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useNavigate();

  const handleSelectRoutine = (routine) => {
    // Navegamos a una ruta específica para la rutina
    navigate(`/rutina/${routine.id}`);
  };

  const handleBackToDashboard = () => {
    navigate('/rutinas');
  };

  const handleEditRoutine = (routine) => {
    if (userRole !== 'admin') return; // Protección extra
    navigate(`/rutina/editar/${routine.id}`);
  };

  // Guarda en la librería cualquier ejercicio nuevo que no exista aún
  const autoSaveExercisesToLibrary = (ejercicios) => {
    if (!ejercicios?.length) return;
    setExerciseLibrary(prev => {
      const existingNames = new Set(prev.map(e => e.nombre.toLowerCase().trim()));
      const nuevos = ejercicios
        .filter(ex => ex.nombre?.trim() && !existingNames.has(ex.nombre.toLowerCase().trim()))
        .map(ex => ({ nombre: ex.nombre.trim(), categoria: 'Sin categoría', descripcion: '' }));
      return nuevos.length > 0 ? [...prev, ...nuevos] : prev;
    });
  };

  const handleUpdateRoutine = (updatedRoutine) => {
    if (userRole !== 'admin') return; // Protección extra
    setRoutines(prevRoutines =>
      prevRoutines.map(r =>
        r.id === updatedRoutine.id ? updatedRoutine : r
      )
    );
    autoSaveExercisesToLibrary(updatedRoutine.ejercicios);
    navigate('/rutinas');
  };

  const handleCancelEdit = () => {
    navigate('/rutinas');
  };

  const handleCreateRoutine = (routineData) => {
    if (userRole !== 'admin') return;
    const newRoutine = routineData || { id: `routine_${Date.now()}`, tipo: 'F', titulo: 'Nueva Rutina', descripcion: '', ejercicios: [] };
    if (!newRoutine.id) newRoutine.id = `routine_${Date.now()}`;
    setRoutines(prev => [...prev, newRoutine]);
    autoSaveExercisesToLibrary(newRoutine.ejercicios);
    navigate(`/rutina/editar/${newRoutine.id}`);
  };

  const handleDeleteRoutineById = (routineId) => {
    if (userRole !== 'admin') return; // Protección extra
    setRoutines(prev => prev.filter(r => r.id !== routineId));
    navigate('/rutinas');
  };

  const handleResetRoutines = () => {
    if (userRole !== 'admin') return;
    if (!window.confirm('Esto reemplaza TODAS las rutinas (para todos los alumnos) por las rutinas por defecto del código. ¿Continuar?')) return;
    setRoutines(initialRoutines);
  };

  const handleSaveWorkoutMetrics = (workout) => {
    setWorkoutMetrics(prev => ({ ...prev, [workoutId(workout)]: workout }));
  };

  // --- PROGRAMA SEMANAL ---
  const handleCreateProgram = (draft, startDate) => {
    setProgram(buildProgram(draft, dateKey(startDate), routines));
  };

  const handleUpdateProgram = (draft, startDate) => {
    setProgram(updateProgram(program, draft, dateKey(startDate), routines));
  };

  const handleStartSession = (sessionId) => {
    const session = findSession(program, sessionId);
    if (session?.routineId) {
      navigate(`/rutina/${session.routineId}`, { state: { programSessionId: sessionId } });
    }
  };

  // Registra la sesión en el programa y en el calendario del día en que se hizo.
  const completeSession = (sessionId) => {
    const session = findSession(program, sessionId);
    if (!session?.routineId) return;
    const today = dateKey();
    setProgram(markSessionDone(program, sessionId, today));
    setCompletedDays(prev => ({ ...prev, [today]: true }));
    setScheduledRoutines(prev => ({ ...prev, [today]: session.routineId }));
  };

  const handleFinishSession = (sessionId) => {
    completeSession(sessionId);
    navigate('/programa');
  };

  const handleUndoSession = (sessionId) => {
    const session = findSession(program, sessionId);
    if (!session?.doneOn) return;
    const updatedProgram = markSessionPending(program, sessionId);
    setProgram(updatedProgram);
    if (hasSessionDoneOn(updatedProgram, session.doneOn)) return;

    setCompletedDays(prev => {
      const next = { ...prev };
      delete next[session.doneOn];
      return next;
    });
    setScheduledRoutines(prev => {
      if (prev[session.doneOn] !== session.routineId) return prev;
      const next = { ...prev };
      delete next[session.doneOn];
      return next;
    });
  };

  const handleToggleDayCompletion = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    setCompletedDays(prev => {
      const newCompleted = { ...prev };
      if (newCompleted[dateKey]) {
        delete newCompleted[dateKey];
      } else {
        newCompleted[dateKey] = true;
      }
      return newCompleted;
    });
  };

  const handleAddMetric = (newMetric) => {
    setBodyMetrics(prev => [...prev, newMetric]);
  };

  const handleDeleteMetric = (metricId) => {
    setBodyMetrics(prev => prev.filter(m => m.id !== metricId));
  };

  const handleToggleCircuitRound = (routineId, exerciseId, round) => {
    const today = dateKey();
    setCircuitProgress(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        [routineId]: toggleSeries(prev[today]?.[routineId], exerciseId, round),
      },
    }));
  };

  const handleToggleComplete = (exerciseId) => {
    const today = dateKey();
    setCompletedExercises(prev => {
      const todayCompleted = prev[today] || [];
      const newTodayCompleted = todayCompleted.includes(exerciseId)
        ? todayCompleted.filter(id => id !== exerciseId)
        // Añadimos el ID del ejercicio al array de hoy
        : [...todayCompleted, exerciseId];

      return {
        ...prev,
        [today]: newTodayCompleted,
      };
    });
  };

  const handleLogExercise = (exerciseId, data) => {
    const today = dateKey();
    setExerciseLogs(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        [exerciseId]: { ...prev[today]?.[exerciseId], ...data }
      }
    }));
  };

  const handleScheduleRoutine = (date, routineType) => {
    const dateKey = date.toISOString().split('T')[0];
    setScheduledRoutines(prev => {
      const newSchedules = { ...prev, [dateKey]: routineType };
      return newSchedules;
    });
  };

  const handleDeleteRoutine = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    setScheduledRoutines(prev => {
      const newScheduledRoutines = { ...prev };
      delete newScheduledRoutines[dateKey];
      return newScheduledRoutines;
    });
  };

  return (
    <div className="flex h-screen bg-bg text-text">
      {staleNotice && (
        <div role="alert" className="fixed top-[env(safe-area-inset-top)] inset-x-0 z-[80] bg-amber-500 text-white text-sm font-semibold px-4 py-2 flex items-center justify-center gap-3">
          <span className="text-center">Las rutinas o la librería cambiaron en otro dispositivo: se cargó la versión más nueva y tu último cambio no se guardó.</span>
          <button onClick={() => setStaleNotice(false)} aria-label="Cerrar aviso" className="shrink-0 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30">✕</button>
        </div>
      )}
      {loadFailed && (
        <div role="alert" className="fixed top-[env(safe-area-inset-top)] inset-x-0 z-[80] bg-danger text-white text-sm font-semibold text-center px-4 py-2">
          Sin conexión con el servidor: tus datos no se cargaron y los cambios no se guardarán. Reintentando…
        </div>
      )}
      {/* SideBar para escritorio */}
      <div className="hidden md:flex">
        <SideBar user={user} role={userRole} timerState={{ isActive: false }} onLogout={logout} />
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 overflow-y-auto main-scroll-area md:ml-3">
        <Routes>
          <Route path="/" element={<DashboardView routines={routines} scheduledRoutines={scheduledRoutines} completedExercises={completedExercises} bodyMetrics={bodyMetrics} completedDays={completedDays} program={program} user={user} onLogout={logout} />} />
          <Route path="/programa" element={<ProgramView program={program} routines={routines} onCreate={handleCreateProgram} onUpdate={handleUpdateProgram} onDelete={() => setProgram(null)} onStartSession={handleStartSession} onSelectRoutine={(sessionId, routineId) => setProgram(setSessionRoutine(program, sessionId, routineId))} onMarkDone={completeSession} onUndo={handleUndoSession} />} />
          <Route path="/planificacion" element={<Navigate to="/planificacion/calendario" replace />} />
          <Route path="/planificacion/calendario" element={<CalendarView routines={routines} scheduledRoutines={scheduledRoutines} onScheduleRoutine={handleScheduleRoutine} onDeleteRoutine={handleDeleteRoutine} completedDays={completedDays} onToggleDayCompletion={handleToggleDayCompletion} program={program} />} />
          <Route path="/planificacion/programas" element={<Navigate to="/programa" replace />} />
          
          {/* Dashboard: Solo pasamos funciones de edición si es admin */}
          <Route path="/rutinas" element={<Dashboard routines={routines} exerciseLibrary={exerciseLibrary} onSelectRoutine={handleSelectRoutine} onEditRoutine={userRole === 'admin' ? handleEditRoutine : undefined} onCreateRoutine={userRole === 'admin' ? handleCreateRoutine : undefined} onResetRoutines={userRole === 'admin' ? handleResetRoutines : undefined} />} />
          
          <Route path="/rutina/:id" element={<WorkoutViewWrapper routines={routines} program={program} onFinishSession={handleFinishSession} circuitProgress={circuitProgress} onToggleCircuitRound={handleToggleCircuitRound} onBack={handleBackToDashboard} completedExercises={completedExercises} onToggleComplete={handleToggleComplete} exerciseLogs={exerciseLogs} onLogExercise={handleLogExercise} workoutMetrics={workoutMetrics} />} />
          
          {/* Ruta de Edición: Protegida a nivel de Router */}
          <Route path="/rutina/editar/:id" element={userRole === 'admin' ? <EditRoutineViewWrapper routines={routines} exerciseLibrary={exerciseLibrary} onSave={handleUpdateRoutine} onCancel={handleCancelEdit} onDelete={handleDeleteRoutineById} /> :<Navigate to="/rutinas" />} />
          
          <Route path="/progreso" element={<ProgressView routines={routines} completedExercises={completedExercises} completedDays={completedDays} workoutMetrics={workoutMetrics} />} />
          <Route path="/metricas" element={<BodyMetricsView metrics={bodyMetrics} onAddMetric={handleAddMetric} onDeleteMetric={handleDeleteMetric} />} />
          <Route path="/timer" element={<WodTimerView />} />
          <Route path="/importar" element={<WatchImportView routines={routines} scheduledRoutines={scheduledRoutines} program={program} completedExercises={completedExercises} workoutMetrics={workoutMetrics} isDataLoaded={loadedAt > 0} onSave={handleSaveWorkoutMetrics} />} />
          <Route path="/admin" element={userRole === 'admin' ? <AdminUsersView /> : <Navigate to="/" />} />
          <Route path="/admin/alumno/:uid" element={userRole === 'admin' ? <StudentDetailView routines={routines} /> : <Navigate to="/" />} />
          <Route path="/libreria" element={userRole === 'admin' ? <ExerciseLibraryManagerView library={exerciseLibrary} onUpdateLibrary={setExerciseLibrary} routines={routines} /> : <Navigate to="/" />} />
        </Routes>
      </div>

      {/* NavBar para móvil */}
      <NavBar role={userRole} />

      {/* Widget flotante del WOD Timer — visible al minimizar mientras se navega */}
      <FloatingTimerWidget />
    </div>
  );
}

export default function App() {
  // auth.currentUser es síncrono: si el usuario ya inició sesión antes,
  // su token está en localStorage y está disponible de inmediato.
  const [user, setUser] = useState(auth.currentUser);
  const [authChecked, setAuthChecked] = useState(!!auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Solo mostramos pantalla de carga si NO hay usuario cacheado y aún no se verificó
  if (!authChecked) {
    return <div className="flex items-center justify-center h-screen bg-bg text-text">Cargando...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <TimerProvider>
      <AppContent user={user} />
    </TimerProvider>
  );
}