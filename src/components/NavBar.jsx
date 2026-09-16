import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Dumbbell, Timer, Shield, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { to: '/',                       end: true, icon: LayoutDashboard, label: 'Inicio'    },
  { to: '/planificacion/calendario',           icon: Calendar,        label: 'Plan'      },
  { to: '/rutinas',                            icon: Dumbbell,        label: 'Rutinas'   },
  { to: '/progreso',                           icon: BarChart3,       label: 'Progreso'  },
  { to: '/timer',                              icon: Timer,           label: 'Timer'     },
];

export function NavBar({ role }) {
  const items = role === 'admin'
    ? [...NAV_ITEMS, { to: '/admin', icon: Shield, label: 'Admin' }]
    : NAV_ITEMS;

  return (
    <nav className={clsx(
      "md:hidden fixed bottom-0 left-0 right-0 z-[60]",
      "bg-surface/95 backdrop-blur-md border-t border-border",
      // safe-area-inset-bottom para iPhone con home indicator
      "pb-[env(safe-area-inset-bottom)]",
    )}>
      <div className="flex justify-around">
        {items.map(({ to, end, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => clsx(
              "relative flex flex-col items-center gap-1 pt-2.5 pb-1 px-3 min-w-0 flex-1 transition-colors active:scale-90 active:opacity-70",
              isActive ? "text-primary" : "text-muted"
            )}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-0.5 w-6 bg-primary rounded-full" />}
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={clsx("text-[10px] font-semibold", isActive ? "text-primary" : "text-muted")}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
