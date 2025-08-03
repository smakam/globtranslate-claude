import React from 'react';
import { Check, X, Info } from 'lucide-react';
import { Toast } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check size={20} className="text-green-600" />;
      case 'error':
        return <X size={20} className="text-red-600" />;
      case 'info':
      default:
        return <Info size={20} className="text-blue-600" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'info':
      default:
        return 'border-blue-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center space-x-3 px-4 py-3 bg-white rounded-lg shadow-lg border-l-4 ${getBorderColor(toast.type)} transform transition-all duration-300 ease-out animate-in slide-in-from-right`}
        >
          {getIcon(toast.type)}
          <span className="text-gray-800 font-medium">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;