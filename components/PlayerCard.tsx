import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Player, AuctionStatus } from '../types';
import { formatCurrency } from '../utils/formatters';

interface PlayerCardProps {
  player: Player;
  status: AuctionStatus;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, status }) => {
  // FIX: Explicitly type `cardVariants` with the `Variants` type from framer-motion
  // to resolve the type error where 'string' was not assignable to 'AnimationGeneratorType'.
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100 } },
    exit: { opacity: 0, y: -50, scale: 0.8 },
  };

  const getPositionInitials = (position: Player['position']) => {
    switch(position) {
      case 'Goalkeeper': return 'GK';
      case 'Defender': return 'DF';
      case 'Midfielder': return 'MF';
      case 'Forward': return 'FW';
      default: return 'PL';
    }
  };

  return (
    <motion.div
      key={player.id}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full max-w-sm aspect-[3/4] p-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-3xl shadow-2xl border-2 border-yellow-500/30 flex flex-col justify-between relative overflow-hidden"
    >
        <div className="absolute top-0 right-0 bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-bl-2xl">
           <span className="text-2xl">{player.rating}</span>
           <span className="text-xs ml-1">OVR</span>
        </div>
        
        <div className="text-center">
            <h2 className="text-3xl font-bold text-white truncate">{player.name}</h2>
            <p className="text-yellow-400 font-medium">{player.position}</p>
        </div>
        
        <div className="flex justify-center items-center my-4">
            <div className="w-40 h-40 rounded-full bg-gray-600 border-4 border-yellow-500/50 overflow-hidden shadow-lg flex items-center justify-center">
                <span className="text-5xl font-bold text-yellow-400">{getPositionInitials(player.position)}</span>
            </div>
        </div>
        
        <div className="text-center">
            <p className="text-gray-300 text-lg">{player.nationality}</p>
            <div className="mt-2 bg-gray-900/50 p-3 rounded-lg">
                <p className="text-sm uppercase text-yellow-300 tracking-wider">Base Price</p>
                <p className="text-2xl font-semibold text-white">{formatCurrency(player.basePrice)}</p>
            </div>
        </div>
    </motion.div>
  );
};

export default PlayerCard;
