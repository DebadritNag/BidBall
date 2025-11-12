
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team, ChatMessage } from '../types';
import { TEAMS, INITIAL_BUDGET } from '../constants';
import Title from './Title';

interface RoomLobbyProps {
  roomCode: string;
  username: string;
  isHost: boolean;
  onStartAuction: (teams: Team[], userTeam: Team) => void;
  onBack: () => void;
}

const MOCK_PLAYERS = [
  { username: 'AI_Bot_1', teamId: 't2' },
  { username: 'AI_Bot_2', teamId: 't3' },
];

const MOCK_CHAT_MESSAGES = [
    "Can't wait for this to start!",
    "I've got my eyes on a certain midfielder.",
    "Let's have a good auction everyone.",
    "Who are you guys hoping to get?",
    "My budget is ready!",
];

const CUSTOM_TEAM_ID = 'custom';
const CUSTOM_TEAM_LOGO = 'https://img.icons8.com/plasticine/100/football.png';

const RoomLobby: React.FC<RoomLobbyProps> = ({ roomCode, username, isHost, onStartAuction, onBack }) => {
  const allTeamOptions = useMemo(() => [
    ...TEAMS,
    { id: CUSTOM_TEAM_ID, name: 'Custom Team', logo: CUSTOM_TEAM_LOGO }
  ], []);

  const takenTeams = useMemo(() => [], []);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [customTeamName, setCustomTeamName] = useState('');
  const [roomPlayers, setRoomPlayers] = useState<Array<{username: string, isHost: boolean}>>([]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // Initialize room players list with current user
    setRoomPlayers([{ username, isHost }]);
  }, [username, isHost]);

  useEffect(() => {
    setMessages([{ sender: 'System', text: `Welcome to the lobby, ${username}!`, isUser: false }]);
  }, [username]);
  
  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() === '') return;

    const newMessage: ChatMessage = {
        sender: username,
        text: chatInput.trim(),
        isUser: true,
    };
    setMessages(prev => [...prev, newMessage]);
    setChatInput('');
  };


  const handleStart = () => {
    if (!selectedTeamId) return;
    let userTeamDetails: Omit<Team, 'budget' | 'players' | 'isAI' | 'isUser'>;

    if (selectedTeamId === CUSTOM_TEAM_ID) {
      if (customTeamName.trim().length < 3) return;
      userTeamDetails = {
        id: `custom-${username.toLowerCase()}`,
        name: customTeamName.trim(),
        logo: CUSTOM_TEAM_LOGO,
      };
    } else {
      userTeamDetails = TEAMS.find(t => t.id === selectedTeamId)!;
    }
    
    const userTeamForAuction: Team = { ...userTeamDetails, budget: INITIAL_BUDGET, players: [], isUser: true, isAI: false };
    
    // In multiplayer, only include human players (no AI bots)
    const allTeamsForAuction = [userTeamForAuction];

    onStartAuction(allTeamsForAuction, userTeamForAuction);
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
  };
  
  const isStartDisabled = !selectedTeamId || (selectedTeamId === CUSTOM_TEAM_ID && customTeamName.trim().length < 3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4"
    >
      <Title />
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-yellow-500/20 w-full max-w-6xl">
        <h2 className="text-3xl font-bold text-center text-yellow-400 mb-2">Room Lobby</h2>
        <div className="text-center mb-6">
          <p className="text-gray-300">Share this code with your friends:</p>
          <div onClick={copyToClipboard} className="inline-flex items-center gap-2 bg-gray-900/50 text-yellow-300 font-mono text-2xl p-3 rounded-lg my-2 cursor-pointer border border-dashed border-gray-600 hover:border-yellow-400 transition-colors" title="Click to copy">
            <span>{roomCode}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            <div>
                <h3 className="text-xl font-semibold text-yellow-400 mb-4 border-b-2 border-yellow-500/20 pb-2">Players in Room</h3>
                <ul className="space-y-3">
                    <li className="bg-green-500/10 p-3 rounded-lg flex justify-between items-center border border-green-500/30">
                        <span className="font-bold">{username} (You)</span>
                        <span className="text-sm text-gray-300">{isHost ? 'Host' : 'Player'}</span>
                    </li>
                    {roomPlayers.filter(p => p.username !== username).map(player => (
                        <li key={player.username} className={`p-3 rounded-lg flex justify-between items-center border ${
                          player.isHost ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-700/50 border-gray-700'
                        }`}>
                            <span className="font-bold">{player.username}</span>
                            <span className="text-sm text-gray-300">{player.isHost ? 'Host' : 'Player'}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h3 className="text-xl font-semibold text-yellow-400 mb-4 border-b-2 border-yellow-500/20 pb-2">Select Your Team</h3>
                <div className="grid grid-cols-2 gap-3">
                    {allTeamOptions.map(team => {
                        const isTaken = takenTeams.includes(team.id);
                        
                        return (
                            <div
                                key={team.id}
                                onClick={() => !isTaken && setSelectedTeamId(team.id)}
                                className={`p-3 rounded-lg transition-all duration-300 border-2 flex items-center gap-3 relative ${
                                    selectedTeamId === team.id ? 'bg-yellow-500/20 border-yellow-500' : 'bg-gray-700/50 border-transparent'
                                } ${isTaken ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-yellow-500/50'}`}
                            >
                                <img src={team.logo} alt={team.name} className="w-10 h-10" />
                                <p className="font-semibold text-sm">{team.name}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div>
                <h3 className="text-xl font-semibold text-yellow-400 mb-4 border-b-2 border-yellow-500/20 pb-2">Room Chat</h3>
                <div className="bg-gray-900/50 h-80 rounded-lg p-3 flex flex-col">
                    <ul ref={chatContainerRef} className="flex-grow space-y-3 overflow-y-auto pr-2">
                        {messages.map((msg, index) => (
                            <li key={index} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                                {!msg.isUser && <span className={`text-xs px-2 text-yellow-300`}>{msg.sender}</span>}
                                <div className={`max-w-xs text-sm p-3 rounded-xl ${msg.isUser ? 'bg-green-600/50 rounded-br-none' : 'bg-gray-700/50 rounded-bl-none'}`}>
                                    {msg.text}
                                </div>
                            </li>
                        ))}
                    </ul>
                    <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-grow bg-gray-700/50 text-white border-2 border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:border-yellow-500 transition-colors duration-300 text-sm"
                            autoComplete="off"
                        />
                        <button type="submit" className="bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors">
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
        
        <AnimatePresence>
            {selectedTeamId === CUSTOM_TEAM_ID && (
                <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden max-w-md mx-auto"
                >
                <label htmlFor="customTeamNameLobby" className="block text-yellow-300 text-sm font-bold mb-2">
                    Custom Team Name
                </label>
                <input
                    type="text"
                    id="customTeamNameLobby"
                    value={customTeamName}
                    onChange={(e) => setCustomTeamName(e.target.value)}
                    placeholder="Enter your team name (min 3 chars)"
                    className="w-full bg-gray-700/50 text-white border-2 border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:border-yellow-500 transition-colors duration-300"
                    minLength={3}
                />
                </motion.div>
            )}
        </AnimatePresence>

        <div className="flex justify-between items-center">
             <button onClick={onBack} className="text-gray-400 hover:text-yellow-400 transition-colors">
                &larr; Leave Room
            </button>
            <button
              onClick={handleStart}
              disabled={isStartDisabled || !isHost}
              className="bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-lg text-xl hover:bg-yellow-400 transition-colors duration-300 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Start Auction
            </button>
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">Waiting for other players to join... {isHost && 'As the host, you can start the auction when ready.'}</p>
      </div>
    </motion.div>
  );
};

export default RoomLobby;