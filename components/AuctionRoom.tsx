import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team, ChatMessage } from '../types';
import PlayerStage from './PlayerStage';
import TeamPanels from './TeamPanels';
import BudgetTicker from './BudgetTicker';
import useAuction from '../hooks/useAuction';
import Title from './Title';
import TeamViewModal from './TeamViewModal';
import ChatBox from './ChatBox';
import { AUCTION_CHAT_MESSAGES } from '../constants';

interface AuctionRoomProps {
  initialTeams: Team[];
  userTeam: Team;
  username: string;
  onAuctionEnd: (teams: Team[]) => void;
}

const AuctionRoom: React.FC<AuctionRoomProps> = ({ initialTeams, userTeam, username, onAuctionEnd }) => {
  const {
    status,
    teams,
    currentPlayer,
    currentBid,
    highestBidder,
    timer,
    auctioneerMessage,
    placeBid,
    skipPlayer,
    isUserTurn,
    userHasSkipped,
    startAuction,
    isMuted,
    toggleMute
  } = useAuction(initialTeams, userTeam, onAuctionEnd);
  
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setMessages([{ sender: 'System', text: 'Auction chat is now live!', isUser: false }]);

    return () => {
      setMessages(prev => [...prev, { sender: 'System', text: 'The auction has ended. Chat disabled.', isUser: false }]);
    }
  }, []);

  useEffect(() => {
    if (status !== 'bidding') return;

    const chatInterval = setInterval(() => {
      const aiTeams = teams.filter(t => t.isAI);
      if (aiTeams.length === 0) return;
      
      const randomBot = aiTeams[Math.floor(Math.random() * aiTeams.length)];
      const randomMessage = AUCTION_CHAT_MESSAGES[Math.floor(Math.random() * AUCTION_CHAT_MESSAGES.length)];
      
      setMessages(prev => [...prev, { sender: randomBot.name, text: randomMessage, isUser: false }]);
    }, 9000 + Math.random() * 4000);

    return () => clearInterval(chatInterval);
  }, [status, teams]);
  
  const handleSendMessage = (text: string) => {
    if (status === 'finished') return;
    const newMessage: ChatMessage = {
      sender: username,
      text: text,
      isUser: true,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const highestBidderName = teams.find(t => t.id === highestBidder)?.name || 'N/A';
  const currentUserTeamState = teams.find(t => t.id === userTeam.id);

  return (
    <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen flex flex-col p-4 md:p-6 lg:p-8 bg-gray-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(234,179,8,0.3),rgba(255,255,255,0))] overflow-hidden"
    >
      <header className="flex justify-between items-center mb-4">
        <Title small />
        <div className="flex items-center gap-4">
           <button 
            onClick={() => setIsTeamModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-400 transition-colors text-sm"
          >
            View My Team
          </button>
          <button 
            onClick={toggleMute}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              : 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            }
          </button>
        </div>
      </header>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col">
          <PlayerStage
            status={status}
            player={currentPlayer}
            currentBid={currentBid}
            highestBidderName={highestBidderName}
            timer={timer}
            auctioneerMessage={auctioneerMessage}
            onStartAuction={startAuction}
            onPlaceBid={placeBid}
            onSkip={skipPlayer}
            isUserTurn={isUserTurn}
            userHasSkipped={userHasSkipped}
            winningTeam={status === 'sold' ? teams.find(t => t.id === highestBidder) : undefined}
          />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex-[3_3_0%] min-h-0">
             <TeamPanels teams={teams} highestBidderId={highestBidder} />
          </div>
          <div className="flex-[2_2_0%] min-h-0">
             <ChatBox 
                messages={messages} 
                onSendMessage={handleSendMessage}
                username={username}
                isDisabled={status === 'finished'}
              />
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <BudgetTicker teams={teams} />
      </div>
    </motion.div>
    <AnimatePresence>
        {isTeamModalOpen && currentUserTeamState && (
            <TeamViewModal team={currentUserTeamState} onClose={() => setIsTeamModalOpen(false)} />
        )}
    </AnimatePresence>
    </>
  );
};

export default AuctionRoom;