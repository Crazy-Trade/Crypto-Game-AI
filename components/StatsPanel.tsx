import React from 'react';
import { GameStats } from '../types';
import { TrendingUp, Users, Shield, Zap, Cpu, Globe } from 'lucide-react';

interface StatsPanelProps {
  stats: GameStats;
}

const StatItem = ({ icon: Icon, label, value, max = 100, isCurrency = false, color = "text-crypto-accent" }: any) => (
  <div className="flex flex-col bg-crypto-panel border border-gray-800 p-3 rounded-lg relative overflow-hidden group">
    <div className="flex items-center justify-between mb-2 z-10 relative">
      <span className="text-gray-400 text-xs uppercase tracking-wider font-bold">{label}</span>
      <Icon size={16} className={color} />
    </div>
    <div className="text-xl font-mono font-bold z-10 relative text-white">
      {isCurrency ? `$${value.toLocaleString()}` : value.toLocaleString()}
      {!isCurrency && <span className="text-xs text-gray-500 ml-1">/ {max}</span>}
    </div>
    
    {/* Progress Bar Background */}
    {!isCurrency && (
      <div className="absolute bottom-0 left-0 h-1 bg-gray-800 w-full">
        <div 
          className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-700 ease-out`} 
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        />
      </div>
    )}
  </div>
);

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full mb-6">
      <StatItem 
        icon={TrendingUp} 
        label="Funds" 
        value={stats.funds} 
        isCurrency 
        color="text-green-400" 
      />
      <StatItem 
        icon={Users} 
        label="Users" 
        value={stats.users} 
        isCurrency={false} // Treat as raw number
        max={1000000} // Soft cap for bar visualization
        color="text-blue-400"
      />
      <StatItem 
        icon={Shield} 
        label="Security" 
        value={stats.security} 
        color="text-red-400"
      />
      <StatItem 
        icon={Zap} 
        label="Hype" 
        value={stats.hype} 
        color="text-yellow-400"
      />
      <StatItem 
        icon={Cpu} 
        label="Tech" 
        value={stats.techLevel} 
        color="text-purple-400"
      />
      <StatItem 
        icon={Globe} 
        label="Decentralization" 
        value={stats.decentralization} 
        color="text-teal-400"
      />
    </div>
  );
};

export default StatsPanel;