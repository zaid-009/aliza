import React from 'react';
import { X, Crown, Users, UserCheck, ShieldAlert, LogOut } from 'lucide-react';

export const UserListModal = ({
  isOpen,
  onClose,
  users = [],
  currentUserId,
  hostId,
  isHost,
  onTransferHost,
  onLeaveRoom,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(34, 197, 94, 0.12)',
                color: 'var(--success-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h3 className="modal-title">People watching</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {users.length} connected in room
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto', marginBottom: 20 }}>
          {users.map((usr) => {
            const isMe = usr.id === currentUserId;
            const isThisHost = usr.id === hostId || usr.isHost;

            return (
              <div
                key={usr.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      position: 'relative',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#1A212B',
                      border: '1px solid var(--border-highlight)',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={usr.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${usr.id}`}
                      alt={usr.name}
                      style={{ width: '100%', height: '100%' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--success-green)',
                        border: '1.5px solid var(--surface-secondary)',
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{usr.name}</span>
                      {isMe && <span className="form-hint" style={{ color: 'var(--accent-purple)' }}>(You)</span>}
                      {isThisHost && <Crown size={14} color="var(--accent-pink)" title="Room Host" />}
                    </div>
                    <div className="form-hint">
                      {isThisHost ? 'Room Host' : 'Viewer'}
                    </div>
                  </div>
                </div>

                {/* Actions for Host viewing other users */}
                <div>
                  {isHost && !isMe && !isThisHost && (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                      onClick={() => onTransferHost(usr.id, usr.name)}
                      title="Transfer Host Privileges"
                    >
                      Make Host
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Close
          </button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onLeaveRoom}>
            <LogOut size={16} /> Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};
