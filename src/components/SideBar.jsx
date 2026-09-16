import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Dumbbell, BarChart3, Scale, Timer,
  LogOut, User, Shield, BookOpen, Sun, Moon, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useTheme } from '../../ThemeContext.jsx';
import { clsx } from 'clsx';

const NAV_GROUPS = [
  {
    label: 'Entrenar',
    items: [
      { to: '/',        end: true, icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/rutinas',            icon: Dumbbell,        label: 'Rutinas'   },
      { to: '/timer',              icon: Timer,           label: 'WOD Timer' },
    ],
  },
  {
    label: 'Planificar',
    items: [
      { to: '/planificacion/calendario', icon: Calendar,  label: 'Planificación' },
      { to: '/progreso',                 icon: BarChart3, label: 'Progreso'      },
      { to: '/metricas',                 icon: Scale,     label: 'Métricas'      },
    ],
  },
];

const ADMIN_GROUP = {
  label: 'Admin',
  items: [
    { to: '/libreria', icon: BookOpen, label: 'Librería' },
    { to: '/admin',    icon: Shield,   label: 'Admin'    },
  ],
};

function NavItem({ to, end, icon: Icon, label, collapsed }) {
  return (
    <NavLink key={to} to={to} end={end} title={collapsed ? label : undefined}
      className={({ isActive }) => clsx(
        'relative flex items-center h-9 rounded-lg text-sm font-medium transition-all duration-150',
        collapsed ? 'justify-center px-0 mx-2' : 'gap-2.5 px-3 mx-1 hover:translate-x-0.5',
        isActive
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-muted hover:text-text hover:bg-surface2'
      )}>
      {({ isActive }) => (
        <>
          <Icon size={16} className={clsx(isActive && 'text-primary')} />
          {!collapsed && <span className="flex-1">{label}</span>}
          {isActive && (
            <span className={clsx(
              'absolute top-1/2 -translate-y-1/2 h-5 w-1 rounded-l-full bg-primary',
              collapsed ? '-right-2' : '-right-1'
            )} />
          )}
        </>
      )}
    </NavLink>
  );
}

export function SideBar({ user, role, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === '1');

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const groups = role === 'admin' ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;

  return (
    <aside className={clsx(
      'my-3 ml-3 h-[calc(100vh-1.5rem)] bg-surface flex flex-col border border-border rounded-xl shadow-sm transition-all duration-200 relative z-[60]',
      collapsed ? 'w-[4.5rem]' : 'w-64'
    )}>

      {/* Logo */}
      <div className={clsx(
        'border-b border-border shrink-0 flex items-center',
        collapsed ? 'justify-center py-4 px-2' : 'justify-between py-4 px-4'
      )}>
        {collapsed ? (
          <span className="font-display text-xl text-primary">GF</span>
        ) : (
          <h1 className="font-display text-2xl tracking-tight uppercase">
            Gym<span className="text-primary">Focus</span>
          </h1>
        )}
      </div>

      {/* Botón colapsar — anclado al borde derecho */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        className="absolute -right-3 top-14 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-primary hover:border-primary transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Nav principal */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-3">
        {groups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <div className="border-t border-border mx-4 mb-3" />}
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted/60 px-4 pb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItem key={item.to} {...item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border pt-2">

        {/* Usuario */}
        {user && (
          <div className={clsx(
            'flex items-center mb-1 rounded-lg',
            collapsed ? 'justify-center mx-2 py-2' : 'gap-3 px-4 py-2'
          )}>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName}
                className="w-8 h-8 rounded-full border-2 border-border shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User size={14} className="text-primary" />
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName || 'Usuario'}</p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className={clsx('pb-3 space-y-0.5', collapsed ? 'px-2' : 'px-1')}>
          <button onClick={toggleTheme} title={collapsed ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}
            className={clsx(
              'w-full flex items-center h-9 rounded-lg text-sm font-medium text-muted hover:text-text hover:bg-surface2 transition-all',
              collapsed ? 'justify-center px-0' : 'gap-2.5 px-3'
            )}>
            <span className="relative h-4 w-4 shrink-0">
              <Sun className={clsx('absolute inset-0 h-4 w-4 transition-all duration-300', theme === 'dark' ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100')} />
              <Moon className={clsx('absolute inset-0 h-4 w-4 transition-all duration-300', theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0')} />
            </span>
            {!collapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>}
          </button>
          <button onClick={onLogout} title={collapsed ? 'Cerrar sesión' : undefined}
            className={clsx(
              'w-full flex items-center h-9 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-all',
              collapsed ? 'justify-center px-0' : 'gap-2.5 px-3'
            )}>
            <LogOut size={16} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
