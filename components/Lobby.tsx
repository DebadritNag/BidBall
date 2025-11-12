import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team } from '../types';
import { TEAMS } from '../constants';
import Title from './Title';

interface LobbyProps {
  onStartSinglePlayer: (selectedTeam: Omit<Team, 'budget' | 'players' | 'isAI' | 'isUser'>) => void;
  onGoToMultiplayer: () => void;
  username: string;
}

const CUSTOM_TEAM_ID = 'custom';
const CUSTOM_TEAM_LOGO = 'https://img.icons8.com/plasticine/100/football.png';

const Lobby: React.FC<LobbyProps> = ({ onStartSinglePlayer, onGoToMultiplayer, username }) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(TEAMS[0].id);
  const [customTeamName, setCustomTeamName] = useState('');

  const handleStart = () => {
    if (selectedTeamId) {
       let selectedTeam: Omit<Team, 'budget' | 'players' | 'isAI' | 'isUser'>;

      if (selectedTeamId === CUSTOM_TEAM_ID) {
        if (customTeamName.trim().length < 3) return;
        selectedTeam = {
          id: `custom-${username.toLowerCase()}`,
          name: customTeamName.trim(),
          logo: CUSTOM_TEAM_LOGO,
        };
      } else {
        selectedTeam = TEAMS.find(t => t.id === selectedTeamId)!;
      }
      onStartSinglePlayer(selectedTeam);
    }
  };

  const isStartDisabled = !selectedTeamId || (selectedTeamId === CUSTOM_TEAM_ID && customTeamName.trim().length < 3);

  const allTeamOptions = [
      ...TEAMS,
      { id: CUSTOM_TEAM_ID, name: 'Custom Team', logo: CUSTOM_TEAM_LOGO }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4"
    >
      <Title />
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-yellow-500/20 w-full max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-yellow-400 mb-2">Welcome, {username}!</h2>
        <p className="text-center text-gray-300 mb-6">Choose your team for single player or head to the multiplayer lobby.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {allTeamOptions.map((team) => (
            <div
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`p-4 rounded-lg cursor-pointer transition-all duration-300 border-2 ${
                selectedTeamId === team.id ? 'bg-yellow-500/20 border-yellow-500 shadow-lg' : 'bg-gray-700/50 border-transparent hover:border-yellow-500/50'
              }`}
            >
              <img src={team.logo} alt={team.name} className="w-16 h-16 mx-auto mb-2" />
              <p className="text-center font-semibold text-sm">{team.name}</p>
            </div>
          ))}
        </div>
        
        <AnimatePresence>
          {selectedTeamId === CUSTOM_TEAM_ID && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <label htmlFor="customTeamName" className="block text-yellow-300 text-sm font-bold mb-2">
                Custom Team Name
              </label>
              <input
                type="text"
                id="customTeamName"
                value={customTeamName}
                onChange={(e) => setCustomTeamName(e.target.value)}
                placeholder="Enter your team name (min 3 chars)"
                className="w-full bg-gray-700/50 text-white border-2 border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:border-yellow-500 transition-colors duration-300"
                minLength={3}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleStart}
            disabled={isStartDisabled}
            className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg text-lg hover:bg-yellow-400 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
          >
            Start Single Player
          </button>
          <button
            onClick={onGoToMultiplayer}
            className="w-full bg-blue-500 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-blue-400 transition-colors duration-300 transform hover:scale-105"
          >
            Multiplayer
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Lobby;