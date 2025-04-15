
import React, { useState, useEffect } from 'react';
import { useMusic, Song } from '@/contexts/MusicContext';
import { Search, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

const MusicPlayerPanel: React.FC = () => {
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
    <div className="flex flex-col h-full bg-background border-t border-border">
      <div className="px-4 py-3 border-b border-border">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search for songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm">
            <Search size={16} className="mr-2" />
            Search
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
            {searchResults.map((song) => (
              <div
                key={song.id}
                className={`flex flex-col rounded-md overflow-hidden border border-border transition-all hover:shadow-md cursor-pointer ${
                  currentSong?.id === song.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => playSong(song)}
              >
                <div className="relative aspect-square bg-muted">
                  <img
                    src={song.image}
                    alt={song.song}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <button className="p-3 bg-primary rounded-full">
                      {currentSong?.id === song.id && isPlaying ? (
                        <Pause size={20} />
                      ) : (
                        <Play size={20} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1" title={song.song}>
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
            <h3 className="text-xl font-medium mb-2">Welcome to the Music Player</h3>
            <p className="text-muted-foreground mb-4">
              Search for your favorite songs and start listening!
            </p>
            <Search size={48} className="text-muted-foreground/50" />
          </div>
        )}
      </div>

      {currentSong && (
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-4">
            <img
              src={currentSong.image}
              alt={currentSong.song}
              className="w-16 h-16 rounded-md object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate" title={currentSong.song}>
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
              <Button variant="ghost" size="icon" onClick={handlePrevious}>
                <SkipBack size={20} />
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

export default MusicPlayerPanel;
