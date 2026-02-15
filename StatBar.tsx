import React from 'react';
import { GameStats } from './types';
import { MAX_STATS } from './constants';
import { Activity, Users, Award, Calendar } from 'lucide-react';

interface StatBarProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

const StatItem: React.FC<StatBarProps> = ({ label, value, color, icon }) => {
  // Safe clamp for display width
  const width = Math.min(Math.max(value, 0), MAX_STATS);
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1 text-sm font-medium text-slate-700">
        <div className="flex items-center gap-2">
            {icon}
            <span>{label}</span>
        </div>
        <span>{value}/{MAX_STATS}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
        <div
          className={`h-3 rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${width}%` }}
        ></div>
      </div>
    </div>
  );
};

interface StatsDisplayProps {
  stats: GameStats;
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-600 rounded-sm"></span>
            내 정보
        </h2>
        <div className="flex items-center gap-1 text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
            <Calendar size={16} />
            <span>Day {stats.day}</span>
        </div>
      </div>
      
      <StatItem 
        label="스트레스 (Stress)" 
        value={stats.stress} 
        color={stats.stress > 80 ? "bg-red-500" : stats.stress > 50 ? "bg-orange-400" : "bg-green-500"}
        icon={<Activity size={16} className="text-red-500"/>}
      />
      <StatItem 
        label="평판 (Reputation)" 
        value={stats.reputation} 
        color="bg-blue-500" 
        icon={<Users size={16} className="text-blue-500"/>}
      />
      <StatItem 
        label="업무 성과 (Work)" 
        value={stats.performance} 
        color="bg-purple-500"
        icon={<Award size={16} className="text-purple-500"/>}
      />
    </div>
  );
};
