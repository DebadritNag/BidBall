// Simple room synchronization using localStorage
// In production, use WebSocket or similar for real-time communication

interface RoomPlayer {
  username: string;
  isHost: boolean;
  teamId?: string;
  teamName?: string;
}

interface RoomState {
  roomCode: string;
  players: RoomPlayer[];
  status: 'waiting' | 'auction_started';
  auctionTeams?: any[];
  timestamp: number;
}

const ROOM_STORAGE_KEY = (roomCode: string) => `bidball_room_${roomCode}`;
const POLL_INTERVAL = 500; // 500ms polling interval

export const roomSync = {
  // Create or get a room
  initializeRoom: (roomCode: string, username: string, isHost: boolean): RoomState => {
    const key = ROOM_STORAGE_KEY(roomCode);
    const existing = localStorage.getItem(key);
    
    if (existing && isHost) {
      // Host is reconnecting, use existing room
      return JSON.parse(existing);
    }
    
    if (existing) {
      // Player joining existing room
      const room: RoomState = JSON.parse(existing);
      const playerExists = room.players.some(p => p.username === username);
      if (!playerExists) {
        room.players.push({ username, isHost: false });
        room.timestamp = Date.now();
        localStorage.setItem(key, JSON.stringify(room));
      }
      return room;
    }
    
    // Create new room
    const newRoom: RoomState = {
      roomCode,
      players: [{ username, isHost }],
      status: 'waiting',
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(newRoom));
    return newRoom;
  },

  // Add player to room
  addPlayer: (roomCode: string, username: string): RoomState | null => {
    const key = ROOM_STORAGE_KEY(roomCode);
    const room = localStorage.getItem(key);
    
    if (!room) return null;
    
    const roomState: RoomState = JSON.parse(room);
    const playerExists = roomState.players.some(p => p.username === username);
    
    if (!playerExists) {
      roomState.players.push({ username, isHost: false });
      roomState.timestamp = Date.now();
      localStorage.setItem(key, JSON.stringify(roomState));
    }
    
    return roomState;
  },

  // Get current room state
  getRoomState: (roomCode: string): RoomState | null => {
    const key = ROOM_STORAGE_KEY(roomCode);
    const room = localStorage.getItem(key);
    return room ? JSON.parse(room) : null;
  },

  // Update room state for auction start
  startAuction: (roomCode: string, teams: any[]): void => {
    const key = ROOM_STORAGE_KEY(roomCode);
    const room = localStorage.getItem(key);
    
    if (room) {
      const roomState: RoomState = JSON.parse(room);
      roomState.status = 'auction_started';
      roomState.auctionTeams = teams;
      roomState.timestamp = Date.now();
      localStorage.setItem(key, JSON.stringify(roomState));
    }
  },

  // Subscribe to room changes (polling-based)
  subscribeToRoom: (roomCode: string, callback: (room: RoomState) => void): (() => void) => {
    let lastTimestamp = 0;
    
    const interval = setInterval(() => {
      const room = roomSync.getRoomState(roomCode);
      if (room && room.timestamp > lastTimestamp) {
        lastTimestamp = room.timestamp;
        callback(room);
      }
    }, POLL_INTERVAL);
    
    // Return unsubscribe function
    return () => clearInterval(interval);
  },

  // Clean up room (call when host leaves)
  cleanupRoom: (roomCode: string): void => {
    const key = ROOM_STORAGE_KEY(roomCode);
    localStorage.removeItem(key);
  },

  // Remove player from room
  removePlayer: (roomCode: string, username: string): void => {
    const key = ROOM_STORAGE_KEY(roomCode);
    const room = localStorage.getItem(key);
    
    if (room) {
      const roomState: RoomState = JSON.parse(room);
      roomState.players = roomState.players.filter(p => p.username !== username);
      roomState.timestamp = Date.now();
      
      if (roomState.players.length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(roomState));
      }
    }
  },
};
