import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  suffix?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, suffix, className = '', ...props }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="mb-1 text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          className={`w-full bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-md py-2 px-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-2 text-slate-500 text-sm">{suffix}</span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
