import React, { useState } from 'react';
import { X, Film, Shield, Lock, Globe, Loader2, Sparkles } from 'lucide-react';

const PRESET_VIDEOS = [
  {
    title: 'Big Buck Bunny (4K Ultra HD)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    title: 'Tears of Steel (Sci-Fi Short)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  },
  {
    title: 'Sintel (Fantasy Animation)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  },
  {
    title: 'Elephants Dream (Open Movie)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    title: 'Custom Video URL...',
    url: 'custom',
  },
];

export const CreateRoomModal = ({ isOpen, onClose, onCreateRoom }) => {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(PRESET_VIDEOS[0].url);
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [privacy, setPrivacy] = useState('public'); // public | private
  const [controlsMode, setControlsMode] = useState('everyone'); // everyone | hostOnly
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!roomName.trim()) {
      setErrorMsg('Please enter a room name.');
      return;
    }

    let finalVideoUrl = selectedVideo;
    let finalVideoTitle = PRESET_VIDEOS.find((v) => v.url === selectedVideo)?.title || 'Movie Video';

    if (selectedVideo === 'custom') {
      if (!customUrl.trim()) {
        setErrorMsg('Please enter a valid video URL.');
        return;
      }
      finalVideoUrl = customUrl.trim();
      finalVideoTitle = customTitle.trim() || 'Custom Video Stream';
    }

    setIsLoading(true);

    try {
      await onCreateRoom({
        name: roomName.trim(),
        userName: userName.trim() || 'Host',
        videoUrl: finalVideoUrl,
        videoTitle: finalVideoTitle,
        privacy,
        controlsMode,
      });
      setIsLoading(false);
      onClose();
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Unable to create room. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,107,138,0.12)',
                color: 'var(--accent-pink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Film size={20} />
            </div>
            <div>
              <h2 className="modal-title">Create your watch room</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Set up a digital cinema lounge
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="form-error" style={{ marginBottom: 14, padding: 10, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* User Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="host-name-input">Your Display Name</label>
            <input
              id="host-name-input"
              type="text"
              className="form-input"
              placeholder="e.g. Zaid"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength={24}
            />
          </div>

          {/* Room Name */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="form-label" htmlFor="room-name-input">Room Name *</label>
              <span className="form-hint">{roomName.length}/40</span>
            </div>
            <input
              id="room-name-input"
              type="text"
              className="form-input"
              placeholder="e.g. Midnight Movie Lounge"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={40}
              required
            />
          </div>

          {/* Video Selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="video-select">Choose Video Stream</label>
            <select
              id="video-select"
              className="form-select"
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
            >
              {PRESET_VIDEOS.map((vid) => (
                <option key={vid.url} value={vid.url}>
                  {vid.title}
                </option>
              ))}
            </select>
          </div>

          {selectedVideo === 'custom' && (
            <div style={{ padding: 12, background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Direct Video MP4/WebM URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/video.mp4"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Video Title (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="My Custom Movie"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Privacy Selector */}
          <div className="form-group">
            <label className="form-label">Privacy Settings</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                className={`btn ${privacy === 'public' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: 10, fontSize: '0.88rem' }}
                onClick={() => setPrivacy('public')}
              >
                <Globe size={16} /> Public Room
              </button>
              <button
                type="button"
                className={`btn ${privacy === 'private' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: 10, fontSize: '0.88rem' }}
                onClick={() => setPrivacy('private')}
              >
                <Lock size={16} /> Private Link
              </button>
            </div>
            <div className="form-hint" style={{ marginTop: 4 }}>
              {privacy === 'public'
                ? 'Discoverable in room directory for anyone.'
                : 'Only people with your direct room code/link can join.'}
            </div>
          </div>

          {/* Controls Mode */}
          <div className="form-group">
            <label className="form-label">Playback Controls Authority</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                className={`btn ${controlsMode === 'everyone' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{
                  border: controlsMode === 'everyone' ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                  color: controlsMode === 'everyone' ? 'var(--accent-purple)' : 'var(--text-secondary)',
                }}
                onClick={() => setControlsMode('everyone')}
              >
                Everyone Can Control
              </button>
              <button
                type="button"
                className={`btn ${controlsMode === 'hostOnly' ? 'btn-secondary' : 'btn-ghost'}`}
                style={{
                  border: controlsMode === 'hostOnly' ? '1px solid var(--accent-pink)' : '1px solid var(--border-color)',
                  color: controlsMode === 'hostOnly' ? 'var(--accent-pink)' : 'var(--text-secondary)',
                }}
                onClick={() => setControlsMode('hostOnly')}
              >
                Host Only Controls
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
