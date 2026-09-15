import { useState } from 'react';
import Calendar from 'react-calendar';
import { Layers, X } from 'lucide-react';
import programs from '../data/programs_data.json';

export function ProgramsView({ onApplyProgram }) {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [startDate, setStartDate] = useState(new Date());

  const handleApplyClick = () => {
    if (window.confirm(`¿Quieres aplicar el programa "${selectedProgram.titulo}" comenzando el ${startDate.toLocaleDateString()}? Esto sobreescribirá cualquier rutina agendada en esas fechas.`)) {
      onApplyProgram(selectedProgram, startDate);
      setSelectedProgram(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-extrabold text-white mb-6">Programas de Entrenamiento</h1>
      <div className="space-y-4">
        {programs.map(program => (
          <div key={program.id} className="bg-surface2 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-white">{program.titulo}</h3>
            <p className="text-muted text-sm mt-1">{program.descripcion}</p>
            <button
              onClick={() => setSelectedProgram(program)}
              className="mt-4 inline-flex items-center gap-2 bg-primary-hover hover:bg-primary text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              <Layers size={16} />
              Aplicar Programa
            </button>
          </div>
        ))}
      </div>

      {/* Modal para seleccionar fecha de inicio */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface2 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Seleccionar Inicio</h2>
              <button onClick={() => setSelectedProgram(null)}><X className="text-muted" /></button>
            </div>
            <p className="text-neutral-300 mb-4">Elige la fecha en que comenzará el programa "{selectedProgram.titulo}".</p>
            <div className="flex justify-center mb-4">
              <Calendar
                onChange={setStartDate}
                value={startDate}
                locale="es-ES"
              />
            </div>
            <button onClick={handleApplyClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
              Confirmar y Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}