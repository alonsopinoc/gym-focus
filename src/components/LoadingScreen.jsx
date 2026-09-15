export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center z-50">
      <h1 className="text-3xl font-extrabold tracking-tight">
        Gym<span className="text-primary">Focus</span>
      </h1>
      <div className="mt-6 w-48 h-1 bg-surface2 rounded-full overflow-hidden relative">
        <div className="absolute top-0 left-0 h-full w-1/3 bg-primary rounded-full animate-[shimmer_1.2s_infinite_linear]" />
      </div>
      <style>{`
        @keyframes shimmer {
          0%   { left: -35%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
