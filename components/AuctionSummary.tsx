
import React from 'react';
import { motion } from 'framer-motion';
import { Team } from '../types';
import { formatCurrency } from '../utils/formatters';
import { INITIAL_BUDGET } from '../constants';
import Title from './Title';

interface AuctionSummaryProps {
  teams: Team[];
  onRestart: () => void;
}

const AuctionSummary: React.FC<AuctionSummaryProps> = ({ teams, onRestart }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center"
    >
      <Title />
      <h2 className="text-4xl font-extrabold text-center text-yellow-400 mb-8">Auction Summary</h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {teams.map((team, index) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-gray-800/60 rounded-xl p-6 border border-yellow-500/20 shadow-lg flex flex-col"
          >
            <div className="flex items-center mb-4">
              <img src={team.logo} alt={team.name} className="w-12 h-12 mr-4" />
              <h3 className="text-xl font-bold text-white">{team.name}</h3>
            </div>
            <div className="mb-4 text-sm">
              <p className="text-gray-300">Total Spend: <span className="font-semibold text-yellow-400">{formatCurrency(INITIAL_BUDGET - team.budget)}</span></p>
              <p className="text-gray-300">Budget Left: <span className="font-semibold text-green-400">{formatCurrency(team.budget)}</span></p>
            </div>
            <div className="flex-grow bg-gray-900/50 p-3 rounded-lg overflow-y-auto h-64">
              <h4 className="font-semibold mb-2 text-yellow-500">Squad ({team.players.length})</h4>
              <ul className="space-y-2 text-sm">
                {team.players.length > 0 ? (
                  team.players.map(player => (
                    <li key={player.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded">
                      <span className="font-medium">{player.name}</span>
                      <span className="text-xs text-gray-400">{formatCurrency(player.basePrice)}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-400 italic">No players bought.</p>
                )}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
      <button
        onClick={onRestart}
        className="bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-lg text-xl hover:bg-yellow-400 transition-colors duration-300 transform hover:scale-105"
      >
        Play Again
      </button>
    </motion.div>
  );
};

export default AuctionSummary;
