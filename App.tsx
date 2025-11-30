import React, { useState, useEffect } from 'react';
import { GameState, GameEvent, GameStats, GameSettings, LanguageCode, GridSlot, ModuleType, InfrastructureModule } from './types';
import { initializeGame, processTurn, restoreSession } from './services/geminiService';
import StatsPanel from './components/StatsPanel';
import Terminal from './components/Terminal';
import Infrastructure from './components/Infrastructure';
import { Terminal as IconTerminal, Hexagon, Save, Globe, Play, RotateCcw, Server, Activity, Trash2, CheckCircle2, Key, User, Heart } from 'lucide-react';

const INITIAL_STATS: GameStats = {
  funds: 10000,
  users: 1,
  security: 50,
  hype: 10,
  techLevel: 10,
  decentralization: 0,
  era: 1
};

const INITIAL_GRID: GridSlot[] = Array(12).fill(null).map((_, i) => ({ id: i, module: null }));

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

const STORAGE_KEY = 'crypto_genesis_save_v2';
const API_KEY_STORAGE = 'crypto_genesis_api_key';
const DEFAULT_API_KEY = ""; 

const App: React.FC = () => {
  // Debug log to check if React is mounting
  console.log("🚀 App Component is Rendering...");

  // Setup State
  const [setupMode, setSetupMode] = useState(true);
  const [viewMode, setViewMode] = useState<'terminal' | 'infra'>('terminal');
  const [userApiKey, setUserApiKey] = useState('');
  const [settings, setSettings] = useState<GameSettings>({
    projectName: '',
    ticker: '',
    founderName: '',
    language: 'fa'
  });

  const [gameState, setGameState] = useState<GameState>({
    isStarted: false,
    isLoading: false,
    turnCount: 0,
    settings: { projectName: 'Bitcoin', ticker: 'BTC', founderName: 'Satoshi', language: 'en' },
    stats: INITIAL_STATS,
    history: [],
    gameOver: false,
    gameWon: false,
    infrastructure: INITIAL_GRID
  });

  const [saveFound, setSaveFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [news, setNews] = useState<string>("Welcome to CryptoGenesis. Market is stable.");

  useEffect(() => {
      const savedKey = localStorage.getItem(API_KEY_STORAGE);
      if (savedKey) setUserApiKey(savedKey);
      
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSaveFound(true);
  }, []);

  // Save game automatically on state change
  useEffect(() => {
    if (gameState.isStarted && !gameState.isLoading && gameState.history.length > 0) {
      setIsSaving(true);
      const saveData = {
        ...gameState,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
       
      // Visual feedback delay
      const timer = setTimeout(() => setIsSaving(false), 800);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Simulate News Ticker
  useEffect(() => {
    if (!gameState.isStarted) return;
    const items = [
      `${settings.ticker} volume spikes by 20%`,
      "SEC Chairman comments on crypto regulations...",
      "New vulnerability found in Solidity...",
      "Institutional investors watching closely...",
      "Miners migrating to renewable energy..."
    ];
    const interval = setInterval(() => {
      setNews(items[Math.floor(Math.random() * items.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, [gameState.isStarted, settings.ticker]);

  // Dynamic Font Class
  const getFontClass = () => {
    switch (settings.language) {
      case 'fa': return 'font-persian';
      case 'zh': return 'font-chinese';
      case 'ru': return 'font-russian';
      default: return 'font-sans';
    }
  };

  const saveApiKey = (key: string) => {
      setUserApiKey(key);
      localStorage.setItem(API_KEY_STORAGE, key);
  }

  const handleDeleteSave = () => {
    if (confirm("Are you sure you want to delete your progress? This cannot be undone.")) {
      localStorage.removeItem(STORAGE_KEY);
      setSaveFound(false);
    }
  };

  const getEffectiveApiKey = () => {
      return userApiKey || DEFAULT_API_KEY || '';
  }

  const handleLoadGame = async () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const effectiveKey = getEffectiveApiKey();

    if (!saved) return;
    if (!effectiveKey) {
        alert("Please enter a Google Gemini API Key first.");
        return;
    }
    
    try {
      setSetupMode(false);
      const parsed: GameState = JSON.parse(saved);
      // Ensure infra exists if loading old save
      if (!parsed.infrastructure) parsed.infrastructure = INITIAL_GRID;
      
      setSettings(parsed.settings);
      setGameState({ ...parsed, isLoading: true });
      
      const summary = parsed.history.slice(-5).map(h => h.narrative).join(" ");
      
      // Pass full context to AI
      await restoreSession(effectiveKey, parsed.settings, summary, parsed.stats, parsed.infrastructure);
      
      setGameState(prev => ({ ...prev, isLoading: false }));
    } catch (e) {
      console.error("Failed to load save", e);
      alert("Save file corrupted or API Key invalid. Starting fresh.");
      localStorage.removeItem(STORAGE_KEY);
      setSaveFound(false);
      setSetupMode(true);
    }
  };

  const handleStartGame = async (eraOverride?: number, keepStats?: boolean) => {
    if (!settings.projectName || !settings.ticker || !settings.founderName) return;
    
    const effectiveKey = getEffectiveApiKey();

    if (!effectiveKey) {
        alert("API Key is required to connect to the blockchain simulation.");
        return;
    }
    
    setSetupMode(false);
    
    const startingStats = keepStats ? {
      ...gameState.stats,
      era: (eraOverride || 1),
      hype: 50,
      users: Math.floor(gameState.stats.users * 0.1),
      funds: gameState.stats.funds,
      security: 50,
      techLevel: 20
    } : { ...INITIAL_STATS, era: eraOverride || 1 };

    setGameState(prev => ({ 
      ...prev, 
      isStarted: true, 
      isLoading: true,
      stats: startingStats,
      settings: settings,
      history: keepStats ? prev.history : [],
      gameOver: false,
      gameWon: false,
      infrastructure: keepStats ? prev.infrastructure : INITIAL_GRID
    }));
    
    try {
      const response = await initializeGame(effectiveKey, settings, startingStats.era);
      
      const newEvent: GameEvent = {
        id: `turn-${startingStats.era}-init-${Date.now()}`,
        turn: 0,
        narrative: response.narrative,
        choices: response.choices,
        type: 'narrative'
      };

      setGameState(prev => ({
        ...prev,
        isLoading: false,
        history: [...(keepStats ? prev.history : []), newEvent],
        stats: {
           ...startingStats,
           funds: startingStats.funds + (response.stats_update.funds_change || 0),
        }
      }));
    } catch (error) {
      console.error(error);
      setGameState(prev => ({ 
          ...prev, 
          isLoading: false, 
          history: [...prev.history, { 
            id: 'error-init', 
            turn: 0, 
            narrative: "Error initializing game engine. Check API Key validity.", 
            type: 'alert' 
          }] 
      }));
    }
  };

  const handlePurchaseModule = (slotId: number, type: ModuleType) => {
    const moduleDef = AVAILABLE_MODULES[type];
    if (gameState.stats.funds < moduleDef.cost) return;

    setGameState(prev => {
      const newInfra = [...prev.infrastructure];
      newInfra[slotId] = {
        id: slotId,
        module: { ...moduleDef, id: `${type}-${Date.now()}` }
      };
      return {
        ...prev,
        stats: {
          ...prev.stats,
          funds: prev.stats.funds - moduleDef.cost
        },
        infrastructure: newInfra
      };
    });
  };

  const handleRemoveModule = (slotId: number) => {
     setGameState(prev => {
      const newInfra = [...prev.infrastructure];
      newInfra[slotId] = { id: slotId, module: null };
      return { ...prev, infrastructure: newInfra };
     });
  };

  const handleSendMessage = async (message: string) => {
    const userEvent: GameEvent = {
      id: `turn-${gameState.turnCount}-user`,
      turn: gameState.turnCount,
      narrative: message,
      type: 'choice'
    };

    setGameState(prev => ({
      ...prev,
      isLoading: true,
      history: [...prev.history, userEvent]
    }));

    // Calculate Passive Infrastructure Effects
    const infraEffects: Partial<GameStats> = { funds: 0, security: 0, hype: 0, techLevel: 0 };
    gameState.infrastructure.forEach(slot => {
      if (slot.module) {
        if (slot.module.type === 'miner') infraEffects.funds = (infraEffects.funds || 0) + 150; 
        if (slot.module.type === 'validator') infraEffects.security = (infraEffects.security || 0) + 1;
        if (slot.module.type === 'rpc') infraEffects.hype = (infraEffects.hype || 0) + 1;
      }
    });

    try {
      const response = await processTurn(message, gameState.stats, gameState.infrastructure);
      
      const newStats: GameStats = {
        ...gameState.stats,
        funds: Math.max(0, gameState.stats.funds + (response.stats_update.funds_change || 0) + (infraEffects.funds || 0)),
        users: Math.max(0, gameState.stats.users + (response.stats_update.users_change || 0)),
        security: Math.min(100, Math.max(0, gameState.stats.security + (response.stats_update.security_change || 0) + (infraEffects.security || 0))),
        hype: Math.min(100, Math.max(0, gameState.stats.hype + (response.stats_update.hype_change || 0) + (infraEffects.hype || 0))),
        techLevel: Math.min(100, Math.max(0, gameState.stats.techLevel + (response.stats_update.tech_level_change || 0))),
        decentralization: Math.min(100, Math.max(0, gameState.stats.decentralization + (response.stats_update.decentralization_change || 0))),
      };

      const aiEvent: GameEvent = {
        id: `turn-${gameState.turnCount + 1}-ai`,
        turn: gameState.turnCount + 1,
        narrative: response.narrative,
        choices: response.choices,
        type: response.event_type === 'game_over' ? 'failure' : response.event_type === 'victory' ? 'success' : 'narrative'
      };

      setGameState(prev => ({
        ...prev,
        isLoading: false,
        turnCount: prev.turnCount + 1,
        stats: newStats,
        history: [...prev.history, aiEvent],
        gameOver: response.event_type === 'game_over',
        gameWon: response.event_type === 'victory'
      }));

    } catch (error) {
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        history: [...prev.history, {
          id: `error-${Date.now()}`,
          turn: prev.turnCount,
          narrative: "Network Error. Connection to Blockchain failed. (Check API Key)",
          type: 'alert'
        }]
      }));
    }
  };

  // Render Setup Screen
  if (setupMode) {
    return (
      // Added inline styles to FORCE visibility if Tailwind fails
      <div 
        style={{ backgroundColor: '#111827', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        className={`min-h-screen bg-crypto-dark bg-gray-950 flex items-center justify-center text-crypto-text text-white p-4 relative overflow-hidden ${getFontClass()}`}
      >
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-900/10 blur-[120px] rounded-full"></div>

        <div className="max-w-xl w-full flex flex-col gap-6 z-10">
            <div className="bg-crypto-panel bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-700 shadow-lg shadow-crypto-accent/10">
                <Hexagon className="text-crypto-accent text-yellow-500" size={32} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">CRYPTO GENESIS</h1>
                <p className="text-gray-500 text-sm tracking-widest uppercase">Decentralized Simulation Engine</p>
            </div>

            <div className="space-y-6">
                
                {/* API Key Input */}
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase flex items-center gap-2">
                        <Key size={14} className="text-yellow-500" /> API Access Key
                    </label>
                    <input 
                        type="password"
                        value={userApiKey}
                        onChange={(e) => saveApiKey(e.target.value)}
                        placeholder={DEFAULT_API_KEY ? "Community Server Active (Optional: Enter own key)" : "Enter Gemini API Key (Required)"}
                        className="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white font-mono focus:border-yellow-500 outline-none placeholder-gray-600"
                    />
                    <div className="mt-2 text-[10px] text-gray-500 flex justify-between items-center">
                        <span className={DEFAULT_API_KEY && !userApiKey ? "text-green-400" : "text-gray-500"}>
                            {DEFAULT_API_KEY && !userApiKey ? "● Connected to Community Server" : "Key is stored locally on your device."}
                        </span>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline">Get Free Key ›</a>
                    </div>
                </div>

                <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase flex items-center gap-2">
                    <Globe size={14} /> Interface Language
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                    { id: 'fa', label: 'فارسی', font: 'font-persian' },
                    { id: 'en', label: 'English', font: 'font-sans' },
                    { id: 'ru', label: 'Русский', font: 'font-russian' },
                    { id: 'zh', label: '中文', font: 'font-chinese' },
                    ].map(lang => (
                    <button
                        key={lang.id}
                        onClick={() => setSettings(p => ({ ...p, language: lang.id as LanguageCode }))}
                        className={`p-3 rounded-lg border text-sm transition-all ${lang.font} ${
                        settings.language === lang.id 
                            ? 'bg-crypto-accent bg-yellow-500 text-crypto-dark text-black border-crypto-accent border-yellow-500 font-bold' 
                            : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                        {lang.label}
                    </button>
                    ))}
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Founder Name - New Field */}
                  <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-gray-400 mb-2 uppercase flex items-center gap-2">
                        <User size={14} /> Founder Name
                      </label>
                      <input 
                        type="text" 
                        value={settings.founderName}
                        onChange={(e) => setSettings(p => ({ ...p, founderName: e.target.value }))}
                        placeholder="e.g. Satoshi Nakamoto"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-crypto-accent focus:outline-none transition-colors"
                        dir="auto"
                      />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Project Name</label>
                    <input 
                    type="text" 
                    value={settings.projectName}
                    onChange={(e) => setSettings(p => ({ ...p, projectName: e.target.value }))}
                    placeholder="e.g. Bitcoin"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-crypto-accent focus:outline-none transition-colors"
                    dir="auto"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Ticker</label>
                    <input 
                    type="text" 
                    value={settings.ticker}
                    onChange={(e) => setSettings(p => ({ ...p, ticker: e.target.value.toUpperCase() }))}
                    placeholder="BTC"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-crypto-accent focus:outline-none transition-colors font-mono"
                    maxLength={5}
                    />
                </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                <button 
                    onClick={() => handleStartGame()}
                    disabled={!settings.projectName || !settings.ticker || !settings.founderName || (!userApiKey && !DEFAULT_API_KEY)}
                    className="w-full py-4 bg-gradient-to-r from-crypto-accent from-yellow-500 to-green-500 hover:from-green-400 hover:to-green-600 text-crypto-dark text-black font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-crypto-accent/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play size={20} fill="currentColor" />
                    INITIALIZE GENESIS BLOCK
                </button>
                
                {saveFound && (
                    <div className="flex gap-2">
                        <button 
                        onClick={handleLoadGame}
                        className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                        <Save size={18} />
                        CONTINUE SAVED PROJECT
                        </button>
                        
                        <button 
                        onClick={handleDeleteSave}
                        className="px-4 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-semibold rounded-xl transition-colors flex items-center justify-center border border-red-900/30"
                        title="Delete Save"
                        >
                        <Trash2 size={18} />
                        </button>
                    </div>
                )}
                </div>
            </div>
            </div>
            
            {/* Developer Credits Footer */}
            <div className="text-center text-gray-600 text-xs font-mono flex items-center justify-center gap-1">
                 Developed with <Heart size={10} className="text-crypto-secondary fill-current" /> by the CryptoGenesis Team
            </div>
        </div>
      </div>
    );
  }

  // Main Game Loop
  return (
    // Added inline styles here too
    <div 
      style={{ backgroundColor: '#111827', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      className={`min-h-screen bg-crypto-dark bg-gray-950 text-crypto-text text-white ${getFontClass()} selection:bg-crypto-accent selection:text-crypto-dark flex flex-col items-center`}
    >
      
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-crypto-secondary/5 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-crypto-accent/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-7xl px-4 py-4 md:py-6 z-10 flex flex-col h-screen">
        
        {/* Header */}
        <header className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-crypto-accent from-yellow-500 to-blue-500 p-2 rounded-lg shadow-lg shadow-crypto-accent/20">
                <Hexagon className="text-crypto-dark text-black" size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-white flex items-center gap-2">
                  {settings.projectName} <span className="text-crypto-dim text-gray-400 text-sm font-mono bg-gray-900 px-2 py-0.5 rounded border border-gray-800">${settings.ticker}</span>
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                  <span className="text-crypto-accent text-yellow-500">● LIVE</span>
                  <span>ERA: {gameState.stats.era}</span>
                  <span className="hidden md:inline text-gray-600">| FOUNDER: {settings.founderName}</span>
                </div>
              </div>
            </div>
            
            {/* View Toggles */}
            <div className="flex items-center bg-gray-900 p-1 rounded-lg border border-gray-800">
              <button 
                onClick={() => setViewMode('terminal')}
                className={`p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-bold ${viewMode === 'terminal' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <IconTerminal size={18} />
                <span className="hidden md:inline">TERMINAL</span>
              </button>
              <button 
                onClick={() => setViewMode('infra')}
                className={`p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-bold ${viewMode === 'infra' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Server size={18} />
                <span className="hidden md:inline">SERVER ROOM</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setSetupMode(true)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-colors">
                <Activity size={20} />
              </button>
            </div>
          </div>
          
          {/* News Ticker */}
          <div className="w-full bg-black/40 border-y border-gray-800/50 py-1 overflow-hidden relative flex justify-between">
              <div className="flex items-center overflow-hidden flex-1 relative">
                <div className="bg-crypto-accent/10 px-2 flex items-center text-[10px] font-bold text-crypto-accent text-yellow-500 uppercase tracking-wider shrink-0 z-10 mr-2 h-full">
                NEWS
                </div>
                <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] text-xs text-gray-400 font-mono flex items-center">
                    {news} <span className="mx-8 text-gray-700">///</span> {news} <span className="mx-8 text-gray-700">///</span> {news}
                </div>
             </div>
             
             {/* Autosave Indicator */}
             <div className={`flex items-center gap-1 text-[10px] font-mono transition-opacity duration-300 ml-4 px-2 ${isSaving ? 'opacity-100 text-crypto-accent text-yellow-500' : 'opacity-0'}`}>
                <CheckCircle2 size={10} /> SAVED
             </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden animate-fade-in-up">
          <StatsPanel stats={gameState.stats} />
          <div className="flex-1 min-h-0 relative">
              {viewMode === 'terminal' ? (
                <Terminal 
                  history={gameState.history} 
                  onSendMessage={handleSendMessage}
                  isLoading={gameState.isLoading}
                  gameOver={gameState.gameOver}
                  gameWon={gameState.gameWon}
                  isRtl={settings.language === 'fa'}
                  language={settings.language}
                />
              ) : (
                <Infrastructure 
                  grid={gameState.infrastructure}
                  stats={gameState.stats}
                  language={settings.language}
                  onPurchase={handlePurchaseModule}
                  onRemove={handleRemoveModule}
                />
              )}
              
              {(gameState.gameOver || gameState.gameWon) && viewMode === 'terminal' && (
                 <div className="absolute bottom-4 left-0 right-0 p-4 flex justify-center z-20 pointer-events-none">
                    <div className="pointer-events-auto shadow-2xl">
                      {gameState.gameOver ? (
                          <button onClick={() => setSetupMode(true)} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2">
                           <RotateCcw size={18} /> REBOOT SYSTEM
                          </button>
                       ) : (
                          <div className="flex gap-2">
                             <button onClick={() => handleStartGame(gameState.stats.era + 1, true)} className="px-6 py-3 bg-crypto-secondary hover:bg-purple-600 text-white rounded-lg font-bold transition-all transform hover:scale-105 flex items-center gap-2 border border-purple-400">
                                <Hexagon size={18} /> FORK & EVOLVE (ERA {gameState.stats.era + 1})
                             </button>
                             <button onClick={() => setSetupMode(true)} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold transition-colors">
                               RETIRE
                             </button>
                          </div>
                       )}
                    </div>
                 </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
