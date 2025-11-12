import React from 'react';
import { motion } from 'framer-motion';
import Title from './Title';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(234,179,8,0.2),rgba(255,255,255,0))]"
    >
      <div className="bg-gray-800/30 backdrop-blur-sm p-10 rounded-2xl shadow-2xl border border-yellow-500/20 max-w-3xl">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Title />
        </motion.div>

        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-lg md:text-xl text-gray-300 max-w-xl mx-auto mb-10"
        >
          Experience the thrill of a live football player auction. Build your dream team, outbid your rivals, and lead your squad to glory.
        </motion.p>

        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, delay: 0.6 }}
          onClick={onGetStarted}
          className="bg-yellow-500 text-gray-900 font-bold py-4 px-10 rounded-lg text-xl hover:bg-yellow-400 transition-colors duration-300 transform hover:scale-105 shadow-lg shadow-yellow-500/20"
        >
          Get Started
        </motion.button>
      </div>
    </motion.div>
  );
};

export default LandingPage;
