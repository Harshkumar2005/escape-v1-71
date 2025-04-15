import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, Music, X, Minimize2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

export interface Song {
  id: string;
  song: string;
  singers: string;
  image: string;
  media_url: string;
  duration: string;
  album?: string;
}

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  searchResults: Song[];
  searchQuery: string;
  showMusicPanel: boolean;
  isMinimized: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  playSong: (song: Song) => void;
  togglePlay: () => void;
  setSearchQuery: (query: string) => void;
  searchSongs: () => Promise<void>;
  toggleMusicPanel: () => void;
  toggleMinimize: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  handleNext: () => void;
  handlePrevious: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Optionally play next song
      handleNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setTimeout(() => {
      if (audioRef.current) {
        // Handle both MP3 and MP4 audio files
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
      }
    }, 100);
  };

  const togglePlay = () => {
    if (!currentSong) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(err => {
        console.error('Error playing audio:', err);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const searchSongs = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSearchResults(data.map((item: any) => ({
          id: item.id,
          song: item.song,
          singers: item.singers,
          image: item.image,
          media_url: item.media_url,
          duration: item.duration,
          album: item.album
        })));
        setShowMusicPanel(true);
        setIsMinimized(false);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching songs:', error);
      setSearchResults([]);
    }
  };

  const toggleMusicPanel = () => {
    setShowMusicPanel(prev => !prev);
    if (isMinimized) setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const handleNext = () => {
    if (!currentSong || searchResults.length === 0) return;
    
    const currentIndex = searchResults.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1 || currentIndex === searchResults.length - 1) return;
    
    const nextSong = searchResults[currentIndex + 1];
    playSong(nextSong);
  };

  const handlePrevious = () => {
    if (!currentSong || searchResults.length === 0) return;
    
    const currentIndex = searchResults.findIndex(song => song.id === currentSong.id);
    if (currentIndex === -1 || currentIndex === 0) return;
    
    const prevSong = searchResults[currentIndex - 1];
    playSong(prevSong);
  };

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        isPlaying,
        searchResults,
        searchQuery,
        showMusicPanel,
        isMinimized,
        volume,
        currentTime,
        duration,
        audioRef,
        playSong,
        togglePlay,
        setSearchQuery,
        searchSongs,
        toggleMusicPanel,
        toggleMinimize,
        setVolume,
        setCurrentTime,
        handleNext,
        handlePrevious
      }}
    >
      {children}
      {/* Audio element supporting both mp3 and mp4 formats */}
      <audio ref={audioRef} />
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

