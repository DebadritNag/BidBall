
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, AuctionStatus, Team } from '../types';
import { formatCurrency } from '../utils/formatters';
import BiddingControls from './BiddingControls';
import PlayerCard from './PlayerCard';

interface PlayerStageProps {
  status: AuctionStatus;
  player?: Player;
  currentBid: number;
  highestBidderName: string;
  timer: number;
  auctioneerMessage: string;
  onStartAuction: () => void;
  onPlaceBid: () => void;
  onSkip: () => void;
  isUserTurn: boolean;
  userHasSkipped: boolean;
  winningTeam?: Team;
  waitingForPlayers?: boolean;
  playersReady?: string[];
}

const PlayerStage: React.FC<PlayerStageProps> = ({
  status, player, currentBid, highestBidderName, timer, auctioneerMessage,
  onStartAuction, onPlaceBid, onSkip, isUserTurn, userHasSkipped, winningTeam,
  waitingForPlayers, playersReady
}) => {

  const getTimerColor = () => {
    if (timer <= 3) return 'text-red-500';
    if (timer <= 6) return 'text-yellow-400';
    return 'text-green-400';
  };

  const timerVariants = {
    initial: { scale: 1, opacity: 1 },
    tick: { scale: [1, 1.3, 1], opacity: [1, 0.8, 1], transition: { duration: 0.4 } },
  };

  const stageContent = () => {
    // Show waiting screen if waiting for players
    if (waitingForPlayers) {
      return (
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">Waiting for All Players...</h2>
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4 mx-auto"></div>
          </div>
          {playersReady && playersReady.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-300 mb-2">Ready: {playersReady.length} players</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {playersReady.map(username => (
                  <span key={username} className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                    {username} ✓
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    if (status === 'pre-auction') {
      return (
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">The Auction is About to Begin!</h2>
          <button
            onClick={onStartAuction}
            className="bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-lg text-xl hover:bg-yellow-400 transition-colors duration-300 transform hover:scale-105"
          >
            Start Bidding
          </button>
        </div>
      );
    }

    if (status === 'finished' || status === 're-auction') {
      return (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">
            {status === 'finished' ? 'Auction Complete!' : 'Re-Auction Round'}
          </h2>
          <p className="text-gray-300">{auctioneerMessage}</p>
        </div>
      );
    }

    if (!player) {
      return (
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
            <p className="text-xl text-gray-300">Loading next player...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col md:flex-row items-center justify-around gap-8 relative">
        <AnimatePresence>
        {status === 'sold' && winningTeam && (
          <motion.div 
            key="sold-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 z-10 flex flex-col items-center justify-center rounded-2xl"
          >
            <motion.h2 
              initial={{ scale: 0.5, y: 20 }}
              animate={{ scale: 1, y: 0, transition: { delay: 0.2, type: 'spring', stiffness: 100 } }}
              className="text-5xl font-extrabold text-yellow-400 mb-2"
            >
              SOLD!
            </motion.h2>
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
              className="flex items-center"
            >
              <span className="text-2xl text-white mr-4">to</span>
              <img src={winningTeam.logo} alt={winningTeam.name} className="w-12 h-12 mr-2" />
              <span className="text-2xl font-bold text-white">{winningTeam.name}</span>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
        
        <PlayerCard player={player} status={status}/>

        <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-center">
          <div className="bg-gray-900/50 p-4 rounded-xl mb-4 w-full border-2 border-yellow-500/30">
            <p className="text-sm text-yellow-300 uppercase tracking-widest">Current Bid</p>
            <p className="text-5xl font-bold text-white my-1">{formatCurrency(currentBid)}</p>
            <p className="text-sm text-gray-300">
              Highest Bid: <span className="font-semibold text-yellow-400">{highestBidderName}</span>
            </p>
          </div>
          
          <div className="relative w-28 h-28 flex items-center justify-center mb-4">
            <svg className="absolute w-full h-full" viewBox="0 0 100 100">
              <circle className="text-gray-700" strokeWidth="5" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
              <motion.circle
                className={getTimerColor()}
                strokeWidth="5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="45"
                cx="50"
                cy="50"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 - (timer / 8) * 283 }}
                transition={{ duration: 1, ease: "linear" }}
                style={{ strokeDasharray: 283 }}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <motion.div key={timer} variants={timerVariants} animate="tick" className={`text-5xl font-bold ${getTimerColor()}`}>
              {timer}
            </motion.div>
          </div>
          
          <BiddingControls
            onBid={onPlaceBid}
            onSkip={onSkip}
            isBiddingActive={status === 'bidding'}
            canAfford={isUserTurn}
            hasSkipped={userHasSkipped}
            nextBidAmount={currentBid + 50000}
          />
        </div>
        
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-800/50 backdrop-blur-sm p-4 md:p-8 rounded-2xl shadow-2xl border border-yellow-500/20 flex flex-col items-center justify-center">
      <div className="w-full flex-grow flex items-center justify-center">
        {stageContent()}
      </div>
      <div className="w-full mt-4 h-16 bg-black/30 rounded-lg p-4 flex items-center justify-center">
        <p className="text-yellow-200 text-center italic text-sm md:text-base">
          <span className="font-bold text-yellow-400 mr-2">Auctioneer:</span> "{auctioneerMessage}"
        </p>
      </div>
    </div>
  );
};

export default PlayerStage;
