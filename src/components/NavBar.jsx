import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Dumbbell, Timer, Shield, BarChart3, MoreHorizontal, Calendar, Scale, BookOpen, X } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { to: '/',                       end: true, icon: LayoutDashboard, label: 'Inicio'    },
  { to: '/programa',                           icon: ClipboardList,   label: 'Programa'  },
  { to: '/rutinas',                            icon: Dumbbell,        label: 'Rutinas'   },
  { to: '/progreso',                           icon: BarChart3,       label: 'Progreso'  },
  { to: '/timer',                              icon: Timer,           label: 'Timer'     },
];

// Secciones que no caben en la barra: se abren desde "Más".
const MORE_ITEMS = [
  { to: '/planificacion/calendario', icon: Calendar, label: 'Calendario' },
  { to: '/metricas',                 icon: Scale,    label: 'Métricas'   },
];
const ADMIN_MORE_ITEMS = [
  { to: '/libreria', icon: BookOpen, label: 'Librería' },
  { to: '/admin',    icon: Shield,   label: 'Admin'    },
];

const itemClass = (isActive) => clsx(
  "relative flex flex-col items-center gap-1 pt-2.5 pb-1 px-3 min-w-0 flex-1 transition-colors active:scale-90 active:opacity-70",
  isActive ? "text-primary" : "text-muted"
);

const ItemContent = ({ icon: Icon, label, isActive }) => (
  <>
    {isActive && <span className="absolute top-0 h-0.5 w-6 bg-primary rounded-full" />}
    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
    <span className={clsx("text-[10px] font-semibold", isActive ? "text-primary" : "text-muted")}>
      {label}
    </span>
  </>
);

export function NavBar({ role }) {
  const [showMore, setShowMore] = useState(false);
  const { pathname } = useLocation();
  const moreItems = role === 'admin' ? [...MORE_ITEMS, ...ADMIN_MORE_ITEMS] : MORE_ITEMS;
  const isMoreActive = moreItems.some(({ to }) => pathname === to || pathname.startsWith(`${to}/`));

  return (
    <>
      <nav className={clsx(
        "md:hidden fixed bottom-0 left-0 right-0 z-[60]",
        "bg-surface/95 backdrop-blur-md border-t border-border",
        // safe-area-inset-bottom para iPhone con home indicator
        "pb-[env(safe-area-inset-bottom)]",
      )}>
        <div className="flex justify-around">
          {NAV_ITEMS.map(({ to, end, icon, label }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => itemClass(isActive)}>
              {({ isActive }) => <ItemContent icon={icon} label={label} isActive={isActive} />}
            </NavLink>
          ))}
          <button type="button" onClick={() => setShowMore(true)} aria-haspopup="dialog" aria-expanded={showMore}
            className={itemClass(isMoreActive)}>
            <ItemContent icon={MoreHorizontal} label="Más" isActive={isMoreActive} />
          </button>
        </div>
      </nav>

      {showMore && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-[70] flex items-end"
          onClick={e => e.target === e.currentTarget && setShowMore(false)}>
          <div role="dialog" aria-label="Más secciones"
            className="bg-surface w-full rounded-t-3xl border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between px-2 pb-2">
              <p className="font-bold">Más</p>
              <button onClick={() => setShowMore(false)} aria-label="Cerrar"
                className="p-2 rounded-full text-muted hover:bg-surface2 hover:text-text">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} onClick={() => setShowMore(false)}
                  className={({ isActive }) => clsx(
                    "flex items-center gap-3 rounded-xl px-4 py-3.5 font-semibold text-sm transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "bg-surface2 text-text active:opacity-70"
                  )}>
                  <Icon size={20} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
