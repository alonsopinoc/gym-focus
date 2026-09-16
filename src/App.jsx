import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, NavLink, Outlet, Navigate } from 'react-router-dom';
import { auth, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { loadInitialData, saveUserData, saveGlobalRoutines, saveGlobalLibrary, saveUserProfile } from './userData';
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
import { ProgramCreator } from './components/ProgramCreator';
import { LoginPage } from './LoginPage';
import initialRoutines from './data/rutinas_data.json';
import { AdminUsersView } from './components/AdminUsersView';
import { ExerciseLibraryManagerView } from './components/ExerciseLibraryManagerView';
import { StudentDetailView } from './components/StudentDetailView';
import initialLibrary from './data/ejercicios_library.json';
import { TimerProvider } from './TimerContext.jsx';
import { FloatingTimerWidget } from './components/FloatingTimerWidget';

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
  const [userRole, setUserRole] = useState(isAdminEmail ? 'admin' : 'user'); // Rol conocido síncronamente

  const [exerciseLibrary, setExerciseLibrary] = useState(initialLibrary);
  const [selectedRoutine, setSelectedRoutine] = useState(null);

  // --- MANEJO DE AUTENTICACIÓN Y DATOS ---
  useEffect(() => {
    if (!user) {
      setRoutines(initialRoutines);
      setScheduledRoutines({});
      setCompletedExercises({});
      setBodyMetrics([]);
      setCompletedDays({});
      setExerciseLogs({});
      setUserRole('user');
      return;
    }

    // Carga paralela: userData + librería global al mismo tiempo
    loadInitialData(user.uid).then(({ userData, library, globalRoutines }) => {
      // Rutinas: admin usa las globales si existen, usuarios normales usan las suyas
      if (isAdminEmail) {
        setRoutines(globalRoutines || initialRoutines);
      } else {
        setRoutines(globalRoutines || userData?.routines || initialRoutines);
      }
      setScheduledRoutines(userData?.scheduledRoutines || {});
      setCompletedExercises(userData?.completedExercises || {});
      setBodyMetrics(userData?.bodyMetrics || []);
      setCompletedDays(userData?.completedDays || {});
      if (!isAdminEmail) setUserRole(userData?.role || 'user');
      if (library) setExerciseLibrary(library);

      // Guardar perfil ligero para la lista de admin (fuera del render crítico)
      const totalDays      = Object.keys(userData?.completedDays || {}).length;
      const totalExercises = Object.values(userData?.completedExercises || {}).flat().length;
      const lastWeight     = userData?.bodyMetrics?.slice(-1)[0]?.weight ?? null;
      saveUserProfile(
        user.uid,
        { displayName: user.displayName, email: user.email, photoURL: user.photoURL, role: isAdminEmail ? 'admin' : (userData?.role || 'user') },
        { totalDays, totalExercises, lastWeight }
      );
    }).catch(err => console.error("Error cargando datos:", err));
  }, [user]);

  // --- EFECTOS PARA GUARDAR DATOS EN FIRESTORE ---
  // Usa useRef para detectar si ya se cargaron los datos (evita guardar en el primer render)
  const dataLoaded = React.useRef(false);
  useEffect(() => { if (user) dataLoaded.current = false; }, [user]);

  const useDebouncedSave = (dataKey, data, delay = 2000) => {
    useEffect(() => {
      if (!user || !dataLoaded.current) return;
      const handler = setTimeout(() => {
        saveUserData(user.uid, dataKey, data);
      }, delay);
      return () => clearTimeout(handler);
    }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  };

  // Marcamos datos como cargados después del efecto de carga
  useEffect(() => {
    if (user) {
      const t = setTimeout(() => { dataLoaded.current = true; }, 3000);
      return () => clearTimeout(t);
    }
  }, [user]);

  useDebouncedSave('scheduledRoutines', scheduledRoutines);
  useDebouncedSave('completedExercises', completedExercises);
  useDebouncedSave('bodyMetrics', bodyMetrics);
  useDebouncedSave('completedDays', completedDays);
  useDebouncedSave('exerciseLogs', exerciseLogs);
  useDebouncedSave('role', userRole);

  // Guardar rutinas globales SOLO si es admin (debounce largo — cambian poco)
  useEffect(() => {
    if (!user || userRole !== 'admin' || !dataLoaded.current) return;
    const handler = setTimeout(() => { saveGlobalRoutines(routines); }, 3000);
    return () => clearTimeout(handler);
  }, [routines]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guardar librería global SOLO si es admin
  useEffect(() => {
    if (!user || userRole !== 'admin' || !dataLoaded.current) return;
    const handler = setTimeout(() => { saveGlobalLibrary(exerciseLibrary); }, 3000);
    return () => clearTimeout(handler);
  }, [exerciseLibrary]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useNavigate();

  const handleSelectRoutine = (routine) => {
    setSelectedRoutine(routine);
    // Navegamos a una ruta específica para la rutina
    navigate(`/rutina/${routine.id}`);
  };

  const handleBackToDashboard = () => {
    setSelectedRoutine(null);
    navigate('/rutinas');
  };

  const handleEditRoutine = (routine) => {
    if (userRole !== 'admin') return; // Protección extra
    setSelectedRoutine(routine);
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

  const handleApplyProgram = (program, startDate, startDayOfWeek) => {
    const newScheduledRoutines = {};
    let currentDate = new Date(startDate);

    program.semanas.forEach(weekData => {
      // Ajustar la fecha de inicio de la semana al día seleccionado (ej. Lunes)
      while (currentDate.getDay() !== startDayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Crear una lista de todas las rutinas a agendar en la semana
      const weekRoutineQueue = [];
      Object.entries(weekData.plan).forEach(([type, count]) => {
        const availableRoutines = routines.filter(r => r.tipo === type);
        if (availableRoutines.length === 0) return;
        for (let i = 0; i < count; i++) {
          // Ciclamos a través de las rutinas disponibles para no repetir siempre la misma
          weekRoutineQueue.push(availableRoutines[i % availableRoutines.length]);
        }
      });

      // Para cada tipo de rutina en el plan de la semana...
      weekRoutineQueue.forEach(routineToSchedule => {
        // Saltar fines de semana
        if (currentDate.getDay() === 0) currentDate.setDate(currentDate.getDate() + 1); // Si es Domingo, salta a Lunes
        if (currentDate.getDay() === 6) currentDate.setDate(currentDate.getDate() + 2); // Si es Sábado, salta a Lunes
        
        const dateKey = currentDate.toISOString().split('T')[0];
        newScheduledRoutines[dateKey] = routineToSchedule.id;
        currentDate.setDate(currentDate.getDate() + 1);
      });
    });

    setScheduledRoutines(prev => ({ ...prev, ...newScheduledRoutines }));
    navigate('/'); // Volver al calendario para ver el resultado
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

  const handleToggleComplete = (exerciseId) => {
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
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

  // Componentes Wrapper para manejar la obtención de la rutina desde la URL
  const WorkoutViewWrapper = () => {
    const { id } = useParams();
    const routine = routines.find(r => r.id === id);
    return (
      <WorkoutView 
        routine={routine} 
        onBack={handleBackToDashboard} 
        completedExercises={completedExercises} 
        onToggleComplete={handleToggleComplete}
        exerciseLogs={exerciseLogs}
        onLogExercise={handleLogExercise}
      />
    );
  };

  const EditRoutineViewWrapper = () => {
    const { id } = useParams();
    const routine = routines.find(r => r.id === id);
    return <EditRoutineView routine={routine} exerciseLibrary={exerciseLibrary} onSave={handleUpdateRoutine} onCancel={handleCancelEdit} onDelete={handleDeleteRoutineById} />;
  };

  // Componente Layout para la sección de Planificación
  const PlanningLayout = () => {
    const activeTab = "border-b-2 border-primary text-primary text-text";
    const inactiveTab = "text-muted";
    return (
      <div>
        <div className="px-4 md:px-8 border-b border-border">
          <nav className="flex gap-4">
            <NavLink to="/planificacion/calendario" className={({isActive}) => `py-3 font-semibold ${isActive ? activeTab : inactiveTab}`}>Calendario</NavLink>
            <NavLink to="/planificacion/programas" className={({isActive}) => `py-3 font-semibold ${isActive ? activeTab : inactiveTab}`}>Programas</NavLink>
          </nav>
        </div>
        <Outlet />
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-bg text-text">
      {/* SideBar para escritorio */}
      <div className="hidden md:flex">
        <SideBar user={user} role={userRole} timerState={{ isActive: false }} onLogout={logout} />
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 overflow-y-auto main-scroll-area md:ml-3">
        <Routes>
          <Route path="/" element={<DashboardView routines={routines} scheduledRoutines={scheduledRoutines} completedExercises={completedExercises} bodyMetrics={bodyMetrics} completedDays={completedDays} user={user} onLogout={logout} />} />
          <Route path="/planificacion" element={<PlanningLayout />}>
            <Route index element={<Navigate to="calendario" />} />
            <Route path="calendario" element={<CalendarView routines={routines} scheduledRoutines={scheduledRoutines} onScheduleRoutine={handleScheduleRoutine} onDeleteRoutine={handleDeleteRoutine} completedDays={completedDays} onToggleDayCompletion={handleToggleDayCompletion} />} />
            <Route path="programas" element={<ProgramCreator onApplyProgram={handleApplyProgram} />} />
          </Route>
          
          {/* Dashboard: Solo pasamos funciones de edición si es admin */}
          <Route path="/rutinas" element={<Dashboard routines={routines} exerciseLibrary={exerciseLibrary} onSelectRoutine={handleSelectRoutine} onEditRoutine={userRole === 'admin' ? handleEditRoutine : undefined} onCreateRoutine={userRole === 'admin' ? handleCreateRoutine : undefined} onResetRoutines={userRole === 'admin' ? handleResetRoutines : undefined} />} />
          
          <Route path="/rutina/:id" element={<WorkoutViewWrapper />} />
          
          {/* Ruta de Edición: Protegida a nivel de Router */}
          <Route path="/rutina/editar/:id" element={userRole === 'admin' ? <EditRoutineViewWrapper /> : <Navigate to="/rutinas" />} />
          
          <Route path="/progreso" element={<ProgressView routines={routines} completedExercises={completedExercises} completedDays={completedDays} />} />
          <Route path="/metricas" element={<BodyMetricsView metrics={bodyMetrics} onAddMetric={handleAddMetric} onDeleteMetric={handleDeleteMetric} />} />
          <Route path="/timer" element={<WodTimerView />} />
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