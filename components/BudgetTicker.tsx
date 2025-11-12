
import React from 'react';
import { Team } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BudgetTickerProps {
  teams: Team[];
}

const BudgetTicker: React.FC<BudgetTickerProps> = ({ teams }) => {
  const tickerItems = [...teams, ...teams]; // Duplicate for seamless loop

  return (
    <div className="bg-black/50 backdrop-blur-md w-full overflow-hidden h-12">
      <div className="animate-ticker flex items-center h-full">
        {tickerItems.map((team, index) => (
          <div key={`${team.id}-${index}`} className="flex items-center mx-6 flex-shrink-0">
            <img src={team.logo} alt={team.name} className="w-8 h-8 mr-3" />
            <span className="text-sm font-semibold text-white mr-2">{team.name}:</span>
            <span className="text-sm font-bold text-green-400">{formatCurrency(team.budget)}</span>
            <div className="w-px h-6 bg-yellow-500/30 mx-6"></div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 40s linear infinite;
          width: fit-content;
        }
      `}</style>
    </div>
  );
};

export default BudgetTicker;
