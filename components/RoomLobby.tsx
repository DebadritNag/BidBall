
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team, ChatMessage } from '../types';
import { TEAMS, INITIAL_BUDGET } from '../constants';
import Title from './Title';
import { multiplayerService } from '../services/multiplayerService';

interface Room {
  id: string;
  code: string;
  host_username: string;
  players: Array<{username: string, isHost: boolean, isReady?: boolean}>;
  status: 'waiting' | 'auction_started' | 'finished';
  auction_teams?: any[];
  auction_players?: any[];
  created_at: string;
  updated_at: string;
}

interface RoomLobbyProps {
  roomCode: string;
  username: string;
  isHost: boolean;
  onStartAuction: (teams: Team[], userTeam: Team, roomCode: string) => void;
  onBack: () => void;
}

const CUSTOM_TEAM_ID = 'custom';
const CUSTOM_TEAM_LOGO = 'https://img.icons8.com/plasticine/100/football.png';

const RoomLobby: React.FC<RoomLobbyProps> = ({ roomCode, username, isHost, onStartAuction, onBack }) => {
  const allTeamOptions = useMemo(() => [
    ...TEAMS,
    { id: CUSTOM_TEAM_ID, name: 'Custom Team', logo: CUSTOM_TEAM_LOGO }
  ], []);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [customTeamName, setCustomTeamName] = useState('');
  const [roomPlayers, setRoomPlayers] = useState<Array<{username: string, isHost: boolean}>>([]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef<HTMLUListElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize room and subscribe to changes
  useEffect(() => {
    const initializeRoom = async () => {
      try {
        let room;
        if (isHost) {
          // Create new room
          room = await multiplayerService.createRoom(roomCode, username);
        } else {
          // Join existing room
          room = await multiplayerService.addPlayerToRoom(roomCode, username);
        }

        if (room) {
          console.log('Room initialized:', room);
          const players = Array.isArray(room.players) ? room.players : [];
          console.log('Room players from init:', players);
          setRoomPlayers(players);
          setMessages([{ sender: 'System', text: `Welcome to the lobby, ${username}!`, isUser: false }]);
        } else {
          console.log('No room returned from service');
          setMessages([{ 
            sender: 'System', 
            text: '⚠️ Database Setup Required: Please run the SQL migration in Supabase. Go to SQL Editor in Supabase Dashboard and run the SQL from: database/migrations/001_create_multiplayer_tables.sql', 
            isUser: false 
          }]);
        }
      } catch (error) {
        console.error('Error initializing room:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        let helpText = `Error: ${errorMsg}`;
        if (errorMsg.includes('relations') || errorMsg.includes('permission')) {
          helpText = '⚠️ Database Setup Required: Please run the SQL migration in Supabase. Go to SQL Editor in Supabase Dashboard and copy-paste all SQL from: database/migrations/001_create_multiplayer_tables.sql';
        }
        
        setMessages([{ 
          sender: 'System', 
          text: helpText, 
          isUser: false 
        }]);
      }
    };

    initializeRoom();

    // Subscribe to real-time room changes
    const unsubscribe = multiplayerService.subscribeToRoomChanges(roomCode, (room: Room) => {
      console.log('Room update from real-time:', room);
      const players = Array.isArray(room.players) ? room.players : [];
      console.log('Updated room players:', players);
      setRoomPlayers(players);
      
      // Check if auction has started
      if (room.status === 'auction_started' && room.auction_teams && room.auction_teams.length > 0) {
        console.log('Auction detected! Auction teams:', room.auction_teams);
        // Find user's team from the room teams
        let userTeam = room.auction_teams.find((t: Team) => t.id === `custom-${username.toLowerCase()}`);
        
        // If custom team not found, try to find by user flag
        if (!userTeam) {
          userTeam = room.auction_teams.find((t: Team) => t.isUser === true);
        }
        
        // If still not found, try to find by username
        if (!userTeam) {
          userTeam = room.auction_teams.find((t: Team) => t.id.includes(username));
        }
        
        // Last resort: use first user team
        if (!userTeam) {
          userTeam = room.auction_teams.find((t: Team) => t.isAI === false);
        }
        
        // If still nothing, use first team
        if (!userTeam) {
          userTeam = room.auction_teams[0];
        }
        
        if (userTeam) {
          console.log('Auction started! User team:', userTeam);
          onStartAuction(room.auction_teams, userTeam, roomCode);
        }
      }
    });
    
    // Add polling as backup (every 2 seconds)
    const pollInterval = setInterval(async () => {
      try {
        console.log('Polling room:', roomCode);
        const room = await multiplayerService.getRoomByCode(roomCode);
        if (room) {
          const players = Array.isArray(room.players) ? room.players : [];
          console.log('Polling result - players count:', players.length, 'players:', players);
          setRoomPlayers(players);
          
          // Check if auction has started during polling
          if (room.status === 'auction_started' && room.auction_teams && room.auction_teams.length > 0) {
            console.log('Auction detected via polling! Auction teams:', room.auction_teams);
            // Find user's team from the room teams
            let userTeam = room.auction_teams.find((t: Team) => t.id === `custom-${username.toLowerCase()}`);
            
            if (!userTeam) {
              userTeam = room.auction_teams.find((t: Team) => t.isUser === true);
            }
            
            if (!userTeam) {
              userTeam = room.auction_teams.find((t: Team) => t.id.includes(username));
            }
            
            if (!userTeam) {
              userTeam = room.auction_teams.find((t: Team) => t.isAI === false);
            }
            
            if (!userTeam) {
              userTeam = room.auction_teams[0];
            }
            
            if (userTeam) {
              console.log('Auction started via polling! User team:', userTeam);
              // Clear the polling interval before transitioning
              clearInterval(pollInterval);
              onStartAuction(room.auction_teams, userTeam, roomCode);
            }
          }
        } else {
          console.log('Room not found in polling');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);
    
    pollIntervalRef.current = pollInterval;

    return () => {
      unsubscribe();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      // Clean up room if player leaves
      if (!isHost) {
        multiplayerService.removePlayerFromRoom(roomCode, username).catch(err => 
          console.error('Error removing player from room:', err)
        );
      }
    };
  }, [roomCode, username, isHost, onStartAuction]);

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

  const handleStart = async () => {
    if (!selectedTeamId) {
      setMessages(prev => [...prev, { sender: 'System', text: 'Please select a team first', isUser: false }]);
      return;
    }
    let userTeamDetails: Omit<Team, 'budget' | 'players' | 'isAI' | 'isUser'>;

    if (selectedTeamId === CUSTOM_TEAM_ID) {
      if (customTeamName.trim().length < 3) {
        setMessages(prev => [...prev, { sender: 'System', text: 'Custom team name must be at least 3 characters', isUser: false }]);
        return;
      }
      userTeamDetails = {
        id: `custom-${username.toLowerCase()}`,
        name: customTeamName.trim(),
        logo: CUSTOM_TEAM_LOGO,
      };
    } else {
      userTeamDetails = TEAMS.find(t => t.id === selectedTeamId)!;
    }
    
    // Create the user's team for auction
    const userTeamForAuction: Team = { 
      ...userTeamDetails, 
      budget: INITIAL_BUDGET, 
      players: [], 
      isUser: true, 
      isAI: false 
    };
    
    // Build teams list from all players in room
    const allTeamsForAuction: Team[] = roomPlayers.map(player => {
      if (player.username === username) {
        // This is the current user's team
        return userTeamForAuction;
      } else {
        // For other players, create a placeholder team
        return {
          id: `team-${player.username}`,
          name: `${player.username}'s Team`,
          logo: CUSTOM_TEAM_LOGO,
          budget: INITIAL_BUDGET,
          players: [],
          isUser: false,
          isAI: false
        };
      }
    });

    try {
      console.log('Starting auction with teams:', allTeamsForAuction);
      // Update room state to auction started in database
      const result = await multiplayerService.startAuction(roomCode, allTeamsForAuction);
      
      if (!result) {
        const errorMsg = '⚠️ Database Setup Required: Please run the SQL migration in Supabase. Go to SQL Editor in Supabase Dashboard and run the SQL from: database/migrations/001_create_multiplayer_tables.sql';
        setMessages(prev => [...prev, { sender: 'System', text: errorMsg, isUser: false }]);
        return;
      }
      
      console.log('Auction update sent to database:', result);
      
      // Trigger the auction for this client
      onStartAuction(allTeamsForAuction, userTeamForAuction, roomCode);
    } catch (error) {
      console.error('Error starting auction:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      let helpText = `Error starting auction: ${errorMsg}`;
      if (errorMsg.includes('relations') || errorMsg.includes('rooms')) {
        helpText = '⚠️ Database Setup Required: Please run the SQL migration in Supabase. Go to SQL Editor in Supabase Dashboard and run the SQL from: database/migrations/001_create_multiplayer_tables.sql';
      }
      setMessages(prev => [...prev, { sender: 'System', text: helpText, isUser: false }]);
    }
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
                <h3 className="text-xl font-semibold text-yellow-400 mb-4 border-b-2 border-yellow-500/20 pb-2">Players in Room ({roomPlayers.length})</h3>
                <ul className="space-y-3">
                    {roomPlayers.map(player => (
                        <li key={player.username} className={`p-3 rounded-lg flex justify-between items-center border ${
                          player.username === username ? 'bg-green-500/10 border-green-500/30' : 
                          player.isHost ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-700/50 border-gray-700'
                        }`}>
                            <span className="font-bold">{player.username} {player.username === username ? '(You)' : ''}</span>
                            <span className="text-sm text-gray-300">{player.isHost ? 'Host' : 'Player'}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h3 className="text-xl font-semibold text-yellow-400 mb-4 border-b-2 border-yellow-500/20 pb-2">Select Your Team</h3>
                <div className="grid grid-cols-2 gap-3">
                    {allTeamOptions.map(team => {
                        return (
                            <div
                                key={team.id}
                                onClick={() => setSelectedTeamId(team.id)}
                                className={`p-3 rounded-lg transition-all duration-300 border-2 flex items-center gap-3 relative ${
                                    selectedTeamId === team.id ? 'bg-yellow-500/20 border-yellow-500' : 'bg-gray-700/50 border-transparent'
                                } cursor-pointer hover:border-yellow-500/50`}
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
                className="mb-6 overflow-hidden"
                >
                <div className="bg-gray-900/50 p-6 rounded-lg border border-yellow-500/30 w-full max-w-md mx-auto">
                  <label htmlFor="customTeamNameLobby" className="block text-yellow-300 text-sm font-bold mb-3">
                    Custom Team Name
                  </label>
                  <input
                      type="text"
                      id="customTeamNameLobby"
                      value={customTeamName}
                      onChange={(e) => setCustomTeamName(e.target.value)}
                      placeholder="Enter your team name (min 3 chars)"
                      className="w-full bg-gray-700/50 text-white border-2 border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:border-yellow-500 transition-colors duration-300 mb-4"
                      minLength={3}
                  />
                  <p className="text-xs text-gray-400">Enter at least 3 characters for your custom team name.</p>
                </div>
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
              title={!isHost ? "Only the host can start the auction" : ""}
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
