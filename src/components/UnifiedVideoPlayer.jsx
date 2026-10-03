import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Lock,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Film,
  Tv,
} from 'lucide-react';
import { FloatingReactions } from './FloatingReactions';

export const UnifiedVideoPlayer = ({
  videoProvider = 'youtube',
  videoId = '',
  videoUrl = '',
  videoTitle = '',
  playbackState,
  isHost,
  isHostOnly,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
  floatingReactions = [],
}) => {
  const containerRef = useRef(null);
  const html5VideoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const isSyncingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showHostLockTooltip, setShowHostLockTooltip] = useState(false);

  const canControl = !isHostOnly || isHost;

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === null) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. YouTube IFrame API Script Injection & Initialization
  useEffect(() => {
    if (videoProvider !== 'youtube' || !videoId) return;

    setIsLoading(true);
    setHasError(false);

    // Load YouTube API script if missing
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 150);
        return;
      }

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
      }

      ytPlayerRef.current = new window.YT.Player('yt-player-element', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            setIsLoading(false);
            setDuration(event.target.getDuration() || 0);

            if (playbackState) {
              isSyncingRef.current = true;
              event.target.seekTo(playbackState.currentTime || 0, true);
              if (playbackState.isPlaying) {
                event.target.playVideo();
                setIsPlaying(true);
              } else {
                event.target.pauseVideo();
                setIsPlaying(false);
              }
              setTimeout(() => {
                isSyncingRef.current = false;
              }, 400);
            }
          },
          onStateChange: (event) => {
            if (isSyncingRef.current) return;

            // YT.PlayerState.PLAYING = 1
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              if (canControl) {
                const cur = event.target.getCurrentTime();
                onPlay(cur);
              }
            }
            // YT.PlayerState.PAUSED = 2
            else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              if (canControl) {
                const cur = event.target.getCurrentTime();
                onPause(cur);
              }
            }
          },
          onError: () => {
            setIsLoading(false);
            setHasError(true);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      setTimeout(initPlayer, 300);
    }

    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [videoId, videoProvider]);

  // Periodic time update tick for slider position
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoProvider === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
        try {
          const cur = ytPlayerRef.current.getCurrentTime();
          setCurrentTime(cur);
          const dur = ytPlayerRef.current.getDuration();
          if (dur) setDuration(dur);
        } catch (e) {}
      } else if (videoProvider === 'html5' && html5VideoRef.current) {
        setCurrentTime(html5VideoRef.current.currentTime);
        if (html5VideoRef.current.duration) setDuration(html5VideoRef.current.duration);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [videoProvider]);

  // 2. Handle incoming playbackState changes from Socket.IO
  useEffect(() => {
    if (!playbackState) return;

    isSyncingRef.current = true;

    if (videoProvider === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.getPlayerState) {
      try {
        const curTime = ytPlayerRef.current.getCurrentTime() || 0;
        if (Math.abs(curTime - playbackState.currentTime) > 1.8) {
          ytPlayerRef.current.seekTo(playbackState.currentTime, true);
        }

        if (playbackState.isPlaying) {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        } else {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
        }
      } catch (e) {}
    } else if (videoProvider === 'html5' && html5VideoRef.current) {
      const vid = html5VideoRef.current;
      if (Math.abs(vid.currentTime - playbackState.currentTime) > 1.8) {
        vid.currentTime = playbackState.currentTime;
      }
      if (playbackState.isPlaying) {
        vid.play().catch(() => {});
        setIsPlaying(true);
      } else {
        vid.pause();
        setIsPlaying(false);
      }
    }

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 400);
  }, [playbackState, videoProvider]);

  // Control Actions
  const togglePlay = () => {
    if (isSyncingRef.current) return;
    if (!canControl) {
      setShowHostLockTooltip(true);
      setTimeout(() => setShowHostLockTooltip(false), 2500);
      return;
    }

    if (videoProvider === 'youtube' && ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
        onPause(ytPlayerRef.current.getCurrentTime());
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
        onPlay(ytPlayerRef.current.getCurrentTime());
      }
    } else if (videoProvider === 'html5' && html5VideoRef.current) {
      if (isPlaying) {
        html5VideoRef.current.pause();
        setIsPlaying(false);
        onPause(html5VideoRef.current.currentTime);
      } else {
        html5VideoRef.current.play().catch(() => {});
        setIsPlaying(true);
        onPlay(html5VideoRef.current.currentTime);
      }
    }
  };

  const handleSeekChange = (e) => {
    if (!canControl) return;
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const handleSeekCommit = (e) => {
    if (!canControl) {
      setShowHostLockTooltip(true);
      setTimeout(() => setShowHostLockTooltip(false), 2500);
      return;
    }

    const newTime = parseFloat(e.target.value);
    isSyncingRef.current = true;

    if (videoProvider === 'youtube' && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(newTime, true);
    } else if (videoProvider === 'html5' && html5VideoRef.current) {
      html5VideoRef.current.currentTime = newTime;
    }

    onSeek(newTime);

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 400);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);

    if (videoProvider === 'youtube' && ytPlayerRef.current) {
      if (nextMute) ytPlayerRef.current.mute();
      else ytPlayerRef.current.unMute();
    } else if (videoProvider === 'html5' && html5VideoRef.current) {
      html5VideoRef.current.muted = nextMute;
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);

    if (videoProvider === 'youtube' && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(val * 100);
    } else if (videoProvider === 'html5' && html5VideoRef.current) {
      html5VideoRef.current.volume = val;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className="unified-player-container">
      <style>{`
        .unified-player-container {
          position: relative;
          width: 100%;
          background: #000;
          border-radius: var(--radius-xl);
          overflow: hidden;
          border: 1px solid var(--border-color);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px var(--glow-pink);
          display: flex;
          flex-direction: column;
          aspect-ratio: 16 / 9;
        }

        .yt-wrapper {
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0;
          pointer-events: auto;
        }

        .player-top-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 14px 20px;
          background: linear-gradient(180deg, rgba(8,10,13,0.9) 0%, rgba(0,0,0,0) 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 30;
          pointer-events: auto;
        }

        .video-title-text {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60%;
        }

        .player-controls-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 14px 20px;
          background: linear-gradient(0deg, rgba(8,10,13,0.95) 0%, rgba(8,10,13,0.5) 70%, rgba(0,0,0,0) 100%);
          z-index: 30;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .timeline-slider-row {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .seek-slider {
          flex: 1;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-full);
          outline: none;
          cursor: pointer;
        }

        .seek-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #FFF;
          box-shadow: 0 0 10px var(--accent-pink);
        }

        .controls-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .host-lock-tooltip {
          position: absolute;
          top: -45px;
          left: 20px;
          background: var(--surface-secondary);
          border: 1px solid var(--accent-pink);
          color: var(--accent-pink);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
          box-shadow: 0 8px 20px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          gap: 6px;
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>

      {/* Floating Reactions Layer */}
      <FloatingReactions reactions={floatingReactions} />

      {/* Top Header Overlay */}
      <div className="player-top-overlay">
        <div className="video-title-text" title={videoTitle}>
          {videoTitle || (videoProvider === 'youtube' ? 'YouTube Stream' : 'Cinema Video')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isHostOnly && (
            <div className="badge badge-host" title="Only the host controls playback">
              <Lock size={12} /> Host Control
            </div>
          )}

          {canControl && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              onClick={onChangeVideo}
            >
              <Film size={14} /> Change Video
            </button>
          )}
        </div>
      </div>

      {/* Video Stream Element */}
      {videoProvider === 'youtube' ? (
        <div className="yt-wrapper">
          <div id="yt-player-element" style={{ width: '100%', height: '100%' }} />
        </div>
      ) : (
        <video
          ref={html5VideoRef}
          src={videoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          onClick={togglePlay}
          playsInline
        />
      )}

      {/* Loading State Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(8,10,13,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 25,
            color: 'var(--accent-pink)',
            gap: 10,
          }}
        >
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Loading {videoProvider === 'youtube' ? 'YouTube Player' : 'Video Stream'}...
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--surface-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
           justifyContent: 'center',
            zIndex: 25,
            padding: 20,
            textAlign: 'center',
          }}
        >
          <AlertTriangle size={40} color="var(--danger-red)" style={{ marginBottom: 12 }} />
          <h4 style={{ fontSize: '1.1rem', marginBottom: 6 }}>Unable to load this video.</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 360, marginBottom: 16 }}>
            The video may be private, deleted, or restricted by origin policies.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setIsLoading(true);
                setHasError(false);
              }}
            >
              <RotateCcw size={15} /> Retry
            </button>
            <button className="btn btn-primary" onClick={onChangeVideo}>
              <Film size={15} /> Change Video
            </button>
          </div>
        </div>
      )}

      {/* Player Control Bar Overlay */}
      <div className="player-controls-overlay">
        {showHostLockTooltip && (
          <div className="host-lock-tooltip">
            <Lock size={14} /> Only the host controls playback.
          </div>
        )}

        <div className="timeline-slider-row">
          <input
            type="range"
            className="seek-slider"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            aria-label="Seek position"
          />
        </div>

        <div className="controls-bottom-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-icon" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="btn-icon" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                style={{ width: 70, height: 4, cursor: 'pointer' }}
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume slider"
              />
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div>
            <button className="btn-icon" onClick={toggleFullscreen} aria-label="Fullscreen">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
