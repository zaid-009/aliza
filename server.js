import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// In-memory Room Store
const rooms = new Map();

// Initial Default Lounge
const INITIAL_DEMO_ROOM_ID = 'cinema-lounge';
rooms.set(INITIAL_DEMO_ROOM_ID, {
  id: INITIAL_DEMO_ROOM_ID,
  name: 'Global Cinema Lounge',
  videoProvider: 'youtube', // 'youtube' | 'html5'
  videoId: 'dQw4w9WgXcQ', // default YouTube video ID
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  videoTitle: 'WatchTogether Sync Cinema',
  privacy: 'public',
  controlsMode: 'everyone',
  hostId: null,
  hostName: 'System',
  createdAt: Date.now(),
  users: new Map(),
  voiceUsers: new Map(), // socketId -> { id, name, isMuted, isSpeaking }
  playbackState: {
    isPlaying: false,
    currentTime: 0,
    lastUpdated: Date.now(),
  },
  messages: [
    {
      id: 'msg-1',
      sender: 'WatchTogether Bot',
      text: 'Welcome to WatchTogether! Play videos, chat live, and talk in voice chat.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: '🤖',
      isSystem: true,
    },
  ],
});

// Utility to parse YouTube Video ID
function parseYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size, timestamp: Date.now() });
});

