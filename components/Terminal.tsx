import React, { useRef, useEffect, useState } from 'react';
import { GameEvent, LanguageCode } from '../types';
import Typewriter from './Typewriter';
import { Send, Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  history: GameEvent[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  gameOver: boolean;
  gameWon: boolean;
  isRtl: boolean;
  language: LanguageCode;
}

const Terminal: React.FC<TerminalProps> = ({ 
  history, 
  onSendMessage, 
  isLoading, 
  gameOver, 
  gameWon,
  isRtl,
  language
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || gameOver || gameWon) return;
    onSendMessage(input);
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading || gameOver || gameWon) return;
    onSendMessage(suggestion);
  };

  const getPlaceholder = () => {
    if (isLoading) {
      return language === 'fa' ? 'در حال پردازش بلاک...' : 'Processing block...';
    }
    return language === 'fa' ? 'دستور خود را وارد کنید...' : 'Enter command...';
  };

  return (
    <div className="flex flex-col h-full bg-crypto-dark rounded-xl border border-gray-800 overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <TerminalIcon size={16} className="text-crypto-accent mr-2" />
        <span className="text-xs text-gray-400 font-mono">GEMINI-CORE // NET_ID: {Math.floor(Math.random()*1000)}</span>
        <div className="ml-auto flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>

      {/* Logs Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 text-sm md:text-base scroll-smooth pb-32"
      >
        {history.length === 0 && (
          <div className="text-center text-gray-500 mt-20 opacity-50 font-mono">
            Initializing Blockchain Simulation...
          </div>
        )}

        {history.map((event) => (
          <div key={event.id} className={`flex flex-col ${event.type === 'choice' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`max-w-[90%] md:max-w-[80%] rounded-lg p-3 md:p-4 leading-relaxed shadow-sm ${
                event.type === 'choice' 
                  ? 'bg-crypto-panel border border-gray-700 text-gray-300' 
                  : event.type === 'alert' 
                    ? 'bg-red-900/10 border border-red-900/30 text-red-200'
                    : event.type === 'success'
                      ? 'bg-green-900/10 border border-green-900/30 text-green-200'
                      : 'bg-transparent text-crypto-text'
              }`}
            >
              {/* Only use Typewriter for the latest narrative event */}
              {event.type === 'narrative' && event.id === history[history.length - 1].id && !isLoading ? (
                <div dir={isRtl ? "rtl" : "ltr"} className={isRtl ? "text-right" : "text-left"}>
                    <Typewriter text={event.narrative} speed={isRtl ? 10 : 15} />
                </div>
              ) : (
                <div dir={isRtl ? "rtl" : "ltr"} className={isRtl ? "text-right" : "text-left"}>
                    {event.narrative}
                </div>
              )}
            </div>
            
            {/* Suggestions for this event - Only show for last event */}
            {event.choices && event.choices.length > 0 && event.id === history[history.length - 1].id && !isLoading && !gameOver && !gameWon && (
               <div className={`mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-[90%] animate-fade-in ${isRtl ? 'ml-auto' : ''}`}>
                 {event.choices.map((choice, idx) => (
                   <button
                     key={idx}
                     onClick={() => handleSuggestionClick(choice)}
                     disabled={isLoading || gameOver}
                     dir={isRtl ? "rtl" : "ltr"}
                     className={`px-4 py-3 text-sm bg-gray-900/50 hover:bg-crypto-accent/10 border border-crypto-accent/30 hover:border-crypto-accent text-crypto-accent rounded transition-all duration-200 ${isRtl ? 'text-right' : 'text-left'}`}
                   >
                     <span className="opacity-50 mr-2 font-mono">{'>>'}</span> {choice}
                   </button>
                 ))}
               </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-crypto-accent animate-pulse p-4">
            <span className="w-2 h-4 bg-crypto-accent block"></span>
            <span className="text-xs uppercase tracking-widest font-mono">Validating Proof of Work...</span>
          </div>
        )}
        
        {gameOver && (
          <div className="p-6 bg-red-900/20 border border-red-500 text-center rounded-xl my-8 mx-auto max-w-lg">
            <h3 className="text-2xl font-bold text-red-500 mb-2">CRITICAL FAILURE</h3>
            <p className="text-gray-300">Project liquidity drained. Developers have fled.</p>
          </div>
        )}

        {gameWon && (
          <div className="p-6 bg-green-900/20 border border-green-500 text-center rounded-xl my-8 mx-auto max-w-lg">
            <h3 className="text-2xl font-bold text-green-500 mb-2">MASS ADOPTION ACHIEVED</h3>
            <p className="text-gray-300">You have conquered the market.</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-900 border-t border-gray-800 flex items-center gap-2 shrink-0">
        <div className="text-crypto-accent font-bold mr-2 text-xl">❯</div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={getPlaceholder()}
          disabled={isLoading || gameOver || gameWon}
          className={`flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 focus:ring-0 ${isRtl ? 'text-right' : 'text-left'}`}
          dir={isRtl ? "rtl" : "ltr"}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim() || gameOver || gameWon}
          className={`p-2 rounded-lg transition-colors ${
            isLoading || !input.trim() 
              ? 'text-gray-600 cursor-not-allowed' 
              : 'text-crypto-dark bg-crypto-accent hover:bg-green-400'
          }`}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default Terminal;