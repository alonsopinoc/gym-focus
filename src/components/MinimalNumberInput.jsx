import { Minus, Plus } from 'lucide-react';

export function MinimalNumberInput({ value, onChange, placeholder, min = -Infinity, max = Infinity }) {
  const handleIncrement = () => {
    const numericValue = Number(value) || 0;
    if (numericValue < max) {
      onChange({ target: { value: numericValue + 1 } });
    }
  };

  const handleDecrement = () => {
    const numericValue = Number(value) || 0;
    if (numericValue > min) {
      onChange({ target: { value: numericValue - 1 } });
    }
  };

  // Simula el objeto 'event' para que el 'onChange' funcione igual que un input normal
  const handleChange = (e) => {
    onChange({ target: { value: e.target.value } });
  }

  return (
    <div className="flex items-center justify-center bg-surface2 rounded-md border border-border border-transparent">
      <button onClick={handleDecrement} disabled={value <= min} className="p-2 text-muted hover:text-text hover:text-text disabled:opacity-30 transition-colors">
        <Minus size={16} />
      </button>
      <input
        type="number"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full text-center bg-transparent font-semibold focus:outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button onClick={handleIncrement} disabled={value >= max} className="p-2 text-muted hover:text-text hover:text-text disabled:opacity-30 transition-colors">
        <Plus size={16} />
      </button>
    </div>
  );
}