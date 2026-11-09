import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, description, action, onClick }) => {
  return (
    <div 
      className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}
      onClick={onClick}
    >
      {(title || description || action) && (
        <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                    {title && <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>}
                    {description && <p className="text-sm text-slate-500">{description}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>
        </div>
      )}
      <div className="p-6 pt-2">{children}</div>
    </div>
  );
};