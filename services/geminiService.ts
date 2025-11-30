import { GoogleGenAI, Type, Chat, GenerationConfig } from "@google/genai";
import { GameStats, GeminiResponse, GameSettings, GridSlot } from "../types";

// Singleton instance management
let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

const getSystemInstruction = (settings: GameSettings, era: number) => `
You are "CryptoMaster", a ruthless and sophisticated simulation engine for a cryptocurrency text-adventure.
Player Project: "${settings.projectName}" (${settings.ticker}).
Founder/CEO Name: "${settings.founderName}". Address the player by this name occasionally.
Current Era: ${era} (Higher era = exponentially harder difficulty).
Target Language: ${settings.language === 'fa' ? 'PERSIAN (Farsi)' : settings.language === 'ru' ? 'RUSSIAN' : settings.language === 'zh' ? 'CHINESE (Simplified)' : 'ENGLISH'}.

Role:
Guide the user through a realistic, volatile journey.
Era 1: Initial Token Launch.
Era 2: Blockchain Ecosystem / L1 (Harder).
Era 3: Global Reserve Currency (Impossible difficulty).

Rules:
1. **Language**: ALL output (narrative and choices) MUST be in the Target Language.
2. **Realism**: Simulate black swan events (SEC lawsuits, Exchange hacks, Bear markets).
3. **Deep Strategy**: Do not reward generic actions. "Marketing" without "Product" fails. "Scaling" without "Security" leads to hacks.
4. **Prestige**: If the user is in Era > 1, the market is smarter. Competition is fierce.
5. **Infrastructure**: The user has a physical server room. Pay attention to their installed hardware (Miners, Validators, Firewalls). 
   - If they have many miners but low security, simulate a 51% attack.
   - If they have high hardware but low funds, simulate electricity bill issues.
6. **Output**: Strict JSON only.

Context:
The user is the Founder.
If Stats reach 0 (except Users/Funds depending on context) or Funds < 0, trigger 'game_over'.
If Users > ${1000000 * era} AND Hype > 90, trigger 'victory'.
`;

const RESPONSE_SCHEMA: GenerationConfig['responseSchema'] = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "The story segment in the target language. Use technical crypto terminology appropriate for that language.",
    },
    choices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-4 suggested short strategic actions (in target language).",
    },
    stats_update: {
      type: Type.OBJECT,
      properties: {
        funds_change: { type: Type.INTEGER, description: "Change in USD." },
        users_change: { type: Type.INTEGER, description: "Change in user count." },
        security_change: { type: Type.INTEGER, description: "Change in security (0-100)." },
        hype_change: { type: Type.INTEGER, description: "Change in hype (0-100)." },
        tech_level_change: { type: Type.INTEGER, description: "Change in tech level (0-100)." },
        decentralization_change: { type: Type.INTEGER, description: "Change in decentralization (0-100)." },
      },
    },
    event_type: {
      type: Type.STRING,
      enum: ["normal", "crisis", "opportunity", "game_over", "victory"],
    },
  },
  required: ["narrative", "choices", "stats_update", "event_type"],
};

export const initializeGame = async (apiKey: string, settings: GameSettings, era: number = 1): Promise<GeminiResponse> => {
  if (!apiKey) throw new Error("API Key missing");

  ai = new GoogleGenAI({ apiKey });
  
  // Create a new chat session with configured language and settings
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: getSystemInstruction(settings, era),
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.95, // High creativity/volatility
    },
  });

  const eraContext = era > 1 
    ? `The user has successfully evolved the project. We are now in Era ${era}. The market is larger, but threats are global. Governments are watching.`
    : `Start the game. ${settings.founderName} is writing the first line of code for ${settings.projectName}.`;

  const prompt = `
  ${eraContext}
  Initialize the narrative.
  Ask the user for their first major decision regarding the Whitepaper or Consensus Mechanism.
  `;

  try {
    const result = await chatSession.sendMessage({ message: prompt });
    const text = result.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as GeminiResponse;
  } catch (error) {
    console.error("Game init error:", error);
    throw error;
  }
};

export const restoreSession = async (
    apiKey: string,
    settings: GameSettings, 
    historySummary: string, 
    stats: GameStats, 
    infrastructure: GridSlot[]
) => {
    if (!apiKey) throw new Error("API Key missing");

    ai = new GoogleGenAI({ apiKey });
    chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: getSystemInstruction(settings, stats.era),
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
        },
    });
    
    // Create a robust context restoration prompt
    const hardwareSummary = infrastructure
      .filter(slot => slot.module)
      .map(slot => slot.module?.name)
      .join(", ") || "No hardware installed";

    const prompt = `
    SYSTEM: RESTORING SAVED GAME SESSION.
    
    Current State:
    - Funds: $${stats.funds}
    - Users: ${stats.users}
    - Security: ${stats.security}%
    - Era: ${stats.era}
    
    Installed Infrastructure: [${hardwareSummary}]
    
    Recent History Summary: ${historySummary}
    
    INSTRUCTION: 
    1. Acknowledge the restoration silently. 
    2. Set internal state to match these stats. 
    3. Output a 'normal' event with a short narrative like "System online. Welcome back, ${settings.founderName}." in the target language.
    `;

    try {
        await chatSession.sendMessage({ message: prompt });
    } catch(e) {
        console.warn("Restoration prompt failed, starting fresh context", e);
    }
}

export const processTurn = async (
  userInput: string, 
  currentStats: GameStats,
  infrastructure: GridSlot[]
): Promise<GeminiResponse> => {
  if (!chatSession) throw new Error("Game not initialized");

  // Summarize infrastructure for AI
  const hardwareSummary = infrastructure
    .filter(slot => slot.module)
    .map(slot => slot.module?.name)
    .join(", ") || "No hardware installed";

  const prompt = `
  User Action: "${userInput}"
  
  Current Stats (Era ${currentStats.era}):
  - Funds: $${currentStats.funds}
  - Users: ${currentStats.users}
  - Security: ${currentStats.security}%
  - Hype: ${currentStats.hype}%
  - Tech Level: ${currentStats.techLevel}%
  - Decentralization: ${currentStats.decentralization}%

  Physical Infrastructure Installed:
  [${hardwareSummary}]
  (Take this hardware into account. e.g., if "Quantum Firewall" is installed, hacks fail. If "ASIC Miner" is installed, energy usage is high).

  Analyze impact. Be strict.
  High hype + Low Tech = Crash risk.
  High Funds + Low Security = Hack risk.
  
  Advance the story.
  `;

  try {
    const result = await chatSession.sendMessage({ message: prompt });
    const text = result.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as GeminiResponse;
  } catch (error) {
    console.error("Turn processing error:", error);
    return {
      narrative: "Connection lost. The blockchain is congested. Try again.",
      choices: ["Retry"],
      stats_update: {},
      event_type: "normal"
    };
  }
};