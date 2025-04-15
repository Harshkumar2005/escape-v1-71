
import React from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { Play, Pause, Music } from 'lucide-react';

const MusicStatusBar: React.FC = () => {
  const { currentSong, isPlaying, togglePlay, toggleMusicPanel } = useMusic();

  if (!currentSong) return null;

  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={toggleMusicPanel}>
      <button 
        className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/20"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      >
        {isPlaying ? <Pause size={10} /> : <Play size={10} />}
      </button>
      
      <div className="flex items-center max-w-[200px]">
        <span className="font-medium text-xs truncate">{currentSong.song}</span>
      </div>
      
      {isPlaying && (
        <div className="flex items-center h-4 gap-[2px]">
          {[1, 2, 3, 4].map((bar) => (
            <div 
              key={bar}
              className="w-[2px] bg-primary rounded-full animate-pulse"
              style={{
                height: `${6 + Math.random() * 6}px`,
                animationDelay: `${bar * 0.1}s`
              }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MusicStatusBar;
