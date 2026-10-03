import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturesSection } from './components/FeaturesSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { Footer } from './components/Footer';
import { RoomUI } from './components/RoomUI';
import { LoadingScreen } from './components/LoadingScreen';
import { CreateRoomModal } from './components/CreateRoomModal';
import { JoinRoomModal } from './components/JoinRoomModal';
import { AboutModal } from './components/AboutModal';
import { ToastContainer } from './components/ToastContainer';
import { ParticleCanvas } from './components/ParticleCanvas';

// Connect to local Socket.IO server or proxy
const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:4000' : '/';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'room'
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Toasts state
  const [toasts, setToasts] = useState([]);

  // Current Room & User State
  const [room, setRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const socketRef = useRef(null);

  // Helper to add toast notifications
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial app setup & Socket Initialization
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      console.log('[Socket] Connected to server:', socket.id);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      console.log('[Socket] Disconnected from server');
    });

    socket.on('connect_error', () => {
      setSocketConnected(false);
    });

    // Initial room state synchronization
    socket.on('room_state', (state) => {
      console.log('[Socket] Received room_state:', state);
      setRoom({
        id: state.roomId,
        name: `Watch Room ${state.roomId}`,
        hostId: state.hostId,
        hostName: state.hostName,
        users: state.users,
        voiceUsers: state.voiceUsers || [],
        videoProvider: state.videoProvider || (state.video ? state.video.provider : 'youtube'),
        videoId: state.videoId || (state.video ? state.video.id : 'dQw4w9WgXcQ'),
        videoUrl: state.videoUrl || (state.video ? state.video.url : 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        videoTitle: state.videoTitle || (state.video ? state.video.title : 'YouTube Video'),
        playbackState: {
          isPlaying: state.isPlaying,
          currentTime: state.currentTime,
          lastUpdated: Date.now(),
        },
        messages: state.messages || [],
      });
    });

    socket.on('voice_users_updated', (voiceList) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          voiceUsers: voiceList,
        };
      });
    });

    // Room socket event listeners
    socket.on('user_joined', (data) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: data.users,
          messages: [...prev.messages, data.systemMessage],
        };
      });
      showToast(`${data.user.name} joined the room.`, 'info');
    });

    socket.on('user_left', (data) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: data.users,
          hostId: data.newHostId,
          hostName: data.newHostName,
          messages: [...prev.messages, data.systemMessage],
        };
      });
      showToast(`${data.userName} left the room.`, 'info');
    });

    socket.on('host_changed', (data) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hostId: data.newHostId,
          hostName: data.newHostName,
          users: data.users,
          messages: [...prev.messages, data.systemMessage],
        };
      });
      showToast(`${data.newHostName} is now the host.`, 'info');
    });

    const handlePlaySync = (data) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          playbackState: {
            ...prev.playbackState,
            isPlaying: true,
            currentTime: data.time !== undefined ? data.time : data.currentTime,
            lastUpdated: Date.now(),
          },
        };
      });
    };
    socket.on('video_played', handlePlaySync);
    socket.on('play', handlePlaySync);

    const handlePauseSync = (data) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          playbackState: {
            ...prev.playbackState,
            isPlaying: false,
            currentTime: data.time !== undefined ? data.time : data.currentTime,
            lastUpdated: Date.now(),
          },
        };
      });
    };
    socket.on('video_paused', handlePauseSync);
    socket.on('pause', handlePauseSync);

    const handleSeekSync = (data) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          playbackState: {
            ...prev.playbackState,
            currentTime: data.time !== undefined ? data.time : data.currentTime,
            lastUpdated: Date.now(),
          },
        };
      });
    };
    socket.on('video_seeked', handleSeekSync);
    socket.on('seek', handleSeekSync);

    socket.on('video_changed', (data) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          videoProvider: data.videoProvider,
          videoId: data.videoId,
          videoUrl: data.videoUrl,
          videoTitle: data.videoTitle,
          playbackState: { isPlaying: false, currentTime: 0 },
          messages: [...prev.messages, data.systemMessage],
        };
      });
      showToast(`Video changed to "${data.videoTitle}"`, 'info');
    });

    socket.on('new_message', (msg) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, msg],
        };
      });
    });

    socket.on('new_reaction', (rx) => {
      const reactionObj = {
        id: rx.id,
        emoji: rx.emoji,
        senderName: rx.senderName,
        left: Math.random() * 60 + 20,
      };
      setFloatingReactions((prev) => [...prev.slice(-12), reactionObj]);
    });

    socket.on('typing_status', (data) => {
      setTypingUsers((prev) => {
        if (data.isTyping) {
          if (!prev.includes(data.userName)) return [...prev, data.userName];
          return prev;
        } else {
          return prev.filter((u) => u !== data.userName);
        }
      });
    });

    socket.on('error_message', (data) => {
      showToast(data.message, 'error');
    });

    // Simulate initial loading animation sequence
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1200);

    return () => {
      clearTimeout(timer);
      socket.disconnect();
    };
  }, []);

  // Handle URL deep-linking e.g. /room/cinema-lounge
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/room/')) {
      const urlCode = path.replace('/room/', '').trim();
      if (urlCode && socketRef.current) {
        handleJoinRoom({ roomId: urlCode, userName: 'Watcher' });
      }
    }
  }, []);

  // Room Actions
  const handleCreateRoom = (data) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('WebSocket server offline.'));
        return;
      }

      socketRef.current.emit('create_room', data, (res) => {
        if (res.success) {
          setRoom(res.room);
          setCurrentUser(res.user);
          setCurrentView('room');
          window.history.pushState(null, '', `/room/${res.room.id}`);
          showToast(`Room "${res.room.name}" created!`, 'success');
          resolve(res);
        } else {
          reject(new Error(res.error || 'Failed to create room.'));
        }
      });
    });
  };

  const handleJoinRoom = (data) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('WebSocket server offline.'));
        return;
      }

      socketRef.current.emit('join_room', data, (res) => {
        if (res.success) {
          setRoom(res.room);
          setCurrentUser(res.user);
          setCurrentView('room');
          window.history.pushState(null, '', `/room/${res.room.id}`);
          showToast(`Joined ${res.room.name}!`, 'success');
          resolve(res);
        } else {
          reject(new Error(res.error || 'Room not found. Check code or URL.'));
        }
      });
    });
  };

  const handleStartDemoRoom = () => {
    handleJoinRoom({ roomId: 'cinema-lounge', userName: 'CinemaGuest' }).catch(() => {
      handleCreateRoom({
        name: 'Global Cinema Lounge',
        userName: 'CinemaGuest',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoTitle: 'Big Buck Bunny (4K Ultra HD)',
        privacy: 'public',
        controlsMode: 'everyone',
      });
    });
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room');
    }
    setRoom(null);
    setCurrentUser(null);
    setCurrentView('landing');
    window.history.pushState(null, '', '/');
    showToast('Left the room.', 'info');
  };

  // Video Control Senders
  const handlePlayVideo = (currentTime) => {
    socketRef.current?.emit('play_video', { currentTime, time: currentTime });
    socketRef.current?.emit('play', { time: currentTime });
  };

  const handlePauseVideo = (currentTime) => {
    socketRef.current?.emit('pause_video', { currentTime, time: currentTime });
    socketRef.current?.emit('pause', { time: currentTime });
  };

  const handleSeekVideo = (currentTime) => {
    socketRef.current?.emit('seek_video', { currentTime, time: currentTime });
    socketRef.current?.emit('seek', { time: currentTime });
  };

  const handleChangeVideo = (newVideoUrl) => {
    socketRef.current?.emit('change_video', {
      videoUrl: newVideoUrl,
      videoTitle: 'Custom Stream Video',
    });
  };

  // Chat & Reactions Senders
  const handleSendMessage = (text) => {
    socketRef.current?.emit('send_message', { text });
  };

  const handleSendReaction = (emoji) => {
    socketRef.current?.emit('send_reaction', { emoji });
  };

  const handleTyping = (isTyping) => {
    socketRef.current?.emit('user_typing', { isTyping });
  };

  const handleTransferHost = (targetUserId) => {
    socketRef.current?.emit('transfer_host', targetUserId, (res) => {
      if (!res.success) showToast(res.error, 'error');
    });
  };

 if (isInitialLoading) {
  return <LoadingScreen text="Preparing Aliza digital cinema..." />;
}

  return (
    <div className="app-root">
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Landing View vs Room View */}
      {currentView === 'landing' ? (
        <>
          {/* Ambient Particles Canvas */}
          <ParticleCanvas />

          {/* Navigation Bar */}
          <Navbar
            currentView={currentView}
            onNavigateHome={() => setCurrentView('landing')}
            onOpenCreateRoom={() => setIsCreateOpen(true)}
            onOpenJoinRoom={() => setIsJoinOpen(true)}
            onOpenAbout={() => setIsAboutOpen(true)}
          />

          {/* Main Hero Section */}
          <Hero
            onOpenCreateRoom={() => setIsCreateOpen(true)}
            onOpenJoinRoom={() => setIsJoinOpen(true)}
            onStartDemoRoom={handleStartDemoRoom}
          />

          {/* Features Section */}
          <FeaturesSection />

          {/* How It Works Section */}
          <HowItWorksSection onOpenCreateRoom={() => setIsCreateOpen(true)} />

          {/* Footer */}
          <Footer
            onOpenAbout={() => setIsAboutOpen(true)}
            onOpenPrivacy={() => showToast('Privacy Policy: WatchTogether respects your data. No logs stored.', 'info')}
            onOpenTerms={() => showToast('Terms: Free public watch lounge service.', 'info')}
            onOpenContact={() => showToast('Contact support: hello@watchtogether.io', 'info')}
          />
        </>
      ) : (
        <RoomUI
          room={room}
          currentUser={currentUser}
          socketConnected={socketConnected}
          onLeaveRoom={handleLeaveRoom}
          onPlayVideo={handlePlayVideo}
          onPauseVideo={handlePauseVideo}
          onSeekVideo={handleSeekVideo}
          onChangeVideo={handleChangeVideo}
          onSendMessage={handleSendMessage}
          onSendReaction={handleSendReaction}
          onTyping={handleTyping}
          onTransferHost={handleTransferHost}
          floatingReactions={floatingReactions}
          typingUsers={typingUsers}
          showToast={showToast}
        />
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      {/* Join Room Modal */}
      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoinRoom={handleJoinRoom}
      />

      {/* About & Credits Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
