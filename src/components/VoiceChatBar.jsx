import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Radio, Users } from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const VoiceChatBar = ({
  socket,
  roomId,
  currentUserId,
  currentUserName,
  voiceUsers = [],
  showToast,
}) => {
  const [inVoice, setInVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // targetUserId -> RTCPeerConnection
  const remoteAudioElementsRef = useRef(new Map()); // targetUserId -> HTMLAudioElement

  // Clean up WebRTC peer connections when leaving room
  useEffect(() => {
    return () => {
      leaveVoice();
    };
  }, []);

  // WebRTC Socket Signaling Listeners
  useEffect(() => {
    if (!socket) return;

    const handleVoiceUserJoined = async ({ userId, user }) => {
      if (!inVoice || userId === currentUserId) return;
      console.log(`[WebRTC] Voice user joined: ${userId}, creating offer...`);
      createPeerOffer(userId);
    };

    const handleVoiceOffer = async ({ fromUserId, offer }) => {
      if (!inVoice) return;
      console.log(`[WebRTC] Received offer from ${fromUserId}, sending answer...`);
      handlePeerOffer(fromUserId, offer);
    };

    const handleVoiceAnswer = async ({ fromUserId, answer }) => {
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (pc) {
        console.log(`[WebRTC] Received answer from ${fromUserId}`);
        await pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(console.error);
      }
    };

    const handleIceCandidate = async ({ fromUserId, candidate }) => {
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
      }
    };

    const handleVoiceUserLeft = ({ userId }) => {
      closePeer(userId);
    };

    socket.on('voice_user_joined', handleVoiceUserJoined);
    socket.on('voice_offer', handleVoiceOffer);
    socket.on('voice_answer', handleVoiceAnswer);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('voice_user_left', handleVoiceUserLeft);

    return () => {
      socket.off('voice_user_joined', handleVoiceUserJoined);
      socket.off('voice_offer', handleVoiceOffer);
      socket.off('voice_answer', handleVoiceAnswer);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('voice_user_left', handleVoiceUserLeft);
    };
  }, [socket, inVoice, currentUserId]);

  const joinVoice = async () => {
    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      localStreamRef.current = stream;
      setInVoice(true);
      setIsMuted(false);
      setIsConnecting(false);

      if (socket) {
        socket.emit('join_voice');
      }

      showToast('Joined voice chat.', 'success');

      // Create offers to any existing voice users in room
      voiceUsers.forEach((usr) => {
        if (usr.id !== currentUserId) {
          createPeerOffer(usr.id);
        }
      });
    } catch (err) {
      setIsConnecting(false);
      console.error('Microphone permission error:', err);
      showToast('Microphone permission is required to join voice.', 'error');
    }
  };

  const leaveVoice = () => {
    // Stop mic tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close all P2P connections
    peerConnectionsRef.current.forEach((pc, userId) => {
      pc.close();
    });
    peerConnectionsRef.current.clear();

    // Remove remote audio elements
    remoteAudioElementsRef.current.forEach((audio) => {
      audio.srcObject = null;
      audio.remove();
    });
    remoteAudioElementsRef.current.clear();

    setInVoice(false);
    setIsMuted(false);

    if (socket) {
      socket.emit('leave_voice');
    }
  };

  const toggleMuteMic = () => {
    if (!localStreamRef.current) return;
    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);

    if (socket) {
      socket.emit('voice_state_update', { isMuted: nextMuted });
    }
  };

  const toggleSpeakerMute = () => {
    const nextMuted = !isSpeakerMuted;
    setIsSpeakerMuted(nextMuted);
    remoteAudioElementsRef.current.forEach((audio) => {
      audio.muted = nextMuted;
    });
  };

  // Create WebRTC Peer Offer
  const createPeerOffer = async (targetUserId) => {
    if (peerConnectionsRef.current.has(targetUserId)) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(targetUserId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      attachRemoteStream(targetUserId, event.streams[0]);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (socket) {
      socket.emit('voice_offer', {
        targetUserId,
        offer,
      });
    }
  };

  // Handle Incoming WebRTC Peer Offer
  const handlePeerOffer = async (fromUserId, offer) => {
    let pc = peerConnectionsRef.current.get(fromUserId);
    if (!pc) {
      pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(fromUserId, pc);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice_candidate', {
            targetUserId: fromUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        attachRemoteStream(fromUserId, event.streams[0]);
      };
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (socket) {
      socket.emit('voice_answer', {
        targetUserId: fromUserId,
        answer,
      });
    }
  };

  const attachRemoteStream = (userId, stream) => {
    let audio = remoteAudioElementsRef.current.get(userId);
    if (!audio) {
      audio = document.createElement('audio');
      audio.autoplay = true;
      audio.muted = isSpeakerMuted;
      document.body.appendChild(audio);
      remoteAudioElementsRef.current.set(userId, audio);
    }
    audio.srcObject = stream;
  };

  const closePeer = (userId) => {
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(userId);
    }

    const audio = remoteAudioElementsRef.current.get(userId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      remoteAudioElementsRef.current.delete(userId);
    }
  };

  return (
    <div className="voice-bar-container">
      <style>{`
        .voice-bar-container {
          background: var(--surface-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .voice-participants-list {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .voice-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background: var(--surface-secondary);
          border: 1px solid var(--border-color);
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .voice-chip-speaking {
          border-color: var(--success-green);
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.4);
        }

        .voice-chip-muted {
          color: var(--text-muted);
        }
      `}</style>

      {/* Voice Participants Avatars */}
      <div className="voice-participants-list">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          <Radio size={16} color="var(--accent-pink)" />
          <span>Voice ({voiceUsers.length})</span>
        </div>

        {voiceUsers.map((usr) => (
          <div
            key={usr.id}
            className={`voice-chip ${usr.isSpeaking ? 'voice-chip-speaking' : ''} ${usr.isMuted ? 'voice-chip-muted' : ''}`}
          >
            {usr.isMuted ? <MicOff size={13} color="var(--text-muted)" /> : <Mic size={13} color="var(--success-green)" />}
            <span>{usr.name}</span>
          </div>
        ))}

        {voiceUsers.length === 0 && (
          <span className="form-hint">No one in voice chat yet</span>
        )}
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!inVoice ? (
          <button
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            onClick={joinVoice}
            disabled={isConnecting}
          >
            <Mic size={15} />
            {isConnecting ? 'Connecting...' : 'Join voice'}
          </button>
        ) : (
          <>
            <button
              className={`btn ${isMuted ? 'btn-danger' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={toggleMuteMic}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
              <span>{isMuted ? 'Muted' : 'Microphone'}</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={toggleSpeakerMute}
              title={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
            >
              {isSpeakerMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <button
              className="btn btn-danger"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={leaveVoice}
              title="Leave voice chat"
            >
              <PhoneOff size={15} />
              <span>Leave voice</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
