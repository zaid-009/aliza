import React, { useState } from 'react';
import {
  Copy,
  Users,
  LogOut,
  Crown,
  ChevronLeft,
  Check,
  MessageSquare,
  Maximize2,
  Minimize2,
  Tv,
  Mic,
  MicOff,
} from 'lucide-react';
import { UnifiedVideoPlayer } from './UnifiedVideoPlayer';
import { ChatPanel } from './ChatPanel';
import { VoiceChatBar } from './VoiceChatBar';
import { UserListModal } from './UserListModal';
import { ConfirmModal } from './ConfirmModal';
import { ChangeVideoModal } from './ChangeVideoModal';

export const RoomUI = ({
  room,
  currentUser,
  socket,
  socketConnected,
  onLeaveRoom,
  onPlayVideo,
  onPauseVideo,
  onSeekVideo,
  onChangeVideo,
  onSendMessage,
  onSendReaction,
  onTyping,
  onTransferHost,
  floatingReactions = [],
  typingUsers = [],
  showToast,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showChangeVideoModal, setShowChangeVideoModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);

  // Chat minimization & Mobile drawer state
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const isHost = currentUser?.id === room?.hostId || currentUser?.isHost;
  const isHostOnly = room?.controlsMode === 'hostOnly';

  const userList = room?.users || [];
  const voiceUsers = room?.voiceUsers || [];
  const unreadMessageCount = room?.messages?.length || 0;

  const handleCopyRoomId = () => {
    if (!room?.id) return;
    navigator.clipboard.writeText(room.id);
    setCopiedId(true);
    showToast('Copied!', 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyInviteLink = () => {
    if (!room?.id) return;
    const url = `${window.location.origin}/room/${room.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('Copied!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const confirmTransferHost = () => {
    if (transferTarget && onTransferHost) {
      onTransferHost(transferTarget.id);
      showToast(`${transferTarget.name} is now the host.`, 'info');
    }
    setTransferTarget(null);
  };

  return (
    <div className="unified-room-root">
      <style>{`
        .unified-room-root {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg-dark);
          color: var(--text-primary);
        }

        .room-header {
          position: sticky;
          top: 0;
          z-index: 200;
          background: rgba(8, 10, 13, 0.94);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-color);
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-code-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background: var(--surface-secondary);
          border: 1px solid var(--border-color);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
        }

        /* Unified Watch Party Main Grid */
        .unified-grid {
          flex: 1;
          display: grid;
          grid-template-columns: ${isChatMinimized ? '1fr' : '1fr 340px'};
          gap: 20px;
          padding: 20px;
          max-width: 1600px;
          width: 100%;
          margin: 0 auto;
          transition: grid-template-columns 0.25s ease;
        }

        @media (max-width: 1024px) {
          .unified-grid {
            grid-template-columns: 1fr;
          }
          .desktop-chat-container {
            display: none;
          }
        }

        .video-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }

        .desktop-chat-container {
          height: calc(100vh - 110px);
          position: sticky;
          top: 70px;
        }

        .floating-chat-restore-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 300;
          background: linear-gradient(135deg, var(--accent-pink) 0%, var(--accent-purple) 100%);
          color: #FFF;
          padding: 12px 20px;
          border-radius: var(--radius-full);
          font-weight: 700;
          font-size: 0.95rem;
          box-shadow: 0 10px 25px var(--glow-pink);
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideUp 0.2s ease-out;
        }

        /* Mobile Bottom Sheet Drawer for Chat */
        .mobile-chat-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 600;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .mobile-chat-drawer {
          background: var(--surface-primary);
          border-top: 1px solid var(--border-highlight);
          border-top-left-radius: var(--radius-xl);
          border-top-right-radius: var(--radius-xl);
          height: 75vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 -20px 40px rgba(0,0,0,0.8);
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* Header Bar */}
      <header className="room-header">
        <div className="header-left">
          <button
            className="btn btn-ghost"
            style={{ padding: '6px' }}
            onClick={() => setShowLeaveConfirm(true)}
            title="Leave Watch Room"
          >
            <ChevronLeft size={20} />
          </button>

          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem' }}>
            Watch<span style={{ color: 'var(--accent-pink)' }}>Together</span>
          </div>

          <div className="header-code-badge" onClick={handleCopyRoomId} title="Click to copy room code">
            {copiedId ? <Check size={13} color="var(--success-green)" /> : <Copy size={13} />}
            <span>Code: {room?.id}</span>
          </div>
        </div>

        <div className="header-right">
          {/* Socket Connection Indicator */}
          <div className="badge">
            {socketConnected ? (
              <>
                <span className="badge-live-dot" />
                <span>Live Sync</span>
              </>
            ) : (
              <>
                <span className="badge-live-dot" style={{ background: 'var(--danger-red)' }} />
                <span style={{ color: 'var(--danger-red)' }}>Reconnecting...</span>
              </>
            )}
          </div>

          {/* Copy Invite Link */}
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            onClick={handleCopyInviteLink}
          >
            {copiedLink ? <Check size={14} color="var(--success-green)" /> : <Copy size={14} />}
            <span className="desktop-hide-on-mobile">{copiedLink ? 'Copied!' : 'Copy link'}</span>
          </button>

          {/* Viewers Popover Button */}
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => setShowUsersModal(true)}>
            <Users size={14} color="var(--accent-purple)" />
            <span>👥 {userList.length} watching</span>
          </button>

          {/* Leave Room Button */}
          <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={() => setShowLeaveConfirm(true)}>
            <LogOut size={15} />
            <span className="desktop-hide-on-mobile">Leave</span>
          </button>
        </div>
      </header>

      {/* Main Unified Watch Party Layout */}
      <main className="unified-grid">
        {/* Left Video & Controls Column */}
        <div className="video-column">
          <UnifiedVideoPlayer
            videoProvider={room?.videoProvider || 'youtube'}
            videoId={room?.videoId}
            videoUrl={room?.videoUrl}
            videoTitle={room?.videoTitle}
            playbackState={room?.playbackState}
            isHost={isHost}
            isHostOnly={isHostOnly}
            onPlay={onPlayVideo}
            onPause={onPauseVideo}
            onSeek={onSeekVideo}
            onChangeVideo={() => setShowChangeVideoModal(true)}
            floatingReactions={floatingReactions}
          />

          {/* WebRTC Voice Chat Controls & Avatars */}
          <VoiceChatBar
            socket={socket}
            roomId={room?.id}
            currentUserId={currentUser?.id}
            currentUserName={currentUser?.name}
            voiceUsers={voiceUsers}
            showToast={showToast}
          />
        </div>

        {/* Right Chat Column (Desktop) */}
        {!isChatMinimized && (
          <div className="desktop-chat-container">
            <ChatPanel
              messages={room?.messages || []}
              typingUsers={typingUsers}
              onSendMessage={onSendMessage}
              onSendReaction={onSendReaction}
              onTyping={onTyping}
            />
          </div>
        )}
      </main>

      {/* Mobile Floating Chat Drawer Button */}
      <div style={{ display: 'none' }} className="mobile-only-chat-trigger">
        <style>{`
          @media (max-width: 1024px) {
            .mobile-only-chat-trigger {
              display: block !important;
              position: fixed;
              bottom: 20px;
              right: 20px;
              z-index: 400;
            }
          }
        `}</style>
        <button
          className="btn btn-primary"
          style={{ borderRadius: 'var(--radius-full)', padding: '12px 20px', boxShadow: '0 8px 25px var(--glow-pink)' }}
          onClick={() => setMobileChatOpen(true)}
        >
          <MessageSquare size={18} /> Chat ({unreadMessageCount})
        </button>
      </div>

      {/* Restore Chat Button when Desktop Chat is Minimized */}
      {isChatMinimized && (
        <button className="floating-chat-restore-btn" onClick={() => setIsChatMinimized(false)}>
          <MessageSquare size={18} /> Restore Room Chat ({unreadMessageCount})
        </button>
      )}

      {/* Mobile Chat Bottom Sheet Drawer */}
      {mobileChatOpen && (
        <div className="mobile-chat-drawer-overlay" onClick={() => setMobileChatOpen(false)}>
          <div className="mobile-chat-drawer" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '10px 16px', background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>Room Chat</span>
              <button className="modal-close" onClick={() => setMobileChatOpen(false)}>✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChatPanel
                messages={room?.messages || []}
                typingUsers={typingUsers}
                onSendMessage={onSendMessage}
                onSendReaction={onSendReaction}
                onTyping={onTyping}
              />
            </div>
          </div>
        </div>
      )}

      {/* Change Video Modal */}
      <ChangeVideoModal
        isOpen={showChangeVideoModal}
        onClose={() => setShowChangeVideoModal(false)}
        onChangeVideo={onChangeVideo}
        currentVideoTitle={room?.videoTitle}
      />

      {/* Viewers Popover Drawer Modal */}
      <UserListModal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        users={userList}
        currentUserId={currentUser?.id}
        hostId={room?.hostId}
        isHost={isHost}
        onTransferHost={(id, name) => setTransferTarget({ id, name })}
        onLeaveRoom={() => {
          setShowUsersModal(false);
          setShowLeaveConfirm(true);
        }}
      />

      {/* Leave Room Confirmation Modal */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Leave Watch Room?"
        message={
          isHost && userList.length > 1
            ? 'You are the host. Leaving will automatically reassign host status to another connected viewer.'
            : 'Are you sure you want to leave this watch party?'
        }
        confirmText="Leave Room"
        confirmVariant="danger"
        onConfirm={onLeaveRoom}
        onCancel={() => setShowLeaveConfirm(false)}
      />

      {/* Host Transfer Confirmation Modal */}
      <ConfirmModal
        isOpen={!!transferTarget}
        title="Transfer Host Privileges?"
        message={`Are you sure you want to make ${transferTarget?.name} the new host?`}
        confirmText="Make Host"
        confirmVariant="primary"
        onConfirm={confirmTransferHost}
        onCancel={() => setTransferTarget(null)}
      />
    </div>
  );
};
