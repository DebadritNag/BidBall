import { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Team, Bid, AuctionStatus } from '../types';
import { INITIAL_BUDGET, BID_INCREMENT, BIDDING_TIME, POST_SALE_DELAY, MIN_TEAM_PLAYERS, MAX_TEAM_PLAYERS } from '../constants';
import { getAuctioneerCommentary } from '../services/geminiService';
import { speak, cancelSpeech } from '../utils/speech';
import { playerService } from '../services/playerService';
import { bidService } from '../services/bidService';
import { auctionService } from '../services/auctionService';
import { teamService } from '../services/teamService';
import { multiplayerService } from '../services/multiplayerService';
import playerDataImport from '@/data/playerData.json' assert { type: 'json' };

const useAuction = (
  initialTeamsConfig: Team[],
  userTeamConfig: Team,
  onAuctionEnd: (teams: Team[]) => void,
  roomCode?: string, // Optional room code for multiplayer sync
  username?: string // Optional username for multiplayer
) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [status, setStatus] = useState<AuctionStatus>('pre-auction');
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState<string | null>(null);
  const [timer, setTimer] = useState(BIDDING_TIME);
  const [auctioneerMessage, setAuctioneerMessage] = useState('Welcome to the BidBall Auction!');
  const [skippedTeams, setSkippedTeams] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const [reAuctionPlayers, setReAuctionPlayers] = useState<Player[]>([]);
  const [reAuctionRound, setReAuctionRound] = useState(0);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [playersReady, setPlayersReady] = useState<string[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const aiActionTimeoutRef = useRef<number | null>(null);
  const userTeamId = userTeamConfig.id;
  const usernameRef = useRef<string>(''); // Store username for multiplayer
  const readyCheckIntervalRef = useRef<any>(null); // Track the ready check interval

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        // Try to fetch from Supabase first
        const dbPlayers = await playerService.fetchAllPlayers();
        if (dbPlayers && dbPlayers.length > 0) {
          console.log('Loaded players from Supabase:', dbPlayers.length);
          setAllPlayers(dbPlayers);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch from Supabase:', error);
      }
      
      // Fall back to imported JSON data
      try {
        const data = playerDataImport as any[];
        console.log('Loaded players from imported JSON:', data.length);
        // Convert numeric IDs to strings
        const playersWithStringIds = data.map((p: any) => ({
          ...p,
          id: String(p.id),
        }));
        setAllPlayers(playersWithStringIds);
      } catch (jsonError) {
        console.error('Failed to load player data from JSON:', jsonError);
      }
    };
    
    // Start fetching immediately
    fetchPlayerData();
  }, []);

  const updateAuctioneerMessage = useCallback(async (context) => {
      try {
        // In a real app, you would uncomment this to use Gemini. For now, we use templates.
        // const message = await getAuctioneerCommentary(context);
        let message = '';
        const { eventType, playerName, basePrice, bidAmount, teamName } = context;
        switch(eventType) {
            case 'AUCTION_START':
                message = "Let's get the ball rolling! The auction is now officially open!";
                break;
            case 'NEW_PLAYER':
                message = `Up next, we have ${playerName}! A fantastic player with a base price of ₹${basePrice?.toLocaleString()}. Who will start the bidding?`;
                break;
            case 'BID_PLACED':
                message = `A bid of ₹${bidAmount?.toLocaleString()} from ${teamName}! Do I hear more?`;
                break;
            case 'TIMER_LOW':
                message = `Going once... going twice... any last bids?`;
                break;
            case 'PLAYER_SOLD':
                message = `SOLD! ${playerName} goes to ${teamName} for a winning bid of ₹${bidAmount?.toLocaleString()}!`;
                break;
            case 'PLAYER_UNSOLD':
                message = `No bidders for ${playerName}. A surprising turn of events, he goes unsold.`;
                break;
        }
        setAuctioneerMessage(message);
      } catch (error) {
          console.error("Failed to get auctioneer commentary:", error);
          setAuctioneerMessage("The auctioneer is gathering his thoughts...");
      }
  }, []);
  
  useEffect(() => {
    const handleSpeech = async () => {
      if (auctioneerMessage && !isMuted) {
        await speak(auctioneerMessage);
      } else {
        cancelSpeech();
      }
    }
    handleSpeech();
  }, [auctioneerMessage, isMuted]);

  // Subscribe to auction state updates in multiplayer mode
  useEffect(() => {
    if (!roomCode || status !== 'bidding') return;

    console.log('Setting up auction state sync for room:', roomCode);
    const unsubscribe = multiplayerService.subscribeToAuctionState(roomCode, (auctionState) => {
      console.log('Auction state update received:', auctionState);
      
      // Update local state from remote auction state
      if (auctionState.currentPlayerIndex !== undefined) {
        setCurrentPlayerIndex(auctionState.currentPlayerIndex);
      }
      if (auctionState.currentBid !== undefined) {
        setCurrentBid(auctionState.currentBid);
      }
      if (auctionState.highestBidder !== undefined) {
        setHighestBidder(auctionState.highestBidder);
      }
      if (auctionState.timer !== undefined) {
        setTimer(auctionState.timer);
      }
      if (auctionState.teams) {
        setTeams(auctionState.teams);
      }
    });

    return () => {
      console.log('Cleaning up auction state sync');
      unsubscribe();
    };
  }, [roomCode, status]);

  // Cleanup ready check interval when status changes or component unmounts
  useEffect(() => {
    return () => {
      if (readyCheckIntervalRef.current) {
        clearInterval(readyCheckIntervalRef.current);
        readyCheckIntervalRef.current = null;
      }
    };
  }, [status]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(BIDDING_TIME);
    timerRef.current = window.setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const checkTeamMinimumPlayers = useCallback(() => {
    const teamsWithoutMinimum = teams.filter(team => team.players.length < MIN_TEAM_PLAYERS);
    return teamsWithoutMinimum;
  }, [teams]);

  const initializeReAuction = useCallback(() => {
    const teamsNeedingPlayers = checkTeamMinimumPlayers();
    if (teamsNeedingPlayers.length > 0) {
      setStatus('re-auction');
      setReAuctionRound(prev => prev + 1);
      setAuctioneerMessage(`Re-auction round ${reAuctionRound + 1} starting! Teams need more players.`);
      // Keep unsold players for re-auction
      setTimeout(() => continueReAuction(), 3000);
    } else {
      // All teams have minimum players
      setStatus('finished');
      setAuctioneerMessage("Auction complete! All teams have their minimum squads!");
      onAuctionEnd(teams);
    }
  }, [teams, reAuctionRound, checkTeamMinimumPlayers, onAuctionEnd]);
  
  const continueReAuction = useCallback(() => {
    if (unsoldPlayers.length === 0) {
      const teamsNeedingPlayers = checkTeamMinimumPlayers();
      if (teamsNeedingPlayers.length > 0) {
        setAuctioneerMessage(`Teams still need players: ${teamsNeedingPlayers.map(t => t.name).join(', ')}`);
      }
      setStatus('finished');
      onAuctionEnd(teams);
      return;
    }
    // Start re-auction with remaining unsold players
    setCurrentPlayerIndex(0);
    setHighestBidder(null);
    setSkippedTeams(new Set());
    setCurrentBid(unsoldPlayers[0].basePrice);
    setStatus('bidding');
    resetTimer();
    updateAuctioneerMessage({ eventType: 'NEW_PLAYER', playerName: unsoldPlayers[0].name, basePrice: unsoldPlayers[0].basePrice });
  }, [unsoldPlayers, teams, checkTeamMinimumPlayers, resetTimer, updateAuctioneerMessage, onAuctionEnd]);
  
  const nextPlayer = useCallback(() => {
    if (aiActionTimeoutRef.current) clearTimeout(aiActionTimeoutRef.current);

    // Use a functional update to get the latest unsoldPlayers state
    setUnsoldPlayers(prevUnsoldPlayers => {
      if (!prevUnsoldPlayers || prevUnsoldPlayers.length === 0) {
        // No more players, end auction
        setStatus('finished');
        onAuctionEnd(teams);
        return prevUnsoldPlayers;
      }

      // Calculate next index based on current length
      let nextIndex = currentPlayerIndex;
      if (currentPlayerIndex >= prevUnsoldPlayers.length) {
        nextIndex = prevUnsoldPlayers.length - 1;
      }

      if (nextIndex >= prevUnsoldPlayers.length - 1) {
        // Auction round complete, check if re-auction is needed
        setTimeout(() => initializeReAuction(), POST_SALE_DELAY);
        return prevUnsoldPlayers;
      }
      
      nextIndex = nextIndex + 1;
      setCurrentPlayerIndex(nextIndex);
      const player = prevUnsoldPlayers[nextIndex];

      if (!player) {
        // Player not found, end auction
        setStatus('finished');
        onAuctionEnd(teams);
        return prevUnsoldPlayers;
      }

      setStatus('bidding');
      setCurrentBid(player.basePrice);
      setHighestBidder(null);
      setSkippedTeams(new Set());
      resetTimer();
      updateAuctioneerMessage({ eventType: 'NEW_PLAYER', playerName: player.name, basePrice: player.basePrice });
      
      return prevUnsoldPlayers;
    });
  }, [currentPlayerIndex, resetTimer, updateAuctioneerMessage, initializeReAuction, teams, onAuctionEnd]);

  const handleSale = useCallback(() => {
    stopTimer();
    const player = unsoldPlayers[currentPlayerIndex];

    if (!player) {
      // Player not found, move to next
      setTimeout(nextPlayer, POST_SALE_DELAY);
      return;
    }

    if (highestBidder) {
        setStatus('sold');
        const winningTeam = teams.find(t => t.id === highestBidder);
        updateAuctioneerMessage({ eventType: 'PLAYER_SOLD', playerName: player.name, teamName: winningTeam?.name, bidAmount: currentBid });
        
        // Save to Supabase (fire and forget)
        if (winningTeam && player.id) {
          teamService.addPlayerToTeam(winningTeam.id, player.id, currentBid).catch((error) => {
            console.error('Error saving player to team:', error);
          });
          bidService.placeBid('current-auction', winningTeam.id, currentBid).catch((error) => {
            console.error('Error placing bid:', error);
          });
        }
        
        setTeams(prevTeams => prevTeams.map(team => {
            if (team.id === highestBidder) {
                return {
                    ...team,
                    budget: team.budget - currentBid,
                    players: [...team.players, player]
                };
            }
            return team;
        }));
    } else {
        setStatus('unsold');
        updateAuctioneerMessage({ eventType: 'PLAYER_UNSOLD', playerName: player.name });
        // Remove unsold player from the unsold list for re-auction consideration
        // Don't decrement index here - nextPlayer will handle it
        setUnsoldPlayers(prev => prev.filter((_, index) => index !== currentPlayerIndex));
    }

    setTimeout(nextPlayer, POST_SALE_DELAY);
  }, [stopTimer, unsoldPlayers, currentPlayerIndex, highestBidder, currentBid, teams, nextPlayer, updateAuctioneerMessage]);

  useEffect(() => {
    if (timer === 3 && status === 'bidding' && highestBidder) {
        const team = teams.find(t => t.id === highestBidder);
        updateAuctioneerMessage({ eventType: 'TIMER_LOW', teamName: team?.name });
    }
    if (timer <= 0 && status === 'bidding') {
      // MULTIPLAYER: In a real scenario, only the host's client would trigger the sale.
      handleSale();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, status]);

  const startAuction = useCallback(async () => {
    console.log('[startAuction] Called! roomCode:', roomCode, 'allPlayers:', allPlayers?.length);
    // Set teams first
    setTeams(initialTeamsConfig);
    
    const startWithPlayers = (players: Player[]) => {
      if (!players || players.length === 0) {
        console.error('No players available for auction');
        return;
      }
      
      let playersToUse = players;
      
      // For multiplayer, check if shuffled players already exist in room
      if (roomCode) {
        // Will be loaded from room data if available
        console.log('Multiplayer mode: will use shared player order');
      } else {
        // Single player: shuffle locally
        playersToUse = [...players].sort(() => Math.random() - 0.5);
      }
      
      setUnsoldPlayers(playersToUse);
      setCurrentPlayerIndex(0);
      const firstPlayer = playersToUse[0];
      setStatus('bidding');
      setCurrentBid(firstPlayer.basePrice);
      resetTimer();
      updateAuctioneerMessage({ eventType: 'NEW_PLAYER', playerName: firstPlayer.name, basePrice: firstPlayer.basePrice });
      console.log('Auction started with player:', firstPlayer.name);
    };

    // For multiplayer: mark player as ready and wait for all players
    if (roomCode) {
      setWaitingForPlayers(true);
      // Update player ready status - use username from parameter
      const playerUsername = username || userTeamConfig.name;
      await multiplayerService.updateBiddingStatus(roomCode, playerUsername, true);
      
      // Clear any existing interval
      if (readyCheckIntervalRef.current) {
        clearInterval(readyCheckIntervalRef.current);
        readyCheckIntervalRef.current = null;
      }
      
      // Subscribe to room changes to detect when all players are ready
      const checkAllReady = async () => {
        const room = await multiplayerService.getRoomByCode(roomCode);
        if (!room) {
          console.log('[Ready Check] Room not found - stopping interval');
          if (readyCheckIntervalRef.current) {
            clearInterval(readyCheckIntervalRef.current);
            readyCheckIntervalRef.current = null;
          }
          setWaitingForPlayers(false);
          setAuctioneerMessage('Error: Room not found. Please refresh and try again.');
          return;
        }
        
        console.log('[Ready Check] Room status:', room.status);
        
        // If bidding already started, stop checking
        if (room.status === 'bidding_ready') {
          console.log('[Ready Check] Bidding already started, stopping');
          if (readyCheckIntervalRef.current) {
            clearInterval(readyCheckIntervalRef.current);
            readyCheckIntervalRef.current = null;
          }
          return;
        }
        
        // Only check readiness if in auction_started status
        if (room.status !== 'auction_started') {
          console.log('[Ready Check] Wrong status, stopping');
          if (readyCheckIntervalRef.current) {
            clearInterval(readyCheckIntervalRef.current);
            readyCheckIntervalRef.current = null;
          }
          return;
        }
        
        const players = Array.isArray(room.players) ? room.players : [];
        const readyPlayers = players.filter((p: any) => p.isReady);
        console.log(`[Ready Check] ${readyPlayers.length}/${players.length} ready`, players);
        setPlayersReady(readyPlayers.map((p: any) => p.username));
        
        // Check if all players are ready (including single player)
        if (readyPlayers.length === players.length && players.length > 0) {
          console.log('[Ready Check] All players ready! Starting auction...');
          setWaitingForPlayers(false);
          
          // Clear the interval immediately
          if (readyCheckIntervalRef.current) {
            clearInterval(readyCheckIntervalRef.current);
            readyCheckIntervalRef.current = null;
          }
          
          // Load or create shuffled player order
          let shuffledPlayers = (room as any).auction_players as Player[] | null;
          console.log('[Ready Check] Existing auction_players:', shuffledPlayers?.length || 0);
          
          if (!shuffledPlayers || shuffledPlayers.length === 0) {
            // First player ready: shuffle and store
            console.log('[Ready Check] allPlayers available:', allPlayers?.length || 0);
            if (allPlayers && allPlayers.length > 0) {
              shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5);
              console.log('[Ready Check] Created shuffled list:', shuffledPlayers.length);
              await multiplayerService.initializeAuctionPlayers(roomCode, shuffledPlayers);
            } else {
              console.error('[Ready Check] No allPlayers available!');
            }
          }
          
          if (shuffledPlayers && shuffledPlayers.length > 0) {
            console.log('[Ready Check] Calling startWithPlayers with', shuffledPlayers.length, 'players');
            startWithPlayers(shuffledPlayers);
          } else {
            console.error('[Ready Check] Cannot start - no shuffled players');
          }
        }
      };
      
      // Check immediately and set up polling
      await checkAllReady();
      readyCheckIntervalRef.current = setInterval(checkAllReady, 1000);
      
      // Clean up interval after 30 seconds as a fallback
      setTimeout(() => {
        if (readyCheckIntervalRef.current) {
          clearInterval(readyCheckIntervalRef.current);
          readyCheckIntervalRef.current = null;
        }
      }, 30000);
      
      return;
    }

    // Single player mode: start immediately
    if (allPlayers && allPlayers.length > 0) {
      console.log('Starting auction with', allPlayers.length, 'players');
      startWithPlayers(allPlayers);
    } else {
      console.log('Players not loaded yet, attempting to load from imported JSON...');
      // Use imported JSON data as fallback
      const data = playerDataImport as any[];
      if (data && data.length > 0) {
        console.log('Loaded', data.length, 'players from imported JSON');
        const playersWithStringIds = data.map((p: any) => ({
          ...p,
          id: String(p.id),
        }));
        setAllPlayers(playersWithStringIds);
        startWithPlayers(playersWithStringIds);
      } else {
        console.error('No player data available');
        // Only create mock players if JSON loading fails
        const playersToAuction = initialTeamsConfig.map((team, index) => ({
          id: String(index),
          name: `Player ${index + 1}`,
          nationality: 'Unknown',
          position: 'Midfielder' as const,
          rating: 80 + Math.random() * 15,
          basePrice: 500000 + Math.random() * 1000000,
        }));
        console.log('Using mock players as fallback');
        startWithPlayers(playersToAuction);
      }
    }
  }, [initialTeamsConfig, resetTimer, updateAuctioneerMessage, allPlayers, roomCode, userTeamConfig]);


  const placeBid = useCallback(async (teamId: string, amount: number) => {
    // MULTIPLAYER: A socket listener for 'bid-placed' would call this function for all clients.
    const team = teams.find(t => t.id === teamId);
    const player = unsoldPlayers[currentPlayerIndex];
    if (!team || !player || status !== 'bidding' || skippedTeams.has(teamId)) return;

    // Check if team has reached max player limit
    if (team.players.length >= MAX_TEAM_PLAYERS) {
      console.log(`${team.name} has reached maximum of ${MAX_TEAM_PLAYERS} players. Cannot bid.`);
      return;
    }

    if (team.budget >= amount) {
      setCurrentBid(amount);
      setHighestBidder(teamId);
      resetTimer();
      updateAuctioneerMessage({ eventType: 'BID_PLACED', bidAmount: amount, teamName: team.name });
      
      // Sync to database in multiplayer mode
      if (roomCode) {
        const auctionState = {
          currentPlayerIndex,
          currentBid: amount,
          highestBidder: teamId,
          timer: BIDDING_TIME,
          teams
        };
        await multiplayerService.updateAuctionState(roomCode, auctionState);
      }
    }
  }, [teams, unsoldPlayers, currentPlayerIndex, status, skippedTeams, resetTimer, updateAuctioneerMessage, roomCode]);


  const skipPlayer = useCallback((teamId: string) => {
    // MULTIPLAYER: A socket listener for 'player-skipped' would call this function.
    setSkippedTeams(prev => new Set(prev).add(teamId));
  }, []);

  const isTeamEligibleToBid = useCallback((teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return false;
    // Team cannot bid if they reached max player limit
    return team.players.length < MAX_TEAM_PLAYERS;
  }, [teams]);

  const triggerAIBehavior = useCallback(() => {
    if (status !== 'bidding') return;

    teams.forEach(team => {
      if (team.isAI && !skippedTeams.has(team.id) && isTeamEligibleToBid(team.id)) {
        const player = unsoldPlayers[currentPlayerIndex];
        const nextBidAmount = currentBid + BID_INCREMENT;

        // Simple AI logic
        const shouldBid = () => {
          if (team.budget < nextBidAmount) return false;
          // Don't bid against self
          if (highestBidder === team.id) return false;

          let bidProbability = 0.5;
          // Higher rating = more likely to bid
          bidProbability += (player.rating - 85) * 0.05; 
          // Less budget = less likely to bid high
          if (currentBid / team.budget > 0.3) bidProbability -= 0.3;
          
          return Math.random() < bidProbability;
        };

        if (shouldBid()) {
            // AI bids after a random delay
            const delay = Math.random() * 3000 + 1000;
            if(aiActionTimeoutRef.current) clearTimeout(aiActionTimeoutRef.current);
            aiActionTimeoutRef.current = window.setTimeout(() => {
                placeBid(team.id, nextBidAmount);
            }, delay);
        } else {
             // Chance to skip
            if (Math.random() < 0.2) {
                skipPlayer(team.id);
            }
        }
      }
    });
  }, [status, teams, skippedTeams, unsoldPlayers, currentPlayerIndex, currentBid, highestBidder, placeBid, skipPlayer, isTeamEligibleToBid]);

  useEffect(() => {
    if(status === 'bidding') {
        triggerAIBehavior();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highestBidder, currentPlayerIndex, status, teams, currentBid]);

  const handleUserBid = useCallback(() => {
    // MULTIPLAYER: This would emit a 'place-bid' event to the server.
    // e.g., socket.emit('place-bid', { teamId: userTeamId, amount: currentBid + BID_INCREMENT });
    if (status !== 'bidding') return;
    placeBid(userTeamId, currentBid + BID_INCREMENT);
  }, [userTeamId, status, currentBid, placeBid]);
  
  const handleUserSkip = useCallback(() => {
    // MULTIPLAYER: This would emit a 'skip-player' event to the server.
    // e.g., socket.emit('skip-player', { teamId: userTeamId });
    if (status !== 'bidding') return;
    skipPlayer(userTeamId);
  }, [userTeamId, status, skipPlayer]);

  const toggleMute = () => setIsMuted(prev => !prev);
  
  return {
    status,
    teams,
    currentPlayer: unsoldPlayers[currentPlayerIndex],
    currentBid,
    highestBidder,
    timer,
    auctioneerMessage,
    placeBid: handleUserBid,
    skipPlayer: handleUserSkip,
    isUserTurn: teams.find(t => t.id === userTeamId)?.budget >= (currentBid + BID_INCREMENT),
    userHasSkipped: skippedTeams.has(userTeamId),
    startAuction,
    isMuted,
    toggleMute,
    waitingForPlayers,
    playersReady
  };
};

export default useAuction;
