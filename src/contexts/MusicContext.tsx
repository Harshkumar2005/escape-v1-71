import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, Music, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

export interface Media {
  id: string;
  title: string;
  artists: string;
  image: string;
  media_url: string;
  duration: string;
  album?: string;
  type: 'audio' | 'video'; // Add media type
}

interface MediaContextType {
  currentMedia: Media | null;
  isPlaying: boolean;
  searchResults: Media[];
  searchQuery: string;
  showMediaPanel: boolean;
  isCompact: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  mediaRef: React.RefObject<HTMLVideoElement>;
  playMedia: (media: Media) => void;
  togglePlay: () => void;
  setSearchQuery: (query: string) => void;
  searchMedia: () => Promise<void>;
  toggleMediaPanel: () => void;
  toggleCompactMode: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  handleNext: () => void;
  handlePrevious: () => void;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMedia, setCurrentMedia] = useState<Media | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchResults, setSearchResults] = useState<Media[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [isCompact, setIsCompact] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => setCurrentTime(media.currentTime);
    const handleDurationChange = () => setDuration(media.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Optionally play next media
      handleNext();
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('durationchange', handleDurationChange);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('durationchange', handleDurationChange);
      media.removeEventListener('ended', handleEnded);
    };
  }, [currentMedia]);

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = volume;
    }
  }, [volume]);

  const playMedia = (media: Media) => {
    setCurrentMedia(media);
    setIsPlaying(true);
    setTimeout(() => {
      if (mediaRef.current) {
        mediaRef.current.play().catch(err => {
          console.error('Error playing media:', err);
          setIsPlaying(false);
        });
      }
    }, 100);
  };

  const togglePlay = () => {
    if (!currentMedia) return;
    
    if (isPlaying) {
      mediaRef.current?.pause();
    } else {
      mediaRef.current?.play().catch(err => {
        console.error('Error playing media:', err);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const searchMedia = async () => {
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
          title: item.song,
          artists: item.singers,
          image: item.image,
          media_url: item.media_url,
          duration: item.duration,
          album: item.album,
          // Determine if it's a video based on the file extension or mime type
          type: item.media_url?.toLowerCase().endsWith('.mp4') ? 'video' : 'audio'
        })));
        setShowMediaPanel(true);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching media:', error);
      setSearchResults([]);
    }
  };

  const toggleMediaPanel = () => {
    setShowMediaPanel(prev => !prev);
  };

  const toggleCompactMode = () => {
    setIsCompact(prev => !prev);
  };

  const handleNext = () => {
    if (!currentMedia || searchResults.length === 0) return;
    
    const currentIndex = searchResults.findIndex(media => media.id === currentMedia.id);
    if (currentIndex === -1 || currentIndex === searchResults.length - 1) return;
    
    const nextMedia = searchResults[currentIndex + 1];
    playMedia(nextMedia);
  };

  const handlePrevious = () => {
    if (!currentMedia || searchResults.length === 0) return;
    
    const currentIndex = searchResults.findIndex(media => media.id === currentMedia.id);
    if (currentIndex === -1 || currentIndex === 0) return;
    
    const prevMedia = searchResults[currentIndex - 1];
    playMedia(prevMedia);
  };

  return (
    <MediaContext.Provider
      value={{
        currentMedia,
        isPlaying,
        searchResults,
        searchQuery,
        showMediaPanel,
        isCompact,
        volume,
        currentTime,
        duration,
        mediaRef,
        playMedia,
        togglePlay,
        setSearchQuery,
        searchMedia,
        toggleMediaPanel,
        toggleCompactMode,
        setVolume,
        setCurrentTime,
        handleNext,
        handlePrevious
      }}
    >
      {children}
      <video ref={mediaRef} hidden />
    </MediaContext.Provider>
  );
};

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
};

// Visualizer component
const AudioVisualizer: React.FC = () => {
  const { isPlaying, mediaRef } = useMedia();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyzer, setAnalyzer] = useState<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || !mediaRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    if (!audioContext) {
      const newAudioContext = new AudioContext();
      const newAnalyzer = newAudioContext.createAnalyser();
      newAnalyzer.fftSize = 128;
      
      const source = newAudioContext.createMediaElementSource(mediaRef.current);
      source.connect(newAnalyzer);
      newAnalyzer.connect(newAudioContext.destination);
      
      setAudioContext(newAudioContext);
      setAnalyzer(newAnalyzer);
    }

    if (analyzer && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const draw = () => {
        if (!ctx || !analyzer) return;
        
        analyzer.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = canvas.width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          
          // Color gradient from blue to purple
          const hue = 240 - (i / bufferLength) * 60;
          ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
          
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
        
        animationRef.current = requestAnimationFrame(draw);
      };
      
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, mediaRef, audioContext, analyzer]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-16 rounded bg-black/20 backdrop-blur-md"
    />
  );
};

