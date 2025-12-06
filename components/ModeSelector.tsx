import React from 'react';
import { AppMode } from '../types';
import { SparkleIcon, ImageIcon, BrainIcon, BoltIcon } from './Icons';

interface Props {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const ModeSelector: React.FC<Props> = ({ currentMode, onModeChange }) => {
  const modes = [
    { id: AppMode.Chat, label: 'Chat', icon: SparkleIcon },
    { id: AppMode.GenerateImage, label: 'Create', icon: ImageIcon },
    { id: AppMode.EditImage, label: 'Edit', icon: SparkleIcon }, // Reusing Sparkle for "magic" edit
    { id: AppMode.Analyze, label: 'Analyze', icon: BrainIcon },
  ];

  return (
    <div className="flex justify-center py-4">
      <div className="flex bg-slate-900/50 backdrop-blur-md rounded-full p-1 border border-slate-700/50">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;