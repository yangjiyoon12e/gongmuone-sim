import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface GameLogProps {
  logs: LogEntry[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-900 text-slate-200 p-4 rounded-xl shadow-inner h-64 md:h-full overflow-y-auto font-mono text-sm border-2 border-slate-700 flex flex-col">
      <div className="mb-2 text-slate-500 border-b border-slate-700 pb-1">System Log...</div>
      <div className="flex-1 space-y-3">
        {logs.map((log) => (
          <div key={log.id} className={`p-2 rounded ${
            log.type === 'scenario' ? 'bg-slate-800 text-yellow-300' :
            log.type === 'action' ? 'bg-slate-800/50 text-cyan-300 text-right' :
            log.type === 'outcome' ? 'text-green-300' :
            'text-slate-400 italic'
          }`}>
            <span className="text-xs opacity-50 mr-2">[DAY {log.day}]</span>
            {log.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
