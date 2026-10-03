import React, { useState } from 'react';
import { X, Film, Tv, Loader2, Sparkles } from 'lucide-react';

const PRESET_YOUTUBE_VIDEOS = [
  {
    title: 'Blender Open Movie - Tears of Steel',
    url: 'https://www.youtube.com/watch?v=R6MlUcmOul8',
  },
  {
    title: 'Lofi Hip Hop Radio - Beats to Study/Relax to',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
  },
  {
    title: '4K Cinematic Nature Relaxation Video',
    url: 'https://www.youtube.com/watch?v=1ZyBZ7k56nU',
  },
];

export const ChangeVideoModal = ({ isOpen, onClose, onChangeVideo, currentVideoTitle }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const input = videoUrl.trim();
    if (!input) {
      setErrorMsg('Please enter a YouTube video URL or MP4 link.');
      return;
    }

    setIsLoading(true);

    try {
      onChangeVideo({
        videoUrl: input,
        videoTitle: customTitle.trim() || 'WatchParty Video',
      });
      setIsLoading(false);
      onClose();
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Unable to load this video URL. Check link formatting.');
    }
  };

  const handleSelectPreset = (presetUrl, presetTitle) => {
    setVideoUrl(presetUrl);
    setCustomTitle(presetTitle);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 107, 138, 0.12)',
                color: 'var(--accent-pink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tv size={20} />
            </div>
            <div>
              <h2 className="modal-title">Change video</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Watch YouTube or custom video together
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {currentVideoTitle && (
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Current video: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{currentVideoTitle}</strong>
          </div>
        )}

        {errorMsg && (
          <div
            className="form-error"
            style={{
              marginBottom: 14,
              padding: 10,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="yt-url-input">YouTube or Video URL *</label>
            <input
              id="yt-url-input"
              type="url"
              className="form-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
            />
            <div className="form-hint" style={{ marginTop: 4 }}>
              Supported formats: youtube.com/watch?v=..., youtu.be/..., or direct .mp4 link
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="yt-title-input">Video Title (Optional)</label>
            <input
              id="yt-title-input"
              type="text"
              className="form-input"
              placeholder="e.g. My Favorite Movie Trailer"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </div>

          {/* Presets */}
          <div style={{ marginBottom: 20 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Quick Demo Presets:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PRESET_YOUTUBE_VIDEOS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', fontSize: '0.8rem', padding: '8px 12px' }}
                  onClick={() => handleSelectPreset(preset.url, preset.title)}
                >
                  <Film size={14} color="var(--accent-purple)" />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {preset.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isLoading}>
              {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Load Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