// MediaPlayerPanel component
export const MediaPlayerPanel: React.FC = () => {
  const {
    currentMedia,
    isPlaying,
    searchResults,
    searchQuery,
    volume,
    currentTime,
    duration,
    isCompact,
    setSearchQuery,
    searchMedia,
    playMedia,
    togglePlay,
    toggleCompactMode,
    setVolume,
    setCurrentTime,
    handleNext,
    handlePrevious
  } = useMedia();
  
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
    searchMedia();
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-gray-100 border border-gray-800 rounded-md overflow-hidden shadow-xl transition-all duration-300 ${isCompact ? 'max-h-96' : ''}`}>
      <div className="px-4 py-3 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <Input
            type="text"
            placeholder="Search for media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500"
          />
          <Button type="submit" size="sm" variant="secondary" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Search size={16} className="mr-2" />
            Search
          </Button>
        </form>
        <Button variant="ghost" size="icon" onClick={toggleCompactMode} className="ml-2 text-gray-400 hover:text-gray-200">
          {isCompact ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
        </Button>
      </div>

      {!isCompact && (
        <div className="flex-1 overflow-y-auto bg-gray-900">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
              {searchResults.map((media) => (
                <div
                  key={media.id}
                  className={`flex flex-col rounded-md overflow-hidden border border-gray-800 transition-all hover:shadow-lg cursor-pointer bg-gray-800 hover:bg-gray-750 ${
                    currentMedia?.id === media.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                  onClick={() => playMedia(media)}
                >
                  <div className="relative aspect-square bg-black/50">
                    <img
                      src={media.image}
                      alt={media.title}
                      className="w-full h-full object-cover opacity-90"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="p-3 bg-indigo-600/80 rounded-full">
                        {currentMedia?.id === media.id && isPlaying ? (
                          <Pause size={20} />
                        ) : (
                          <Play size={20} />
                        )}
                      </div>
                      {media.type === 'video' && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">MP4</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-1 text-gray-200" title={media.title}>
                      {media.title}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-1" title={media.artists}>
                      {truncateText(media.artists, 30)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery && !searchResults.length ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <h3 className="text-xl font-medium mb-2 text-gray-200">Code & Vibe</h3>
              <p className="text-gray-400 mb-4">
                Search for your favorite music/videos and code with the perfect soundtrack!
              </p>
              <Music size={48} className="text-indigo-500/50" />
            </div>
          )}
        </div>
      )}

      {currentMedia && (
        <div className="p-4 border-t border-gray-800 bg-gray-950">
          <AudioVisualizer />
          
          <div className="flex items-center gap-4 mt-4">
            <img
              src={currentMedia.image}
              alt={currentMedia.title}
              className="w-16 h-16 rounded-md object-cover border border-gray-800 shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium truncate text-gray-100" title={currentMedia.title}>
                  {currentMedia.title}
                </h3>
                {currentMedia.type === 'video' && (
                  <span className="bg-red-600/80 text-white text-xs px-2 py-0.5 rounded ml-2">MP4</span>
                )}
              </div>
              <p className="text-sm text-gray-400 truncate" title={currentMedia.artists}>
                {truncateText(currentMedia.artists, 40)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  className="flex-1"
                  onValueChange={([value]) => setCurrentTime(value)}
                />
                <span className="text-xs text-gray-500">
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
                className="text-gray-400 hover:text-gray-200"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
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
                className="text-gray-400 hover:text-gray-200"
              >
                <SkipBack size={20} />
              </Button>
              <Button 
                variant="default" 
                size="icon"
                className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNext}
                className="text-gray-400 hover:text-gray-200"
              >
                <SkipForward size={20} />
              </Button>
            </div>
            <div className="w-[100px]"></div> {/* Spacer to balance the layout */}
          </div>
        </div>
      )}
    </div>
  );
};

// MediaStatusBar component
export const MediaStatusBar: React.FC = () => {
  const { currentMedia, isPlaying, togglePlay, toggleMediaPanel } = useMedia();

  if (!currentMedia) return null;

  return (
    <div className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-full bg-gray-800/80 backdrop-blur-sm hover:bg-gray-750 transition-colors" onClick={toggleMediaPanel}>
      <button 
        className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600/90 text-white"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      >
        {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
      </button>
      
      <div className="flex items-center max-w-[200px]">
        <span className="font-medium text-xs truncate text-gray-200">{currentMedia.title}</span>
      </div>
      
      {isPlaying && (
        <div className="flex items-center h-4 gap-[2px]">
          {[1, 2, 3, 4].map((bar) => (
            <div 
              key={bar}
              className="w-[2px] bg-indigo-500 rounded-full animate-pulse"
              style={{
                height: `${6 + Math.random() * 6}px`,
                animationDelay: `${bar * 0.1}s`
              }}
            ></div>
          ))}
        </div>
      )}
      
      {currentMedia.type === 'video' && (
        <span className="bg-red-600/80 text-white text-xs px-1.5 py-0.5 rounded-full text-[9px]">MP4</span>
      )}
    </div>
  );
};
