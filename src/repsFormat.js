// Las repeticiones se guardan como texto ("10 reps", "30 segundos", "Máximas"). En el
// editor se separan en tipo y cantidad; un texto especial queda como cantidad de
// repeticiones, sin perderse, hasta que se cambie.

export const MAX_REPS = 'Máximas';

export const REPS_TYPES = [
  { id: 'reps',  label: 'Repeticiones', quantities: ['5', '8', '10', '12', '15', '20', '25', '30', '50', '100'], initial: '10 reps' },
  { id: 'time',  label: 'Tiempo',       quantities: ['20 segundos', '30 segundos', '45 segundos', '1 min', '2 min', '5 min'], initial: '30 segundos' },
  { id: 'max',   label: 'Máximo' },
];

const REPS_PATTERN = /^(\d+(?:-\d+)?\+?)(?:\s*reps?)?(\s+por lado)?$/i;
const TIME_PATTERN = /^\d+(?:[.,-]\d+)?\s*(?:s|seg|segundos?|min|minutos?)\b/i;

export function parseReps(value) {
  const text = String(value ?? '').trim();
  if (!text) return { type: 'reps', quantity: '' };
  if (text.toLowerCase() === MAX_REPS.toLowerCase()) return { type: 'max', quantity: '' };
  const reps = text.match(REPS_PATTERN);
  if (reps) return { type: 'reps', quantity: `${reps[1]}${reps[2] || ''}` };
  if (TIME_PATTERN.test(text)) return { type: 'time', quantity: text };
  return { type: 'reps', quantity: text };
}

// Convierte la cantidad elegida o escrita en el texto que se guarda.
export function formatQuantity(type, quantity) {
  const text = String(quantity ?? '').trim();
  if (!text) return '';
  if (type === 'reps' && /^\d+(?:-\d+)?\+?$/.test(text)) return `${text} reps`;
  if (type === 'time' && /^\d+$/.test(text)) return `${text} segundos`;
  return text;
}