function sanitizeRoom(room) {
  return {
    id: room.id,
    name: room.name,
    videoProvider: room.videoProvider,
    videoId: room.videoId,
    videoUrl: room.videoUrl,
    videoTitle: room.videoTitle,
    privacy: room.privacy,
    controlsMode: room.controlsMode,
    hostId: room.hostId,
    hostName: room.hostName,
    createdAt: room.createdAt,
    users: Array.from(room.users.values()),
    voiceUsers: Array.from(room.voiceUsers.values()),
    playbackState: room.playbackState,
    messages: room.messages,
  };
}

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // CREATE ROOM
  socket.on('create_room', (data, callback) => {
    const { name, videoUrl, videoTitle, privacy, controlsMode, userName, displayName } = data;
    const finalUserName = displayName || userName || `Host_${socket.id.substring(0, 4)}`;
    const roomId = Math.random().toString(36).substring(2, 8).toLowerCase();

    const inputUrl = videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const ytId = parseYouTubeId(inputUrl);

    const newUser = {
      id: socket.id,
      name: finalUserName,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${socket.id}`,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      isHost: true,
      inVoice: false,
      joinedAt: Date.now(),
    };

    const newRoom = {
      id: roomId,
      name: name || `Watch Room ${roomId}`,
      videoProvider: ytId ? 'youtube' : 'html5',
      videoId: ytId || '',
      videoUrl: inputUrl,
      videoTitle: videoTitle || (ytId ? 'YouTube Video' : 'Custom Video'),
      privacy: privacy || 'public',
      controlsMode: controlsMode || 'everyone',
      hostId: socket.id,
      hostName: newUser.name,
      createdAt: Date.now(),
      users: new Map([[socket.id, newUser]]),
      voiceUsers: new Map(),
      playbackState: {
        isPlaying: false,
        currentTime: 0,
        lastUpdated: Date.now(),
      },
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'System',
          text: `Room created by ${newUser.name}. Invite friends to watch together!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: '🎬',
          isSystem: true,
        },
      ],
    };

    rooms.set(roomId, newRoom);
    socket.join(roomId);
    socket.currentRoom = roomId;

    console.log(`[Room Created] ${roomId} by ${newUser.name}`);

    // Emit initial room state to creator
    socket.emit('room_state', {
      roomId: newRoom.id,
      hostId: newRoom.hostId,
      hostName: newRoom.hostName,
      videoProvider: newRoom.videoProvider,
      videoId: newRoom.videoId,
      videoUrl: newRoom.videoUrl,
      videoTitle: newRoom.videoTitle,
      users: Array.from(newRoom.users.values()),
      voiceUsers: Array.from(newRoom.voiceUsers.values()),
      currentTime: newRoom.playbackState.currentTime,
      isPlaying: newRoom.playbackState.isPlaying,
      messages: newRoom.messages,
    });

    if (typeof callback === 'function') {
      callback({ success: true, room: sanitizeRoom(newRoom), user: newUser });
    }
  });

  // JOIN ROOM
  socket.on('join_room', (data, callback) => {
    const { roomId, userName, displayName } = data;
    const cleanRoomId = roomId ? roomId.trim().toLowerCase() : '';
    const finalUserName = displayName || userName || `Watcher_${socket.id.substring(0, 4)}`;

    const room = rooms.get(cleanRoomId);

    if (!room) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Room not found. Check the room code or URL.' });
      }
      return;
    }

    const isFirstUser = room.users.size === 0;
    const isHost = isFirstUser || room.hostId === socket.id;
    if (isFirstUser) {
      room.hostId = socket.id;
      room.hostName = finalUserName;
    }

    const newUser = {
      id: socket.id,
      name: finalUserName,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${socket.id}`,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      isHost: isHost,
      inVoice: false,
      joinedAt: Date.now(),
    };

    room.users.set(socket.id, newUser);
    socket.join(cleanRoomId);
    socket.currentRoom = cleanRoomId;

    const sysMsg = {
      id: `sys-${Date.now()}`,
      sender: 'System',
      text: `${newUser.name} joined the room.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: '👋',
      isSystem: true,
    };
    room.messages.push(sysMsg);

    // Compute current playback position if playing
    let currentCalcTime = room.playbackState.currentTime;
    if (room.playbackState.isPlaying) {
      const elapsed = (Date.now() - room.playbackState.lastUpdated) / 1000;
      currentCalcTime += elapsed;
    }

    // Emit initial room state to newly joined user
    socket.emit('room_state', {
      roomId: room.id,
      hostId: room.hostId,
      hostName: room.hostName,
      videoProvider: room.videoProvider,
      videoId: room.videoId,
      videoUrl: room.videoUrl,
      videoTitle: room.videoTitle,
      users: Array.from(room.users.values()),
      voiceUsers: Array.from(room.voiceUsers.values()),
      currentTime: currentCalcTime,
      isPlaying: room.playbackState.isPlaying,
      messages: room.messages,
    });

    // Notify other clients in room
    socket.to(cleanRoomId).emit('user_joined', {
      user: newUser,
      users: Array.from(room.users.values()),
      systemMessage: sysMsg,
    });

    console.log(`[User Joined] ${newUser.name} joined ${cleanRoomId}`);

    if (typeof callback === 'function') {
      callback({ success: true, room: sanitizeRoom(room), user: newUser });
    }
  });

  // PLAY
  const handlePlay = (data) => {
    const roomId = socket.currentRoom;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.controlsMode === 'hostOnly' && room.hostId !== socket.id) {
      socket.emit('error_message', { message: 'Only the host controls playback.' });
      return;
    }

    const t = data.time !== undefined ? data.time : data.currentTime;
    room.playbackState.isPlaying = true;
    room.playbackState.currentTime = t !== undefined ? t : room.playbackState.currentTime;
    room.playbackState.lastUpdated = Date.now();

    io.to(roomId).emit('video_played', {
      currentTime: room.playbackState.currentTime,
      time: room.playbackState.currentTime,
      triggeredBy: socket.id,
    });
    io.to(roomId).emit('play', {
      type: 'play',
      time: room.playbackState.currentTime,
      triggeredBy: socket.id,
    });
  };
  socket.on('play_video', handlePlay);
  socket.on('play', handlePlay);

  // PAUSE
  const handlePause = (data) => {
    const roomId = socket.currentRoom;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.controlsMode === 'hostOnly' && room.hostId !== socket.id) {
      socket.emit('error_message', { message: 'Only the host controls playback.' });
      return;
    }

    const t = data.time !== undefined ? data.time : data.currentTime;
    room.playbackState.isPlaying = false;
    room.playbackState.currentTime = t !== undefined ? t : room.playbackState.currentTime;
    room.playbackState.lastUpdated = Date.now();

    io.to(roomId).emit('video_paused', {
      currentTime: room.playbackState.currentTime,
      time: room.playbackState.currentTime,
      triggeredBy: socket.id,
    });
    io.to(roomId).emit('pause', {
      type: 'pause',
      time: room.playbackState.currentTime,
      triggeredBy: socket.id,
    });
  };
  socket.on('pause_video', handlePause);
  socket.on('pause', handlePause);

  // SEEK
  const handleSeek = (data) => {
    const roomId = socket.currentRoom;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.controlsMode === 'hostOnly' && room.hostId !== socket.id) {
      socket.emit('error_message', { message: 'Only the host controls playback.' });
      return;
    }

    const t = data.time !== undefined ? data.time : data.currentTime;
    room.playbackState.currentTime = t;
    room.playbackState.lastUpdated = Date.now();

    io.to(roomId).emit('video_seeked', {
      currentTime: t,
      time: t,
      triggeredBy: socket.id,
    });
    io.to(roomId).emit('seek', {
      type: 'seek',
      time: t,
      triggeredBy: socket.id,
    });
  };
  socket.on('seek_video', handleSeek);
  socket.on('seek', handleSeek);

  // CHANGE VIDEO (YouTube or HTML5)
  socket.on('change_video', (data) => {
    const roomId = socket.currentRoom;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.controlsMode === 'hostOnly' && room.hostId !== socket.id) {
      socket.emit('error_message', { message: 'Only the host can change the video.' });
      return;
    }

    const inputUrl = data.videoUrl || data.url;
    const ytId = parseYouTubeId(inputUrl);

    room.videoUrl = inputUrl;
    room.videoProvider = ytId ? 'youtube' : 'html5';
    room.videoId = ytId || '';
    room.videoTitle = data.videoTitle || (ytId ? 'YouTube Video' : 'Custom Video');
    room.playbackState.currentTime = 0;
    room.playbackState.isPlaying = false;
    room.playbackState.lastUpdated = Date.now();

    const sysMsg = {
      id: `sys-${Date.now()}`,
      sender: 'System',
      text: `Video changed to "${room.videoTitle}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: '📺',
      isSystem: true,
    };
    room.messages.push(sysMsg);

    io.to(roomId).emit('video_changed', {
      videoProvider: room.videoProvider,
      videoId: room.videoId,
      videoUrl: room.videoUrl,
      videoTitle: room.videoTitle,
      systemMessage: sysMsg,
    });
  });

  // CHAT MESSAGES
  const handleSendMessage = (data) => {
    const roomId = socket.currentRoom;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    const msgText = data.text || data.message || '';
    if (!msgText.trim()) return;

    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: user ? user.name : (data.displayName || 'Watcher'),
      senderId: socket.id,
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: user ? user.avatar : '👤',
      isHost: user ? user.isHost : false,
      isSystem: false,
    };

    room.messages.push(msg);
    if (room.messages.length > 200) room.messages.shift();

    io.to(roomId).emit('new_message', msg);
    io.to(roomId).emit('chat_message', {
      roomId,
      userId: socket.id,
      displayName: msg.sender,
      message: msg.text,
      timestamp: msg.timestamp,
    });
  };
  socket.on('send_message', handleSendMessage);
  socket.on('chat_message', handleSendMessage);

  // FLOATING REACTIONS
  socket.on('send_reaction', (data) => {
    const roomId = socket.currentRoom;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    io.to(roomId).emit('new_reaction', {
      emoji: data.emoji,
      senderName: user ? user.name : 'Someone',
      senderId: socket.id,
      id: `rx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    });
  });

  // TYPING STATUS
  socket.on('user_typing', (data) => {
    const roomId = socket.currentRoom;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    socket.to(roomId).emit('typing_status', {
      userName: user ? user.name : 'Someone',
      userId: socket.id,
      isTyping: !!data.isTyping,
    });
  });

  // WEBRTC VOICE CHAT SIGNALING
  socket.on('join_voice', () => {
    const roomId = socket.currentRoom;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    const voiceState = {
      id: socket.id,
      name: user ? user.name : 'Watcher',
      avatar: user ? user.avatar : '',
      isMuted: false,
      isSpeaking: false,
    };

    if (user) user.inVoice = true;
    room.voiceUsers.set(socket.id, voiceState);

    // Notify room of new voice participant
    io.to(roomId).emit('voice_users_updated', Array.from(room.voiceUsers.values()));
    socket.to(roomId).emit('voice_user_joined', { userId: socket.id, user: voiceState });

    console.log(`[Voice Joined] ${voiceState.name} in ${roomId}`);
  });

  socket.on('leave_voice', () => {
    handleLeaveVoice(socket);
  });

  socket.on('voice_state_update', (data) => {
    const roomId = socket.currentRoom;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const voiceUser = room.voiceUsers.get(socket.id);
    if (voiceUser) {
      if (data.isMuted !== undefined) voiceUser.isMuted = data.isMuted;
      if (data.isSpeaking !== undefined) voiceUser.isSpeaking = data.isSpeaking;

      io.to(roomId).emit('voice_users_updated', Array.from(room.voiceUsers.values()));
    }
  });

  // WebRTC P2P Signaling Relay
  socket.on('voice_offer', (data) => {
    const { targetUserId, offer } = data;
    io.to(targetUserId).emit('voice_offer', {
      fromUserId: socket.id,
      offer,
    });
  });

  socket.on('voice_answer', (data) => {
    const { targetUserId, answer } = data;
    io.to(targetUserId).emit('voice_answer', {
      fromUserId: socket.id,
      answer,
    });
  });

  socket.on('ice_candidate', (data) => {
    const { targetUserId, candidate } = data;
    io.to(targetUserId).emit('ice_candidate', {
      fromUserId: socket.id,
      candidate,
    });
  });

  // HOST TRANSFER
  socket.on('transfer_host', (targetUserId, callback) => {
    const roomId = socket.currentRoom;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) {
      if (typeof callback === 'function') callback({ success: false, error: 'Only current host can transfer host status.' });
      return;
    }

    const targetUser = room.users.get(targetUserId);
    if (!targetUser) {
      if (typeof callback === 'function') callback({ success: false, error: 'Target user not in room.' });
      return;
    }

    const oldHost = room.users.get(socket.id);
    if (oldHost) oldHost.isHost = false;

    targetUser.isHost = true;
    room.hostId = targetUserId;
    room.hostName = targetUser.name;

    const sysMsg = {
      id: `sys-${Date.now()}`,
      sender: 'System',
      text: `${targetUser.name} is now the host.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: '👑',
      isSystem: true,
    };
    room.messages.push(sysMsg);

    io.to(roomId).emit('host_changed', {
      newHostId: targetUserId,
      newHostName: targetUser.name,
      users: Array.from(room.users.values()),
      systemMessage: sysMsg,
    });

    if (typeof callback === 'function') callback({ success: true });
  });

  // LEAVE ROOM & DISCONNECT
  socket.on('leave_room', () => {
    handleDisconnect(socket);
  });

  socket.on('disconnect', () => {
    handleDisconnect(socket);
  });

  function handleLeaveVoice(sock) {
    const roomId = sock.currentRoom;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.voiceUsers.has(sock.id)) {
      room.voiceUsers.delete(sock.id);
      const user = room.users.get(sock.id);
      if (user) user.inVoice = false;

      io.to(roomId).emit('voice_users_updated', Array.from(room.voiceUsers.values()));
      sock.to(roomId).emit('voice_user_left', { userId: sock.id });
      console.log(`[Voice Left] ${sock.id} left voice in ${roomId}`);
    }
  }

  function handleDisconnect(sock) {
    handleLeaveVoice(sock);

    const roomId = sock.currentRoom;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const user = room.users.get(sock.id);
    if (user) {
      room.users.delete(sock.id);
      sock.leave(roomId);
      sock.currentRoom = null;

      console.log(`[User Left] ${user.name} left ${roomId}`);

      let hostReassigned = false;
      let newHostName = null;

      if (room.hostId === sock.id && room.users.size > 0) {
        const [firstRemainingId, firstRemainingUser] = room.users.entries().next().value;
        firstRemainingUser.isHost = true;
        room.hostId = firstRemainingId;
        room.hostName = firstRemainingUser.name;
        hostReassigned = true;
        newHostName = firstRemainingUser.name;
      }

      const sysMsg = {
        id: `sys-${Date.now()}`,
        sender: 'System',
        text: hostReassigned
          ? `${user.name} left the room. ${newHostName} is now the host.`
          : `${user.name} left the room.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: '🚪',
        isSystem: true,
      };
      room.messages.push(sysMsg);

      io.to(roomId).emit('user_left', {
        userId: sock.id,
        userName: user.name,
        users: Array.from(room.users.values()),
        newHostId: room.hostId,
        newHostName: room.hostName,
        systemMessage: sysMsg,
      });

      if (hostReassigned) {
        io.to(roomId).emit('host_changed', {
          newHostId: room.hostId,
          newHostName: room.hostName,
          users: Array.from(room.users.values()),
          systemMessage: sysMsg,
        });
      }

      if (room.users.size === 0 && roomId !== INITIAL_DEMO_ROOM_ID) {
        rooms.delete(roomId);
        console.log(`[Room Deleted] Room ${roomId} was emptied.`);
      }
    }
  }
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Aliza Server] Running on port ${PORT}`);
});