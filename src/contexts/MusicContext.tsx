
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, Music } from 'lucide-react';
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

  return (
    <div className="flex flex-col h-full bg-terminal text-terminal-foreground">
      <div className="px-4 py-3 border-b border-border bg-sidebar">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search for songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-card text-card-foreground"
          />
          <Button type="submit" size="sm" variant="secondary">
            <Search size={16} className="mr-2" />
            Search
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto bg-card/50">
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
            {searchResults.map((song) => (
              <div
                key={song.id}
                className={`flex flex-col rounded-md overflow-hidden border border-border transition-all hover:shadow-md cursor-pointer bg-muted/40 ${
                  currentSong?.id === song.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => playSong(song)}
              >
                <div className="relative aspect-square bg-black/50">
                  <img
                    src={song.image}
                    alt={song.song}
                    className="w-full h-full object-cover opacity-90"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity">
                    <button className="p-3 bg-primary/80 rounded-full">
                      {currentSong?.id === song.id && isPlaying ? (
                        <Pause size={20} />
                      ) : (
                        <Play size={20} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1 text-foreground" title={song.song}>
                    {song.song}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1" title={song.singers}>
                    {truncateText(song.singers, 30)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery && !searchResults.length ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <h3 className="text-xl font-medium mb-2 text-foreground">Welcome to the Music Player</h3>
            <p className="text-muted-foreground mb-4">
              Search for your favorite songs and start listening!
            </p>
            <Music size={48} className="text-muted-foreground/50" />
          </div>
        )}
      </div>

      {currentSong && (
        <div className="p-4 border-t border-border bg-sidebar">
          <div className="flex items-center gap-4">
            <img
              src={currentSong.image}
              alt={currentSong.song}
              className="w-16 h-16 rounded-md object-cover border border-border/50"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate text-foreground" title={currentSong.song}>
                {currentSong.song}
              </h3>
              <p className="text-sm text-muted-foreground truncate" title={currentSong.singers}>
                {truncateText(currentSong.singers, 40)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  className="flex-1"
                  onValueChange={([value]) => setCurrentTime(value)}
                />
                <span className="text-xs text-muted-foreground">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVolumeToggle}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={20} className="text-muted-foreground" />
                ) : (
                  <Volume2 size={20} className="text-muted-foreground" />
                )}
              </Button>
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                className="w-24"
                onValueChange={([value]) => {
                  setVolume(value / 100);
                  if (value > 0 && isMuted) setIsMuted(false);
                }}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handlePrevious}>
                <SkipBack size={20} className="text-muted-foreground" />
              </Button>
              <Button 
                variant="default" 
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleNext}>
                <SkipForward size={20} className="text-muted-foreground" />
              </Button>
            </div>
            <div className="w-[100px]"></div> {/* Spacer to balance the layout */}
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
