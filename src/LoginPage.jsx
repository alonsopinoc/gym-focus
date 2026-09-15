import { useState } from 'react';
import { signInWithGoogle } from './firebase';

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// Barra con placas — motivo decorativo que referencia una barra cargada
const PlateBar = () => (
  <div className="flex items-center gap-1.5" aria-hidden="true">
    <div className="w-2 h-10 bg-text/20 rounded-[1px]" />
    <div className="w-3 h-8 bg-primary rounded-[1px]" />
    <div className="w-2 h-6 bg-text/20 rounded-[1px]" />
    <div className="flex-1 h-1.5 bg-text/20 rounded-full max-w-[7rem]" />
    <div className="w-2 h-6 bg-text/20 rounded-[1px]" />
    <div className="w-3 h-8 bg-primary rounded-[1px]" />
    <div className="w-2 h-10 bg-text/20 rounded-[1px]" />
  </div>
);

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('No se pudo iniciar sesión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-bg">

      {/* Panel izquierdo — solo desktop */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-graphite text-chalk p-12 relative overflow-hidden"
        style={{ backgroundColor: '#181A1F', color: '#EDEFF2' }}>
        <div>
          <h1 className="font-display text-4xl tracking-tight uppercase">
            Gym<span style={{ color: '#60A5FA' }}>Focus</span>
          </h1>
        </div>

        <div className="space-y-10">
          <PlateBar />
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 max-w-md">
            {[
              { n: '01', label: 'Rutinas',      desc: 'Fuerza, metabólico y activación' },
              { n: '02', label: 'Progreso',     desc: 'Historial y métricas corporales' },
              { n: '03', label: 'Planificación',desc: 'Calendario y programas semanales' },
              { n: '04', label: 'WOD Timer',    desc: 'AMRAP, intervalos y Tabata' },
            ].map(({ n, label, desc }) => (
              <div key={label} className="border-l-2 pl-3" style={{ borderColor: '#60A5FA' }}>
                <p className="font-display-num text-lg leading-none opacity-50">{n}</p>
                <p className="font-semibold mt-1">{label}</p>
                <p className="text-sm opacity-60 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs opacity-40">© {new Date().getFullYear()} GymFocus</p>
      </div>

      {/* Panel derecho / pantalla completa mobile */}
      <div className="flex flex-col items-center justify-center flex-1 px-6"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

        {/* Logo mobile */}
        <div className="md:hidden mb-10 text-center">
          <h1 className="font-display text-5xl tracking-tight uppercase">
            Gym<span className="text-primary">Focus</span>
          </h1>
          <p className="text-muted text-sm mt-2">Tu entrenamiento, organizado.</p>
        </div>

        {/* Card login */}
        <div className="w-full max-w-sm space-y-6">
          <div className="hidden md:block">
            <h2 className="font-display text-3xl">Bienvenido</h2>
            <p className="text-muted text-sm mt-1">Inicia sesión para continuar.</p>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-surface border border-border hover:border-primary active:scale-[0.98] text-text font-semibold py-3.5 px-6 rounded-md transition-all disabled:opacity-60">
            {loading ? (
              <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
          </button>

          {error && (
            <p className="text-center text-xs text-danger">{error}</p>
          )}

          <p className="text-center text-xs text-muted leading-relaxed">
            Al continuar aceptas el uso de tus datos para<br />gestionar tu entrenamiento.
          </p>
        </div>
      </div>
    </div>
  );
}
