import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const PageHeader = ({ title, showBackButton = true }) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center mb-6">
      {showBackButton && (
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-surface hover:bg-surface2 mr-4">
          <ArrowLeft size={24} />
        </button>
      )}
      <h1 className="font-display text-2xl md:text-3xl">{title}</h1>
    </header>
  );
};