import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, Music } from 'lucide-react';
import { PauseBtn, PlayBtn } from 'react-bootstrap-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
  volume: number;
  currentTime: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  playSong: (song: Song) => void;
  togglePlay: () => void;
  setSearchQuery: (query: string) => void;
  searchSongs: () => Promise<void>;
  toggleMusicPanel: () => void;
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
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Effect to handle the debounced search as user types
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if query is empty
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Set a new timeout to search after 1 second of inactivity
    searchTimeoutRef.current = setTimeout(() => {
      searchSongs();
    }, 1000);

    // Cleanup function to clear timeout if component unmounts or query changes again
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]); // Run this effect whenever searchQuery changes

  const playSong = (song: Song) => {
    setCurrentSong(song);

    // Set the source immediately and then play
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = song.media_url;
        audioRef.current.load();
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
      }
    }, 0);
  };

  const togglePlay = () => {
    if (!currentSong) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
    }
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
        volume,
        currentTime,
        duration,
        audioRef,
        playSong,
        togglePlay,
        setSearchQuery,
        searchSongs,
        toggleMusicPanel,
        setVolume,
        setCurrentTime,
        handleNext,
        handlePrevious
      }}
    >
      {children}
      <audio ref={audioRef} style={{ display: 'none' }} />
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

// MusicPlayerPanel component integrated in the same file
export const MusicPlayerPanel: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    searchResults,
    searchQuery,
    volume,
    currentTime,
    duration,
    setSearchQuery,
    playSong,
    togglePlay,
    setVolume,
    setCurrentTime,
    handleNext,
    handlePrevious
  } = useMusic();

  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' && e.altKey) {
        handleNext();
      } else if (e.code === 'ArrowLeft' && e.altKey) {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleNext, handlePrevious]);

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

  // Updated to handle input change and automatically trigger search via useEffect
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsLoading(true);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsLoading(false);
    }
  }, [searchResults, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground rounded-none text-sm">
      {/* Search Header */}
      <div className="px-1.5 py-2 border-b bg-sidebar flex justify-between items-center">
        <div className="flex gap-2 w-full relative">
          <Input
            type="text"
            placeholder="Search for songs..."
            value={searchQuery}
            onChange={handleInputChange}
            className="h-6 w-full bg-sidebar bg-opacity-10 text-sm px-3 py-1 rounded border-none text-sidebar-foreground outline-none"
            autoFocus 
          />
          {isLoading && searchQuery.trim() && (
            <div className="hidden absolute right-2 top-1">
              <div className="w-4 h-4 border-2 border-t-transparent border-slate-300 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto bg-sidebar" style={{scrollbarWidth: 'none'}}>
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 p-2 md:grid-cols-3" style={{scrollbarWidth: 'none'}}>
            {searchResults.map((song) => (
              <div
                key={song.id}
                className={`flex items-center gap-3 p-2 rounded-md border transition-all hover:shadow-sm cursor-pointer ${currentSong?.id === song.id ? 'bg-[#272b34]' : 'bg-sidebar'
                  }`}
                onClick={() => playSong(song)}
              >
                <img
                  src={song.image}
                  alt={song.song}
                  className="w-10 h-10 rounded-sm object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-1 text-[#d4d4d4]" title={song.song}>
                    {song.song}
                  </h3>
                  <p className="text-xs text-[#858585] line-clamp-1" title={song.singers}>
                    {truncateText(song.singers, 30)}
                  </p>
                </div>
                <button
                  className="hidden p-2 rounded-md bg-[#2c313c] hover:bg-[#333333]"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentSong?.id === song.id) {
                      togglePlay();
                    } else {
                      playSong(song);
                    }
                  }}
                >
                  {currentSong?.id === song.id && isPlaying ? (
                    <Pause size={16} />
                  ) : (
                    <Play size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : searchQuery && !searchResults.length ? (
          <div className="flex items-center justify-center h-full">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="hidden w-8 h-8 border-4 border-t-transparent border-slate-300 rounded-full animate-spin mb-2"></div>
                <p className="text-zinc-400">Searching for: "{searchQuery}"</p>
              </div>
            ) : (
              <p className="text-zinc-400">No results found for: "{searchQuery}"</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Music size={32} className="text-zinc-400 mb-2" />
            <p className="text-[#858585]">Search for music to start listening</p>
          </div>
        )}
      </div>

      {/* Player Controls */}
      {currentSong && (
        <div className="hidden p-3 border-t border-[#3c3c3c] bg-[#252526]">
          <div className="flex items-center justify-between">
            {/* Left: Song Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={currentSong.image}
                alt={currentSong.song}
                className="w-10 h-10 rounded-sm object-cover border border-[#3c3c3c]/50"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
                }}
              />
              <div className="min-w-0">
                <h3 className="font-medium truncate text-sm text-[#d4d4d4]" title={currentSong.song}>
                  {currentSong.song}
                </h3>
                <p className="text-xs text-[#858585] truncate" title={currentSong.singers}>
                  {truncateText(currentSong.singers, 30)}
                </p>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3c3c3c]"
              >
                <SkipBack size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-[#0e639c] hover:bg-[#1177bb] text-white"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3c3c3c]"
              >
                <SkipForward size={16} />
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleVolumeToggle}
                      className="text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3c3c3c]"
                    >
                      {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Volume: {Math.round(volume * 100)}%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                className="w-20"
                onValueChange={([value]) => {
                  setVolume(value / 100);
                  if (value > 0 && isMuted) setIsMuted(false);
                }}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-[#858585]">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              className="flex-1"
              onValueChange={([value]) => setCurrentTime(value)}
            />
            <span className="text-xs text-[#858585]">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// MusicStatusBar component integrated in the same file
export const MusicStatusBar: React.FC = () => {
  const { currentSong, isPlaying, togglePlay, toggleMusicPanel } = useMusic();

  if (!currentSong) return null;

  return (
    <div
      className="flex items-center gap-1.5 rounded-md cursor-pointer transition-colors"
      onClick={toggleMusicPanel}
    >
      {isPlaying && (
        <div className="flex items-center pt-0.5 h-4 gap-[2px]">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className="w-[2px] bg-slate-400 rounded-full animate-pulse"
              style={{
                height: `${6 + Math.random() * 6}px`,
                animationDelay: `${bar * 0.1}s`
              }}
            ></div>
          ))}
        </div>
      )}
      
      <div className="flex items-center max-w-[200px]">
        <span className="text-[13px] truncate text-slate-400">{currentSong.song}</span>
      </div>
      <button
        className="flex items-center justify-center transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      >
        {isPlaying ? <PauseBtn size={17} className="pt-0.5" /> : <PlayBtn size={17} className="pt-0.5" />}
      </button>
    </div>
  );
};


/*import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, Music } from 'lucide-react';
import { PauseBtn, PlayBtn } from 'react-bootstrap-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
  volume: number;
  currentTime: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  playSong: (song: Song) => void;
  togglePlay: () => void;
  setSearchQuery: (query: string) => void;
  searchSongs: () => Promise<void>;
  toggleMusicPanel: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  handleNext: () => void;
  handlePrevious: () => void;
}

const MusicContext = createContext < MusicContextType | undefined > (undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState < Song | null > (null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchResults, setSearchResults] = useState < Song[] > ([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef < HTMLAudioElement > (null);

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

    // Set the source immediately and then play
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = song.media_url;
        audioRef.current.load();
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
      }
    }, 0);
  };

  const togglePlay = () => {
    if (!currentSong) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
    }
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
        volume,
        currentTime,
        duration,
        audioRef,
        playSong,
        togglePlay,
        setSearchQuery,
        searchSongs,
        toggleMusicPanel,
        setVolume,
        setCurrentTime,
        handleNext,
        handlePrevious
      }}
    >
      {children}
      <audio ref={audioRef} style={{ display: 'none' }} />
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

// MusicPlayerPanel component integrated in the same file
export const MusicPlayerPanel: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    searchResults,
    searchQuery,
    volume,
    currentTime,
    duration,
    setSearchQuery,
    searchSongs,
    playSong,
    togglePlay,
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
      } else if (e.code === 'ArrowRight' && e.altKey) {
        handleNext();
      } else if (e.code === 'ArrowLeft' && e.altKey) {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleNext, handlePrevious]);

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

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground rounded-none text-sm">
      {/* Search Header *///}
     /* <div className="px-1.5 py-2 border-b bg-sidebar flex justify-between items-center">
        <form onSubmit={handleSearch} className="flex gap-2 w-full">
          <Input
            type="text"
            placeholder="Search for songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-6 w-full bg-sidebar bg-opacity-10 text-sm px-3 py-1 rounded border-none text-sidebar-foreground outline-none"
            autoFocus 
            />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="hidden hover:bg-[#cccccc29] bg-[#cccccc29] text-[#d4d4d4]"
          >
            <Search size={16} className="" />
            Search
          </Button>
        </form>
      </div>

      {/* Search Results *///}
     /* <div className="flex-1 overflow-y-auto bg-sidebar" style={{scrollbarWidth: 'none'}}>
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 p-2 md:grid-cols-3" style={{scrollbarWidth: 'none'}}>
            {searchResults.map((song) => (
              <div
                key={song.id}
                className={`flex items-center gap-3 p-2 rounded-md border transition-all hover:shadow-sm cursor-pointer ${currentSong?.id === song.id ? 'bg-[#272b34]' : 'bg-sidebar'
                  }`}
                onClick={() => playSong(song)}
              >
                <img
                  src={song.image}
                  alt={song.song}
                  className="w-10 h-10 rounded-sm object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-1 text-[#d4d4d4]" title={song.song}>
                    {song.song}
                  </h3>
                  <p className="text-xs text-[#858585] line-clamp-1" title={song.singers}>
                    {truncateText(song.singers, 30)}
                  </p>
                </div>
                <button
                  className="hidden p-2 rounded-md bg-[#2c313c] hover:bg-[#333333]"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentSong?.id === song.id) {
                      togglePlay();
                    } else {
                      playSong(song);
                    }
                  }}
                >
                  {currentSong?.id === song.id && isPlaying ? (
                    <Pause size={16} />
                  ) : (
                    <Play size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : searchQuery && !searchResults.length ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[#858585]">No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Music size={32} className="text-[#858585]/50 mb-2" />
            <p className="text-[#858585]">Search for music to start listening</p>
          </div>
        )}
      </div>

      {/* Player Controls *///}
     /* {currentSong && (
        <div className="hidden p-3 border-t border-[#3c3c3c] bg-[#252526]">
          <div className="flex items-center justify-between">
            {/* Left: Song Info *///}
          /*  <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src={currentSong.image}
                alt={currentSong.song}
                className="w-10 h-10 rounded-sm object-cover border border-[#3c3c3c]/50"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
                }}
              />
              <div className="min-w-0">
                <h3 className="font-medium truncate text-sm text-[#d4d4d4]" title={currentSong.song}>
                  {currentSong.song}
                </h3>
                <p className="text-xs text-[#858585] truncate" title={currentSong.singers}>
                  {truncateText(currentSong.singers, 30)}
                </p>
              </div>
            </div>

            {/* Right: Controls *///}
            /*<div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3c3c3c]"
              >
                <SkipBack size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-[#0e639c] hover:bg-[#1177bb] text-white"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3c3c3c]"
              >
                <SkipForward size={16} />
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleVolumeToggle}
                      className="text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3c3c3c]"
                    >
                      {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Volume: {Math.round(volume * 100)}%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                className="w-20"
                onValueChange={([value]) => {
                  setVolume(value / 100);
                  if (value > 0 && isMuted) setIsMuted(false);
                }}
              />
            </div>
          </div>

          {/* Progress Bar *///}
        /*  <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-[#858585]">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              className="flex-1"
              onValueChange={([value]) => setCurrentTime(value)}
            />
            <span className="text-xs text-[#858585]">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// MusicStatusBar component integrated in the same file
export const MusicStatusBar: React.FC = () => {
  const { currentSong, isPlaying, togglePlay, toggleMusicPanel } = useMusic();

  if (!currentSong) return null;

  return (
    <div
      className="flex items-center gap-1.5 rounded-md cursor-pointertransition-colors"
      onClick={toggleMusicPanel}
    >
 

  {isPlaying && (
        <div className="flex items-center pt-0.5 h-4 gap-[2px]">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className="w-[2px] bg-slate-400 rounded-full animate-pulse"
              style={{
                height: `${6 + Math.random() * 6}px`,
                animationDelay: `${bar * 0.1}s`
              }}
            ></div>
          ))}
        </div>
      )}
      
      <div className="flex items-center max-w-[200px]">
        <span className="text-[13px] truncate text-slate-400">{currentSong.song}</span>
      </div>
     <button
        className="flex items-center justify-center transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      >
        {isPlaying ? <PauseBtn size={17} className="pt-0.5" /> : <PlayBtn size={17} className="pt-0.5" />}
      </button>
    
    </div>
  );
};
*/
