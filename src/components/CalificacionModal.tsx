import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { Pedido, Usuario } from '../types';

interface CalificacionModalProps {
  pedido: Pedido;
  usuarioActual: Usuario;
  usuarioACalificar: {
    id: string;
    nombre: string;
    role: 'cliente' | 'delivery';
  };
  onClose: () => void;
  onCalificar: (puntuacion: number, comentario: string) => Promise<void>;
}

export const CalificacionModal: React.FC<CalificacionModalProps> = ({
  pedido,
  usuarioActual,
  usuarioACalificar,
  onClose,
  onCalificar
}) => {
  const [puntuacion, setPuntuacion] = useState<number>(5);
  const [comentario, setComentario] = useState('');
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onCalificar(puntuacion, comentario);
      onClose();
    } catch (error) {
      console.error('Error al calificar:', error);
      alert('Error al enviar la calificación. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => {
      const isFilled = (hoveredStar !== null ? star <= hoveredStar : star <= puntuacion);
      
      return (
        <button
          key={star}
          type="button"
          onClick={() => setPuntuacion(star)}
          onMouseEnter={() => setHoveredStar(star)}
          onMouseLeave={() => setHoveredStar(null)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            size={40}
            className={isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        </button>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Calificar {usuarioACalificar.role === 'delivery' ? 'Delivery' : 'Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 text-center">
          <p className="text-lg text-gray-700 mb-2">
            ¿Cómo fue tu experiencia con <span className="font-semibold">{usuarioACalificar.nombre}</span>?
          </p>
          <p className="text-sm text-gray-500">
            Pedido: {pedido.origen} → {pedido.destino}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="flex justify-center gap-2 mb-2">
              {renderStars()}
            </div>
            <p className="text-center text-sm text-gray-600">
              {puntuacion === 1 && 'Muy malo'}
              {puntuacion === 2 && 'Malo'}
              {puntuacion === 3 && 'Regular'}
              {puntuacion === 4 && 'Bueno'}
              {puntuacion === 5 && 'Excelente'}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comentario.length}/500 caracteres
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Calificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};