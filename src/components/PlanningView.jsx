import { NavLink, Outlet } from 'react-router-dom';

export function PlanningView() {
  const activeTab = "border-b-2 border-primary text-white";
  const inactiveTab = "text-muted";

  return (
    <div>
      <div className="px-4 md:px-8 border-b border-neutral-700">
        <nav className="flex gap-4">
          <NavLink to="/planificacion/calendario" className={({isActive}) => `py-3 font-semibold ${isActive ? activeTab : inactiveTab}`}>Calendario</NavLink>
          <NavLink to="/planificacion/programas" className={({isActive}) => `py-3 font-semibold ${isActive ? activeTab : inactiveTab}`}>Programas</NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}