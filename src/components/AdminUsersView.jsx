import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToUserProfiles, saveUserProfile } from '../userData';
import { Shield, User, RefreshCw, ChevronRight, BarChart3, Scale, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

const MASTER_ADMIN_EMAIL = 'alonso.pinoo@gmail.com';

export function AdminUsersView() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate  = useNavigate();

  useEffect(() => {
    // onSnapshot sirve desde caché local inmediatamente, luego actualiza desde red
    const unsub = subscribeToUserProfiles((profiles) => {
      setUsers(profiles);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRoleChange = async (e, u) => {
    e.stopPropagation();
    if (u.email?.toLowerCase() === MASTER_ADMIN_EMAIL) return; // protegido
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await saveUserProfile(u.uid, { ...u, role: newRole }, u.stats || {});
      setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, role: newRole } : x));
    } catch (err) {
      console.error('Error actualizando rol:', err);
    }
  };

  const isMaster = (u) => u.email?.toLowerCase() === MASTER_ADMIN_EMAIL;

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-4 md:px-6 pt-5 pb-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Alumnos</h1>
            <p className="text-xs text-muted mt-0.5">
              {loading ? 'Cargando...' : `${users.length} usuarios registrados`}
            </p>
          </div>
          {/* Sin botón de recarga manual — onSnapshot actualiza automáticamente */}
          {loading && (
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading && users.length === 0 ? (
          /* Skeleton mientras no hay ni caché */
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-surface2 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted gap-3">
            <User size={36} className="opacity-20" />
            <p className="text-sm">Sin usuarios registrados</p>
            <p className="text-xs text-center opacity-60">Los usuarios aparecerán aquí después de su primer inicio de sesión.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map(u => {
              const totalDays  = u.stats?.totalDays      ?? 0;
              const totalEx    = u.stats?.totalExercises ?? 0;
              const lastWeight = u.stats?.lastWeight;
              const master     = isMaster(u);

              return (
                <div key={u.uid}
                  onClick={() => navigate(`/admin/alumno/${u.uid}`)}
                  className="flex items-center gap-4 bg-surface border border-border rounded-lg px-4 py-3.5 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group">

                  {/* Avatar */}
                  {u.photoURL ? (
                    <img src={u.photoURL} alt=""
                      className="w-10 h-10 rounded-full border-2 border-border shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User size={16} className="text-primary" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{u.displayName || 'Sin nombre'}</p>
                      {master && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex items-center gap-1 shrink-0">
                          <Shield size={9} /> Maestro
                        </span>
                      )}
                      {!master && (
                        <span className={clsx(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                          u.role === 'admin'
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                            : "bg-surface2 text-muted"
                        )}>
                          {u.role === 'admin' ? 'admin' : 'alumno'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted truncate">{u.email}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1 text-[11px] text-muted">
                        <Calendar size={11} />
                        <span>{totalDays} días</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted">
                        <BarChart3 size={11} />
                        <span>{totalEx} ejercicios</span>
                      </div>
                      {lastWeight && (
                        <div className="flex items-center gap-1 text-[11px] text-muted">
                          <Scale size={11} />
                          <span>{lastWeight} kg</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acción rol — oculta para el maestro */}
                  {!master ? (
                    <button
                      onClick={(e) => handleRoleChange(e, u)}
                      className={clsx(
                        "shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors",
                        u.role === 'admin'
                          ? "border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-900/20"
                          : "border-border text-muted hover:border-primary hover:text-primary"
                      )}>
                      {u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                    </button>
                  ) : (
                    <div className="shrink-0 w-[82px]" /> /* placeholder para alinear */
                  )}

                  <ChevronRight size={16} className="text-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
