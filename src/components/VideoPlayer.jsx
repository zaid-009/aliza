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
} from 'lucide-react';
import { FloatingReactions } from './FloatingReactions';

export const VideoPlayer = ({
  videoUrl,
  videoTitle,
  playbackState,
  isHost,
  isHostOnly,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
  floatingReactions,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [newVideoInput, setNewVideoInput] = useState('');

  // Ref flag to block loop sync loops
  const isSyncingRef = useRef(false);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs) || secs === null) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Sync video element with incoming socket playbackState
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackState) return;

    isSyncingRef.current = true;

    // Check drift if time difference is greater than 1.5 seconds
    if (Math.abs(video.currentTime - playbackState.currentTime) > 1.5) {
      video.currentTime = playbackState.currentTime;
      setCurrentTime(playbackState.currentTime);
    }

    if (playbackState.isPlaying) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 300);
  }, [playbackState]);

  // Video event listeners
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    setHasError(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // User Actions (Checked for Host permission)
  const canControl = !isHostOnly || isHost;

  const togglePlay = () => {
    if (isSyncingRef.current) return;
    if (!canControl) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2500);
      return;
    }

    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPause(videoRef.current.currentTime);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      onPlay(videoRef.current.currentTime);
    }
  };

  const handleSeekChange = (e) => {
    if (!canControl) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2500);
      return;
    }

    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleSeekCommit = () => {
    if (!canControl) return;
    if (videoRef.current) {
      onSeek(videoRef.current.currentTime);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    videoRef.current.muted = nextMute;
    setIsMuted(nextMute);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
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

  const handleChangeVideoSubmit = (e) => {
    e.preventDefault();
    if (newVideoInput.trim() && onChangeVideo) {
      onChangeVideo(newVideoInput.trim());
      setNewVideoInput('');
      setShowVideoSelector(false);
    }
  };

  return (
    <div ref={containerRef} className="video-player-container">
      <style>{`
        .video-player-container {
          position: relative;
          width: 100%;
          background: #000;
          border-radius: var(--radius-xl);
          overflow: hidden;
          border: 1px solid var(--border-color);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px var(--glow-pink);
          display: flex;
          flex-direction: column;
          aspect-ratio: 16 / 9;
        }

        .video-element {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
        }

        .player-top-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 16px 20px;
          background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 30;
          pointer-events: auto;
        }

        .video-title-text {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--text-primary);
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
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
          background: linear-gradient(0deg, rgba(8,10,13,0.95) 0%, rgba(8,10,13,0.4) 70%, rgba(0,0,0,0) 100%);
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
          transition: height 0.15s ease;
        }

        .seek-slider:hover {
          height: 8px;
        }

        .seek-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #FFF;
          box-shadow: 0 0 10px var(--accent-pink);
          cursor: pointer;
        }

        .controls-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .controls-left-group, .controls-right-group {
          display: flex;
          align-items: center;
          gap: 12px;
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

        .volume-container {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .volume-slider {
          width: 70px;
          height: 4px;
          -webkit-appearance: none;
          background: rgba(255,255,255,0.25);
          border-radius: 4px;
          outline: none;
          cursor: pointer;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #FFF;
        }
      `}</style>

      {/* Floating Emoji Reactions Overlay */}
      <FloatingReactions reactions={floatingReactions} />

      {/* Top Title Overlay */}
      <div className="player-top-overlay">
        <div className="video-title-text" title={videoTitle}>
          {videoTitle || 'Cinema Video Stream'}
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
              onClick={() => setShowVideoSelector(!showVideoSelector)}
            >
              <Film size={14} /> Change Video
            </button>
          )}
        </div>
      </div>

      {/* Change Video URL Popup */}
      {showVideoSelector && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 20,
            zIndex: 40,
            background: 'var(--surface-primary)',
            border: '1px solid var(--border-highlight)',
            borderRadius: 'var(--radius-md)',
            padding: 14,
            width: 300,
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>
            Change Room Video
          </div>
          <form onSubmit={handleChangeVideoSubmit}>
            <input
              type="url"
              className="form-input"
              style={{ padding: '8px', fontSize: '0.82rem', marginBottom: 8 }}
              placeholder="Paste direct MP4/WebM video URL..."
              value={newVideoInput}
              onChange={(e) => setNewVideoInput(e.target.value)}
              required
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}
                onClick={() => setShowVideoSelector(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}
              >
                Update Video
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(8,10,13,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 25,
            color: 'var(--accent-pink)',
          }}
        >
          <Loader2 size={36} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
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
          <h4 style={{ fontSize: '1.1rem', marginBottom: 6 }}>Video could not be loaded</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: 360, marginBottom: 16 }}>
            The video source may be offline or restricted by CORS policies.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setIsLoading(true);
              setHasError(false);
              if (videoRef.current) videoRef.current.load();
            }}
          >
            <RotateCcw size={16} /> Retry Video
          </button>
        </div>
      )}

      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        className="video-element"
        src={videoUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleLoadedData}
        onError={handleError}
        onClick={togglePlay}
        playsInline
      />

      {/* Player Controls Bar */}
      <div className="player-controls-overlay">
        {/* Host lock warning tooltip */}
        {showTooltip && (
          <div className="host-lock-tooltip">
            <Lock size={14} /> Only the host controls playback.
          </div>
        )}

        {/* Timeline Slider */}
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
            aria-label="Seek video position"
          />
        </div>

        {/* Bottom Control Row */}
        <div className="controls-bottom-row">
          <div className="controls-left-group">
            <button
              className="btn-icon"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <div className="volume-container">
              <button
                className="btn-icon"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title="Toggle Mute"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                className="volume-slider"
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

          <div className="controls-right-group">
            <button
              className="btn-icon"
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
