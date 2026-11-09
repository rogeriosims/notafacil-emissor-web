import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, type, title, message, duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: <CheckCircle size={20} className="text-green-600" />,
    error: <AlertCircle size={20} className="text-red-600" />,
    warning: <AlertTriangle size={20} className="text-amber-600" />,
    info: <Info size={20} className="text-blue-600" />,
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm w-full animate-in slide-in-from-right-full transition-all mb-3 ${styles[type]}`}>
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold">{title}</h4>
        {message && <p className="text-xs mt-1 opacity-90">{message}</p>}
      </div>
      <button onClick={() => onClose(id)} className="text-current opacity-50 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
};