// MusicPlayerPanel component with improved design for code editor
export const MusicPlayerPanel: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    searchResults,
    searchQuery,
    isMinimized,
    volume,
    currentTime,
    duration,
    setSearchQuery,
    searchSongs,
    playSong,
    togglePlay,
    toggleMusicPanel,
    toggleMinimize,
    setVolume,
    setCurrentTime,
    handleNext,
    handlePrevious
  } = useMusic();
  
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.7);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  const handleVolumeToggle = () => {
    if (isMuted) {
      setVolume(prevVolume);
    } else {
      setPrevVolume(volume);
      setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchSongs();
  };

  if (isMinimized && currentSong) {
    return (
      <div className="fixed bottom-0 right-0 w-64 bg-zinc-900 border-l border-t border-zinc-700 shadow-lg rounded-tl-md overflow-hidden z-50">
        <div className="p-3 flex justify-between items-center border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <button 
              className="h-6 w-6 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 transition-colors"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <span className="text-xs font-medium text-zinc-300 truncate max-w-32" title={currentSong.song}>
              {truncateText(currentSong.song, 30)}
            </span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleMinimize}>
              <ChevronUp size={14} className="text-zinc-400" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleMusicPanel}>
              <X size={14} className="text-zinc-400" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-80 md:w-96 bg-zinc-900 border-l border-t border-zinc-700 shadow-lg rounded-tl-md overflow-hidden z-50 flex flex-col h-96 max-h-[80vh]">
      <div className="flex justify-between items-center p-3 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2">
          <Music size={16} className="text-indigo-400" />
          <span className="text-sm font-semibold text-zinc-300">Code Player</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-zinc-800" onClick={toggleMinimize}>
            <Minimize2 size={14} className="text-zinc-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-zinc-800" onClick={toggleMusicPanel}>
            <X size={14} className="text-zinc-400" />
          </Button>
        </div>
      </div>

      <div className="p-3 border-b border-zinc-800 bg-zinc-950/70">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search for songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200 text-sm h-8 placeholder:text-zinc-500"
          />
          <Button type="submit" size="sm" variant="secondary" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white border-none">
            <Search size={14} className="mr-1" />
            <span className="text-xs">Search</span>
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto bg-zinc-900/90 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 p-3">
            {searchResults.map((song) => (
              <div
                key={song.id}
                className={`flex flex-col rounded-md overflow-hidden border transition-all hover:border-indigo-500/50 cursor-pointer ${
                  currentSong?.id === song.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-800/50'
                }`}
                onClick={() => playSong(song)}
              >
                <div className="relative aspect-square bg-zinc-950">
                  <img
                    src={song.image}
                    alt={song.song}
                    className="w-full h-full object-cover opacity-90"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/70 opacity-0 hover:opacity-100 transition-opacity">
                    <button className="p-3 bg-indigo-600/90 rounded-full">
                      {currentSong?.id === song.id && isPlaying ? (
                        <Pause size={18} className="text-white" />
                      ) : (
                        <Play size={18} className="text-white" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  <h3 className="font-medium text-xs line-clamp-1 text-zinc-200" title={song.song}>
                    {song.song}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-1" title={song.singers}>
                    {truncateText(song.singers, 30)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery && !searchResults.length ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-500">No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Music size={40} className="text-indigo-400/50 mb-3" />
            <h3 className="text-lg font-medium mb-1 text-zinc-300">Code & Music</h3>
            <p className="text-zinc-500 text-sm max-w-64">
              Search for your favorite tracks to enhance your coding experience
            </p>
          </div>
        )}
      </div>

      {currentSong && (
        <div className="p-3 border-t border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <img
              src={currentSong.image}
              alt={currentSong.song}
              className="w-12 h-12 rounded object-cover border border-zinc-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop';
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate text-zinc-200" title={currentSong.song}>
                {currentSong.song}
              </h3>
              <p className="text-xs text-zinc-500 truncate" title={currentSong.singers}>
                {truncateText(currentSong.singers, 40)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-zinc-500 font-mono">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  className="flex-1 h-1"
                  onValueChange={([value]) => setCurrentTime(value)}
                />
                <span className="text-[10px] text-zinc-500 font-mono">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                onClick={handleVolumeToggle}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={16} />
                ) : (
                  <Volume2 size={16} />
                )}
              </Button>
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                className="w-16 h-1"
                onValueChange={([value]) => {
                  setVolume(value / 100);
                  if (value > 0 && isMuted) setIsMuted(false);
                }}
              />
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                onClick={handlePrevious}
              >
                <SkipBack size={16} />
              </Button>
              <Button 
                variant="default" 
                size="icon"
                className="h-9 w-9 rounded-full bg-indigo-600 hover:bg-indigo-700 border-none"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                onClick={handleNext}
              >
                <SkipForward size={16} />
              </Button>
            </div>
            
            <div className="w-16"></div> {/* Spacer to balance the layout */}
          </div>
        </div>
      )}
    </div>
  );
};

// MusicStatusBar component for the code editor status bar
export const MusicStatusBar: React.FC = () => {
  const { currentSong, isPlaying, togglePlay, toggleMusicPanel } = useMusic();

  if (!currentSong) return null;

  return (
    <div className="flex items-center gap-2 cursor-pointer px-2 py-1 hover:bg-zinc-800/50 rounded-sm text-zinc-300" onClick={toggleMusicPanel}>
      <button 
        className="flex items-center justify-center h-4 w-4 rounded-full bg-indigo-600"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      >
        {isPlaying ? <Pause size={10} className="text-white" /> : <Play size={10} className="text-white ml-0.5" />}
      </button>
      
      <div className="flex items-center max-w-32">
        <span className="font-medium text-xs truncate">{currentSong.song}</span>
      </div>
      
      {isPlaying && (
        <div className="flex items-center h-3 gap-[2px]">
          {[1, 2, 3].map((bar) => (
            <div 
              key={bar}
              className="w-[2px] bg-indigo-400 rounded-full animate-pulse"
              style={{
                height: `${5 + Math.random() * 5}px`,
                animationDelay: `${bar * 0.1}s`
              }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};

// Add a floating button to open the music player when it's closed
export const MusicFloatingButton: React.FC = () => {
  const { showMusicPanel, toggleMusicPanel } = useMusic();
  
  if (showMusicPanel) return null;
  
  return (
    <button 
      className="fixed bottom-4 right-4 h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center shadow-lg z-50 transition-all hover:scale-105"
      onClick={toggleMusicPanel}
    >
      <Music size={18} className="text-white" />
    </button>
  );
};
