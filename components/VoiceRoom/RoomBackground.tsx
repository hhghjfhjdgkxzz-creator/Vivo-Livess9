
import React from 'react';

interface RoomBackgroundProps {
  background: string;
}

const RoomBackground: React.FC<RoomBackgroundProps> = ({ background }) => {
  const isImage = background?.includes('http') || background?.includes('data:image');

  return (
    <div className="absolute inset-0 z-0">
      {isImage ? (
        <img src={background} className="w-full h-full object-cover" alt="Room Background" />
      ) : (
        <div className="w-full h-full" style={{ background: background || '#020617' }}></div>
      )}
      {/* طبقات الشفافية والعمق */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90"></div>
    </div>
  );
};

export default RoomBackground;
