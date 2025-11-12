
// This is a placeholder for Gemini API integration.
// In a real application, you would use the @google/genai library
// and your API key to generate dynamic text.
// For this example, we will use template strings in useAuction.ts to simulate this.

import { GoogleGenAI } from "@google/genai";
import { AuctioneerContext } from '../types';

// IMPORTANT: The API key must be set in your environment variables.
// DO NOT hardcode the API key in the code.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// This is a mock setup as we can't use environment variables here.
const ai = { models: { generateContent: async (config: any) => ({ text: 'Mock response from AI.' }) }};


const generatePrompt = (context: AuctioneerContext): string => {
  const { eventType, playerName, basePrice, bidAmount, teamName } = context;
  
  let prompt = `You are a world-class, charismatic, and slightly dramatic football auctioneer named 'BidBot'. Your commentary is brief, exciting, and full of personality. NEVER exceed 25 words.
  
  Current event: ${eventType}
  `;

  switch (eventType) {
    case 'AUCTION_START':
      prompt += "Generate an electrifying opening line for the auction.";
      break;
    case 'NEW_PLAYER':
      prompt += `A new player, ${playerName}, is up for auction with a base price of ₹${basePrice?.toLocaleString()}. Introduce him with flair.`;
      break;
    case 'BID_PLACED':
      prompt += `${teamName} has just placed a bid of ₹${bidAmount?.toLocaleString()}. React to this bid. Is it aggressive? A good value? Announce it with excitement.`;
      break;
    case 'TIMER_LOW':
      prompt += `The timer is running out. The current high bidder is ${teamName}. Create a sense of urgency with a classic 'going once, going twice...' style call.`;
      break;
    case 'PLAYER_SOLD':
      prompt += `${playerName} has been sold to ${teamName} for ₹${bidAmount?.toLocaleString()}. Announce the final sale with a bang!`;
      break;
    case 'PLAYER_UNSOLD':
      prompt += `${playerName} was not sold. Express your surprise or disappointment.`;
      break;
    default:
      prompt += "Say something interesting about the auction."
  }
  return prompt;
};

export const getAuctioneerCommentary = async (context: AuctioneerContext): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY not found. Using mock commentary. See services/geminiService.ts");
    // This fallback is for local development without an API key.
    // In a real scenario, you'd handle this error more gracefully.
    return "The auctioneer is currently speechless!";
  }

  try {
    const prompt = generatePrompt(context);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error fetching commentary from Gemini API:", error);
    // Return a safe fallback message
    return "An electrifying moment in the auction!";
  }
};
