import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center p-8 text-slate-400 animate-in fade-in zoom-in duration-300">
    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
    <p className="text-sm font-medium tracking-wide">{text}</p>
  </div>
);