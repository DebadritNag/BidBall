import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Title from './Title';

interface SignupPageProps {
  onSignup: (username: string) => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignup }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length >= 3) {
      onSignup(username.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4"
    >
      <Title />
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-yellow-500/20 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-yellow-400 mb-6">Create Your Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="username" className="block text-yellow-300 text-sm font-bold mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-gray-700/50 text-white border-2 border-gray-600 rounded-lg py-3 px-4 focus:outline-none focus:border-yellow-500 transition-colors duration-300"
              required
              minLength={3}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={username.trim().length < 3}
            className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg text-xl hover:bg-yellow-400 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105"
          >
            Enter Lobby
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default SignupPage;
