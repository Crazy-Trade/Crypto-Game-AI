import React from 'react';
import { GameStats, GridSlot, InfrastructureModule, LanguageCode, ModuleType } from '../types';
import { Cpu, Shield, Zap, Server, Lock, Database, Info } from 'lucide-react';

interface InfrastructureProps {
  grid: GridSlot[];
  stats: GameStats;
  language: LanguageCode;
  onPurchase: (slotId: number, moduleType: ModuleType) => void;
  onRemove: (slotId: number) => void;
}

const AVAILABLE_MODULES: Record<ModuleType, Omit<InfrastructureModule, 'id'>> = {
  miner: {
    type: 'miner',
    name: 'ASIC Miner X1',
    cost: 1500,
    maintenance: 100,
    description: 'Generates funds via PoW.',
    statsEffect: { funds: 500, decentralization: -2 }
  },
  validator: {
    type: 'validator',
    name: 'Validator Node',
    cost: 2000,
    maintenance: 50,
    description: 'Secures transactions.',
    statsEffect: { security: 5, decentralization: 2 }
  },
  rpc: {
    type: 'rpc',
    name: 'RPC Cluster',
    cost: 3000,
    maintenance: 200,
    description: 'Boosts network speed.',
    statsEffect: { hype: 4, techLevel: 2 }
  },
  firewall: {
    type: 'firewall',
    name: 'Quantum Firewall',
    cost: 5000,
    maintenance: 300,
    description: 'Hardened security layer.',
    statsEffect: { security: 10 }
  }
};

const getModuleIcon = (type: ModuleType) => {
  switch (type) {
    case 'miner': return <Cpu className="text-yellow-400" size={24} />;
    case 'validator': return <Database className="text-blue-400" size={24} />;
    case 'rpc': return <Zap className="text-purple-400" size={24} />;
    case 'firewall': return <Lock className="text-red-400" size={24} />;
    default: return <Server size={24} />;
  }
};

const Infrastructure: React.FC<InfrastructureProps> = ({ grid, stats, language, onPurchase, onRemove }) => {
  const [draggedType, setDraggedType] = React.useState<ModuleType | null>(null);

  const handleDragStart = (e: React.DragEvent, type: ModuleType) => {
    setDraggedType(type);
    e.dataTransfer.setData('moduleType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent, slotId: number) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('moduleType') as ModuleType;
    if (type) {
      onPurchase(slotId, type);
    }
    setDraggedType(null);
  };

  const getText = (key: string) => {
    const texts: any = {
      'shop': { en: 'Hardware Shop', fa: 'فروشگاه سخت‌افزار', ru: 'Магазин', zh: '硬件商店' },
      'server_room': { en: 'Server Rack', fa: 'رک سرور', ru: 'Серверная', zh: '服务器机架' },
      'funds': { en: 'Available Funds:', fa: 'بودجه موجود:', ru: 'Средства:', zh: '可用资金:' },
      'cost': { en: 'Cost:', fa: 'هزینه:', ru: 'Цена:', zh: '成本:' },
      'effect': { en: 'Effect:', fa: 'تاثیر:', ru: 'Эффект:', zh: '效果:' },
    };
    return texts[key][language] || texts[key]['en'];
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-4 animate-fade-in">
      {/* Sidebar / Shop */}
      <div className="w-full md:w-1/3 bg-crypto-panel border border-gray-800 rounded-xl p-4 flex flex-col overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Server size={20} className="text-crypto-accent" />
          {getText('shop')}
        </h2>
        
        <div className="mb-4 text-sm font-mono text-green-400">
          {getText('funds')} ${stats.funds.toLocaleString()}
        </div>

        <div className="space-y-3">
          {(Object.keys(AVAILABLE_MODULES) as ModuleType[]).map((key) => {
            const module = AVAILABLE_MODULES[key];
            const canAfford = stats.funds >= module.cost;
            return (
              <div 
                key={key}
                draggable={canAfford}
                onDragStart={(e) => canAfford && handleDragStart(e, key)}
                className={`p-3 border rounded-lg transition-all ${
                  canAfford 
                    ? 'bg-gray-900 border-gray-700 hover:border-crypto-accent cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-crypto-accent/10' 
                    : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    {getModuleIcon(key)}
                    {module.name}
                  </div>
                  <span className="text-xs font-mono text-yellow-500">${module.cost}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{module.description}</p>
                <div className="text-xs font-mono text-crypto-dim">
                  {getText('effect')} {JSON.stringify(module.statsEffect).replace(/["{}]/g, '').replace(/,/g, ', ')}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-auto pt-4 text-xs text-gray-600 text-center">
          Drag modules to the server rack to install.
        </div>
      </div>

      {/* Grid / Server Room */}
      <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex flex-col relative overflow-hidden">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 z-0 opacity-10" 
             style={{ 
               backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`, 
               backgroundSize: '20px 20px' 
             }}>
        </div>

        <h2 className="text-lg font-bold text-white mb-4 relative z-10 flex items-center justify-between">
            <span className="flex items-center gap-2"><Cpu size={20} className="text-blue-400"/> {getText('server_room')}</span>
            <span className="text-xs font-mono text-gray-500 bg-black/50 px-2 py-1 rounded">CAPACITY: {grid.filter(s => s.module).length}/12</span>
        </h2>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 relative z-10 h-full">
          {grid.map((slot) => (
            <div
              key={slot.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, slot.id)}
              className={`relative border-2 border-dashed rounded-lg flex items-center justify-center transition-all aspect-square ${
                slot.module 
                  ? 'bg-gray-800 border-solid border-gray-600' 
                  : 'border-gray-800 hover:border-gray-600 bg-black/20'
              } ${draggedType && !slot.module ? 'animate-pulse border-crypto-accent/50 bg-crypto-accent/5' : ''}`}
            >
              {slot.module ? (
                <div className="flex flex-col items-center text-center p-2 w-full h-full justify-center group">
                  <div className="mb-2 animate-bounce-small">{getModuleIcon(slot.module.type)}</div>
                  <span className="text-[10px] md:text-xs font-bold text-gray-300 leading-tight">{slot.module.name}</span>
                  
                  {/* Remove Button Overlay */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <button 
                      onClick={() => onRemove(slot.id)}
                      className="text-red-500 text-xs font-bold border border-red-500 px-2 py-1 rounded hover:bg-red-500 hover:text-white transition-colors"
                    >
                      UNPLUG
                    </button>
                  </div>
                </div>
              ) : (
                <span className="text-gray-700 text-xs font-mono">SLOT {slot.id + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Infrastructure;
