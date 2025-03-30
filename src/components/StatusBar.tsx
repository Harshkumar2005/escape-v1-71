
import React from 'react';

type StatusBarProps = {
  projectName: string;
  terminal: string;
  time: string;
  language: string;
};

const StatusBar: React.FC<StatusBarProps> = ({ projectName, terminal, time, language }) => {
  return (
    <div className="flex items-center justify-between px-2 py-1 bg-status-bar text-slate-400 text-xs">
      <div className="flex items-center space-x-4">
        <span>{projectName} — {terminal}</span>
      </div>
      <div className="flex items-center space-x-4">
        <span>{time}</span>
        <span>{language}</span>
      </div>
    </div>
  );
};

export default StatusBar;
