
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TeamPanelsProps {
  teams: Team[];
  highestBidderId: string | null;
}

const TeamPanels: React.FC<TeamPanelsProps> = ({ teams, highestBidderId }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl shadow-inner h-full border border-yellow-500/20">
      <h3 className="text-xl font-bold text-center text-yellow-400 mb-4">Teams</h3>
      <div className="space-y-3 overflow-y-auto h-[calc(100%-2rem)] pr-2">
        <AnimatePresence>
          {teams.map((team, index) => (
            <motion.div
              key={team.id}
              layout
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`p-3 rounded-lg transition-all duration-300 ${
                team.id === highestBidderId ? 'bg-yellow-500/20 border-2 border-yellow-500' : 'bg-gray-700/50 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img src={team.logo} alt={team.name} className="w-10 h-10 mr-3" />
                  <div>
                    <p className="font-semibold text-sm leading-tight">{team.name} {team.isUser && "(You)"}</p>
                    <p className="text-xs text-gray-400">Players: {team.players.length}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400 text-sm leading-tight">{formatCurrency(team.budget)}</p>
                  <p className="text-xs text-gray-400">Budget Left</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeamPanels;
