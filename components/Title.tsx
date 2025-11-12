
import React from 'react';

const Title: React.FC<{ small?: boolean }> = ({ small = false }) => {
  return (
    <div className={small ? 'mb-2' : 'mb-8'}>
      <h1 className={`font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 ${small ? 'text-2xl' : 'text-5xl'}`}>
        BidBall
      </h1>
      {!small && <p className="text-center text-gray-400">Football Auction League</p>}
    </div>
  );
}

export default Title;
