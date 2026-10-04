
import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Radio } from 'lucide-react';

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

  const inVoiceRef = useRef(false);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const remoteAudioElementsRef = useRef(new Map());
  const pendingIceCandidatesRef = useRef(new Map());

  const attachPeerHandlers = (pc, targetUserId) => {
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

    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        if (pc.connectionState === 'failed') {
          console.warn(`[WebRTC] Connection failed: ${targetUserId}`);
        }
      }
    };
  };

  const createPeerConnection = (targetUserId) => {
    let pc = peerConnectionsRef.current.get(targetUserId);
    if (pc) return pc;

    pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(targetUserId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    attachPeerHandlers(pc, targetUserId);
    return pc;
  };

  const flushPendingIce = async (targetUserId, pc) => {
    const queued = pendingIceCandidatesRef.current.get(targetUserId) || [];
    pendingIceCandidatesRef.current.delete(targetUserId);

    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] Failed queued ICE candidate:', err);
      }
    }
  };

  const createPeerOffer = async (targetUserId) => {
    if (!inVoiceRef.current || targetUserId === currentUserId) return;
    if (peerConnectionsRef.current.has(targetUserId)) return;

    try {
      const pc = createPeerConnection(targetUserId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket?.emit('voice_offer', {
        targetUserId,
        offer: pc.localDescription,
      });
    } catch (err) {
      console.error('[WebRTC] Offer failed:', err);
    }
  };

  const handlePeerOffer = async (fromUserId, offer) => {
    if (!inVoiceRef.current) return;

    try {
      const pc = createPeerConnection(fromUserId);

      if (pc.signalingState !== 'stable') {
        console.warn('[WebRTC] Ignoring duplicate/colliding offer from', fromUserId);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingIce(fromUserId, pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket?.emit('voice_answer', {
        targetUserId: fromUserId,
        answer: pc.localDescription,
      });
    } catch (err) {
      console.error('[WebRTC] Offer handling failed:', err);
    }
  };

  const attachRemoteStream = (userId, stream) => {
    let audio = remoteAudioElementsRef.current.get(userId);

    if (!audio) {
      audio = document.createElement('audio');
      audio.autoplay = true;
      audio.playsInline = true;
      audio.controls = false;
      audio.muted = isSpeakerMuted;
      audio.style.display = 'none';
      document.body.appendChild(audio);
      remoteAudioElementsRef.current.set(userId, audio);
    }

    audio.srcObject = stream;

    audio.play().catch((err) => {
      console.warn('[WebRTC] Remote audio playback was blocked:', err);
      showToast?.('Voice audio is blocked by the browser. Tap the speaker button to try again.', 'info');
    });
  };

  const closePeer = (userId) => {
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(userId);
    }

    pendingIceCandidatesRef.current.delete(userId);

    const audio = remoteAudioElementsRef.current.get(userId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      remoteAudioElementsRef.current.delete(userId);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleExistingVoiceUsers = (users) => {
      if (!inVoiceRef.current) return;

      users.forEach((user) => {
        if (user.id !== currentUserId) {
          createPeerOffer(user.id);
        }
      });
    };

    const handleVoiceOffer = ({ fromUserId, offer }) => {
      handlePeerOffer(fromUserId, offer);
    };

    const handleVoiceAnswer = async ({ fromUserId, answer }) => {
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingIce(fromUserId, pc);
      } catch (err) {
        console.error('[WebRTC] Answer handling failed:', err);
      }
    };

    const handleIceCandidate = async ({ fromUserId, candidate }) => {
      if (!candidate) return;

      const pc = peerConnectionsRef.current.get(fromUserId);

      if (!pc || !pc.remoteDescription) {
        const queue = pendingIceCandidatesRef.current.get(fromUserId) || [];
        queue.push(candidate);
        pendingIceCandidatesRef.current.set(fromUserId, queue);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[WebRTC] ICE candidate failed:', err);
      }
    };

    const handleVoiceUserLeft = ({ userId }) => {
      closePeer(userId);
    };

    socket.on('voice_existing_users', handleExistingVoiceUsers);
    socket.on('voice_offer', handleVoiceOffer);
    socket.on('voice_answer', handleVoiceAnswer);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('voice_user_left', handleVoiceUserLeft);

    return () => {
      socket.off('voice_existing_users', handleExistingVoiceUsers);
      socket.off('voice_offer', handleVoiceOffer);
      socket.off('voice_answer', handleVoiceAnswer);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('voice_user_left', handleVoiceUserLeft);
    };
  }, [socket, currentUserId, isSpeakerMuted]);

  const joinVoice = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('Microphone access is not available in this browser.', 'error');
      return;
    }

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
      inVoiceRef.current = true;
      setInVoice(true);
      setIsMuted(false);

      socket?.emit('join_voice');
      showToast('Joined voice chat.', 'success');
    } catch (err) {
      console.error('Microphone permission error:', err);
      showToast(
        err?.name === 'NotAllowedError'
          ? 'Allow microphone access in your browser and try again.'
          : 'Could not access your microphone.',
        'error'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const leaveVoice = () => {
    inVoiceRef.current = false;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    remoteAudioElementsRef.current.forEach((audio) => {
      audio.srcObject = null;
      audio.remove();
    });
    remoteAudioElementsRef.current.clear();
    pendingIceCandidatesRef.current.clear();

    setInVoice(false);
    setIsMuted(false);
    socket?.emit('leave_voice');
  };

  useEffect(() => {
    return () => {
      inVoiceRef.current = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      peerConnectionsRef.current.forEach((pc) => pc.close());
      remoteAudioElementsRef.current.forEach((audio) => audio.remove());
      socket?.emit('leave_voice');
    };
  }, [socket]);

  const toggleMuteMic = () => {
    if (!localStreamRef.current) return;

    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    setIsMuted(nextMuted);
    socket?.emit('voice_state_update', { isMuted: nextMuted });
  };

  const toggleSpeakerMute = () => {
    const nextMuted = !isSpeakerMuted;
    setIsSpeakerMuted(nextMuted);

    remoteAudioElementsRef.current.forEach((audio) => {
      audio.muted = nextMuted;
      if (!nextMuted) {
        audio.play().catch((err) => {
          console.warn('[WebRTC] Speaker playback retry failed:', err);
        });
      }
    });
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!inVoice ? (
          <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={joinVoice} disabled={isConnecting}>
            <Mic size={15} />
            {isConnecting ? 'Connecting...' : 'Join voice'}
          </button>
        ) : (
          <>
            <button className={`btn ${isMuted ? 'btn-danger' : 'btn-secondary'}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={toggleMuteMic}>
              {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
              <span>{isMuted ? 'Muted' : 'Microphone'}</span>
            </button>

            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={toggleSpeakerMute}>
              {isSpeakerMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={leaveVoice}>
              <PhoneOff size={15} />
              <span>Leave voice</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
