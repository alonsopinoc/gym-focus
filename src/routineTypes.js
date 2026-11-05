import { Dumbbell, Zap, HeartPulse, Star, Repeat, Weight, Target } from 'lucide-react';

export const ROUTINE_TYPES = {
  F:        { label: 'Fuerza',      badge: 'bg-blue-500',    border: 'border-blue-500',    icon: Dumbbell   },
  F_BASICOS:{ label: 'Básicos F',   badge: 'bg-sky-400',     border: 'border-sky-400',     icon: Star       },
  HIBRIDA:  { label: 'Híbrido',     badge: 'bg-purple-500',  border: 'border-purple-500',  icon: Repeat     },
  M:        { label: 'Metabólico',  badge: 'bg-red-500',     border: 'border-red-500',     icon: Zap        },
  AM:       { label: 'Activación',  badge: 'bg-emerald-500', border: 'border-emerald-500', icon: HeartPulse },
  RM:       { label: 'Resistencia', badge: 'bg-orange-500',  border: 'border-orange-500',  icon: HeartPulse },
  K:        { label: 'Kettlebell',  badge: 'bg-amber-500',   border: 'border-amber-500',   icon: Weight     },
  B:        { label: 'Básico',      badge: 'bg-teal-500',    border: 'border-teal-500',    icon: Target     },
};
