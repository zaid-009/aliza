import React, { useState } from 'react';
import { X, LogIn, Loader2, KeyRound } from 'lucide-react';

export const JoinRoomModal = ({ isOpen, onClose, onJoinRoom }) => {
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    let code = roomCode.trim();
    if (!code) {
      setErrorMsg('Please enter a room code or room URL.');
      return;
    }

    // Extract code if user pasted a full URL like http://localhost:3000/room/abc123
    if (code.includes('/room/')) {
      code = code.split('/room/').pop().split('?')[0];
    } else if (code.includes('code=')) {
      code = new URLSearchParams(code.split('?')[1]).get('code') || code;
    }

    setIsLoading(true);

    try {
      await onJoinRoom({
        roomId: code,
        userName: userName.trim() || 'Watcher',
      });
      setIsLoading(false);
      onClose();
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Room not found. Check the room code or URL.');
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
                background: 'rgba(139, 124, 255, 0.12)',
                color: 'var(--accent-purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="modal-title">Join a watch room</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Enter the code or paste the invite link
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

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
          {/* User Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="join-username-input">Your Display Name</label>
            <input
              id="join-username-input"
              type="text"
              className="form-input"
              placeholder="e.g. Alex"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength={24}
            />
          </div>

          {/* Room Code or URL */}
          <div className="form-group">
            <label className="form-label" htmlFor="join-code-input">Room Code or Invite URL *</label>
            <input
              id="join-code-input"
              type="text"
              className="form-input"
              placeholder="e.g. cinema-lounge or https://watchtogether.io/room/x8f2a1"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              required
            />
            <div className="form-hint">
              Tip: You can use "cinema-lounge" to enter the default public lounge!
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
              style={{ flex: 1, background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6E5CFF 100%)' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Joining...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Join Room
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
