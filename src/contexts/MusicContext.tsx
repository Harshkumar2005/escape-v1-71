import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, Music, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  videoRef: React.RefObject<HTMLVideoElement>;
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Optionally play next song
      handleNext();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentSong]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(err => {
          console.error('Error playing media:', err);
          setIsPlaying(false);
        });
      }
    }, 100);
  };

  const togglePlay = () => {
    if (!currentSong) return;
    
    if (isPlaying) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play().catch(err => {
        console.error('Error playing media:', err);
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
        videoRef,
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
      <video ref={videoRef} style={{ display: 'none' }} />
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
  const [compactMode, setCompactMode] = useState(false);
  const [visualizerEnabled, setVisualizerEnabled] = useState(true);
  const visualizerRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

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

  useEffect(() => {
    if (!visualizerRef.current || !currentSong || !visualizerEnabled) return;

    // Initialize audio context if not already
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      } catch (e) {
        console.error('Web Audio API is not supported in this browser', e);
        return;
      }
    }

    // Connect video element to analyzer
    if (isPlaying && document.querySelector('video')) {
      try {
        const videoElement = document.querySelector('video') as HTMLVideoElement;
        if (videoElement && !sourceRef.current) {
          sourceRef.current = audioContextRef.current?.createMediaElementSource(videoElement);
          sourceRef.current?.connect(analyserRef.current as AnalyserNode);
          analyserRef.current?.connect(audioContextRef.current?.destination as AudioDestinationNode);
        }
        
        // Start visualizer
        drawVisualizer();
      } catch (e) {
        console.error('Error setting up audio visualizer', e);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentSong, isPlaying, visualizerEnabled]);

  const drawVisualizer = () => {
    if (!visualizerRef.current || !analyserRef.current || !visualizerEnabled) return;
    
    const canvas = visualizerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!visualizerEnabled) return;
      
      analyserRef.current?.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        
        // Create gradient effect
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#9333ea');
        gradient.addColorStop(1, '#a855f7');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
  };

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
    <div className="flex flex-col h-full bg-[#1e1e2e] text-[#cdd6f4] rounded-md overflow-hidden shadow-lg border border-[#313244]">
      <div className="px-4 py-3 border-b border-[#313244] bg-[#181825] flex justify-between items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input
            type="text"
            placeholder="Search for songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-[#1e1e2e] text-[#cdd6f4] border-[#313244] focus-visible:ring-[#9333ea]"
          />
          <Button type="submit" size="sm" variant="secondary" className="bg-[#313244] hover:bg-[#45475a]">
            <Search size={16} className="mr-2" />
            Search
          </Button>
        </form>
        <div className="flex items-center ml-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-[#cdd6f4]"
                  onClick={() => setCompactMode(prev => !prev)}
                >
                  {compactMode ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{compactMode ? 'Expand view' : 'Compact view'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {!compactMode && (
        <div className="flex-1 overflow-y-auto bg-[#1e1e2e]">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
              {searchResults.map((song) => (
                <div
                  key={song.id}
                  className={`flex flex-col rounded-md overflow-hidden border border-[#313244] transition-all hover:shadow-md cursor-pointer bg-[#181825] hover:bg-[#20212c] ${
                    currentSong?.id === song.id ? 'ring-2 ring-[#9333ea]' : ''
                  }`}
                  onClick={() => playSong(song.media_url)}
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
                      <button className="p-3 bg-[#9333ea] rounded-full">
                        {currentSong?.id === song.id && isPlaying ? (
                          <Pause size={20} />
                        ) : (
                          <Play size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-1 text-[#cdd6f4]" title={song.song}>
                      {song.song}
                    </h3>
                    <p className="text-xs text-[#a6adc8] line-clamp-1" title={song.singers}>
                      {truncateText(song.singers, 30)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && !searchResults.length ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#a6adc8]">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <h3 className="text-xl font-medium mb-2 text-[#cdd6f4]">Welcome to CodeBeats</h3>
              <p className="text-[#a6adc8] mb-4">
                Search for your favorite music and vibe while you code!
              </p>
              <Music size={48} className="text-[#a6adc8]/50" />
            </div>
          )}
        </div>
      )}

      {currentSong && (
        <div className="p-4 border-t border-[#313244] bg-[#181825]">
          {visualizerEnabled && isPlaying && (
            <div className="mb-3 h-16 overflow-hidden rounded-md bg-[#1e1e2e]">
              <canvas 
                ref={visualizerRef} 
                width={500} 
                height={64}
                className="w-full h-full"
              />
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <img
              src={currentSong.image}
              alt={currentSong.song}
              className="w-16 h-16 rounded-md object-cover border border-[#313244]/50 shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate text-[#cdd6f4]" title={currentSong.song}>
                {currentSong.song}
              </h3>
              <p className="text-sm text-[#a6adc8] truncate" title={currentSong.singers}>
                {truncateText(currentSong.singers, 40)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#a6adc8]">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  className="flex-1"
                  onValueChange={([value]) => setCurrentTime(value)}
                />
                <span className="text-xs text-[#a6adc8]">
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
                className="text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
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
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrevious}
                className="text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]"
              >
                <SkipBack size={20} />
              </Button>
              <Button 
                variant="default" 
                size="icon"
                className="h-10 w-10 rounded-full bg-[#9333ea] hover:bg-[#a855f7]"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNext}
                className="text-[#a6adc8] hover:text-[#cdd6f4] hover:bg-[#313244]"
              >
                <SkipForward size={20} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#a6adc8]">Visualizer</span>
              <Switch
                checked={visualizerEnabled}
                onCheckedChange={setVisualizerEnabled}
                className="data-[state=checked]:bg-[#9333ea]"
              />
            </div>
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
      className="flex items-center gap-2 px-2 py-1 rounded-md bg-[#181825]/80 border border-[#313244] cursor-pointer hover:bg-[#181825] transition-colors"
      onClick={toggleMusicPanel}
    >
      <button 
        className="flex items-center justify-center h-6 w-6 rounded-full bg-[#9333ea]/20 hover:bg-[#9333ea]/40 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      >
        {isPlaying ? <Pause size={12} className="text-[#cdd6f4]" /> : <Play size={12} className="text-[#cdd6f4]" />}
      </button>
      
      <div className="flex items-center max-w-[200px]">
        <span className="font-medium text-xs truncate text-[#cdd6f4]">{currentSong.song}</span>
      </div>
      
      {isPlaying && (
        <div className="flex items-center h-4 gap-[2px]">
          {[1, 2, 3, 4].map((bar) => (
            <div 
              key={bar}
              className="w-[2px] bg-[#9333ea] rounded-full animate-pulse"
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
