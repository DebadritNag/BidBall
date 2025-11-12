
import React, { useCallback } from 'react';
import { formatCurrency } from '../utils/formatters';

interface BiddingControlsProps {
  onBid: () => void;
  onSkip: () => void;
  isBiddingActive: boolean;
  canAfford: boolean;
  hasSkipped: boolean;
  nextBidAmount: number;
}

const BiddingControls: React.FC<BiddingControlsProps> = ({
  onBid, onSkip, isBiddingActive, canAfford, hasSkipped, nextBidAmount
}) => {
  const isBidDisabled = !isBiddingActive || !canAfford || hasSkipped;
  const isSkipDisabled = !isBiddingActive || hasSkipped;

  const handleBidClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isBidDisabled) {
      onBid();
    }
  }, [isBidDisabled, onBid]);

  const handleSkipClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSkipDisabled) {
      onSkip();
    }
  }, [isSkipDisabled, onSkip]);

  const getButtonTooltip = () => {
    if (hasSkipped) return "You have skipped this player";
    if (!canAfford) return "Not enough budget";
    if (!isBiddingActive) return "Bidding is not active";
    return "";
  };

  return (
    <div className="flex items-stretch gap-4 w-full max-w-md">
      <button
        type="button"
        onClick={handleBidClick}
        disabled={isBidDisabled}
        title={getButtonTooltip()}
        className="flex-grow bg-green-600 text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-green-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none flex flex-col items-center active:scale-95"
      >
        <span>BID</span>
        <span className="text-xs font-normal">{formatCurrency(nextBidAmount)}</span>
      </button>
      <button
        type="button"
        onClick={handleSkipClick}
        disabled={isSkipDisabled}
        title={hasSkipped ? "You have already skipped" : ""}
        className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-red-500 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none active:scale-95"
      >
        SKIP
      </button>
    </div>
  );
};

export default BiddingControls;
