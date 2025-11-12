
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TeamViewModalProps {
  team: Team;
  onClose: () => void;
}

const TeamViewModal: React.FC<TeamViewModalProps> = ({ team, onClose }) => {
  const playersByPosition = {
    Forwards: team.players.filter(p => p.position === 'Forward'),
    Midfielders: team.players.filter(p => p.position === 'Midfielder'),
    Defenders: team.players.filter(p => p.position === 'Defender'),
    Goalkeepers: team.players.filter(p => p.position === 'Goalkeeper'),
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 120 }}
          className="bg-gray-800 rounded-2xl w-full max-w-2xl border-2 border-yellow-500/30 shadow-2xl max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <header className="p-6 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <img src={team.logo} alt={team.name} className="w-12 h-12 mr-4" />
              <div>
                <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                <p className="text-sm text-gray-400">Squad Overview</p>
              </div>
            </div>
             <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
          <div className="p-6 bg-gray-900/30 flex justify-around text-center text-sm">
             <div>
                <p className="uppercase text-gray-400">Players</p>
                <p className="text-xl font-bold text-white">{team.players.length}</p>
             </div>
             <div>
                <p className="uppercase text-gray-400">Budget Left</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(team.budget)}</p>
             </div>
          </div>
          <main className="p-6 flex-grow overflow-y-auto">
            {Object.entries(playersByPosition).map(([position, players]) => (
              players.length > 0 && (
                <div key={position} className="mb-6">
                  <h3 className="text-lg font-semibold text-yellow-400 border-b-2 border-yellow-500/20 pb-2 mb-3">{position} ({players.length})</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {players.map(player => (
                      <li key={player.id} className="bg-gray-700/50 p-3 rounded-lg flex items-center justify-between">
                         <div>
                            <p className="font-semibold text-white">{player.name}</p>
                            <p className="text-xs text-gray-400">{player.nationality}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-lg font-bold text-white">{player.rating}</p>
                           <p className="text-xs text-gray-400">OVR</p>
                         </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
             {team.players.length === 0 && (
                <p className="text-center text-gray-400 italic py-8">Your squad is empty. Start bidding!</p>
             )}
          </main>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TeamViewModal;
