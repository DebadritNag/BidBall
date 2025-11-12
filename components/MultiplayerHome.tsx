import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Title from './Title';

interface MultiplayerHomeProps {
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onBack: () => void;
}

const MultiplayerHome: React.FC<MultiplayerHomeProps> = ({ onCreateRoom, onJoinRoom, onBack }) => {
  const [joinCode, setJoinCode] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onJoinRoom(joinCode.trim().toUpperCase());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4"
    >
      <Title />
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-yellow-500/20 w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-center text-yellow-400 mb-6">Multiplayer</h2>
        
        <button
          onClick={onCreateRoom}
          className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg text-xl hover:bg-yellow-400 transition-colors duration-300 transform hover:scale-105 mb-6"
        >
          Create Room
        </button>

        <div className="flex items-center my-4">
            <hr className="flex-grow border-gray-600"/>
            <span className="mx-4 text-gray-400">OR</span>
            <hr className="flex-grow border-gray-600"/>
        </div>
        
        <form onSubmit={handleJoinSubmit}>
          <h3 className="text-xl font-semibold text-yellow-300 mb-3">Join a Room</h3>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter Room Code"
            maxLength={6}
            className="w-full text-center uppercase bg-gray-700/50 text-white border-2 border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:border-yellow-500 transition-colors duration-300 mb-4"
            required
          />
          <button
            type="submit"
            disabled={!joinCode.trim()}
            className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-xl hover:bg-green-500 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Join
          </button>
        </form>
        
        <button onClick={onBack} className="text-gray-400 hover:text-yellow-400 transition-colors mt-8">
            &larr; Back to Lobby
        </button>
      </div>
    </motion.div>
  );
};

export default MultiplayerHome;
