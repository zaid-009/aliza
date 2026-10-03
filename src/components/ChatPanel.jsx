import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, MessageSquare, Crown } from 'lucide-react';

const REACTION_EMOJIS = ['❤️', '😂', '😭', '😱', '🔥', '👏', '🎉', '🍿'];

export const ChatPanel = ({
  messages,
  typingUsers,
  onSendMessage,
  onSendReaction,
  onTyping,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lastReactionTime, setLastReactionTime] = useState(0);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Smart Auto-Scroll to bottom if near bottom
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);

    // Notify socket typing status
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');

    if (onTyping) onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Cooldown rate-limited reaction sender
  const handleReactionClick = (emoji) => {
    const now = Date.now();
    if (now - lastReactionTime < 350) return; // 350ms cooldown
    setLastReactionTime(now);

    if (onSendReaction) {
      onSendReaction(emoji);
    }
  };

  return (
    <div className="chat-panel-container">
      <style>{`
        .chat-panel-container {
          background: var(--surface-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 440px;
          overflow: hidden;
        }

        .chat-panel-header {
          padding: 14px 18px;
          background: var(--surface-secondary);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .chat-messages-area {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chat-msg-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          animation: fadeIn 0.2s ease-out;
        }

        .chat-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface-secondary);
          border: 1px solid var(--border-highlight);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .chat-msg-content {
          background: var(--surface-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 8px 12px;
          max-width: 86%;
          font-size: 0.88rem;
          line-height: 1.45;
        }

        .chat-msg-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
          font-size: 0.78rem;
        }

        .chat-sender-name {
          font-weight: 700;
          color: var(--text-primary);
        }

        .chat-system-msg {
          text-align: center;
          font-size: 0.78rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed var(--border-color);
          padding: 6px 12px;
          border-radius: var(--radius-full);
          margin: 4px auto;
          max-width: 90%;
        }

        .typing-indicator {
          padding: 4px 18px;
          font-size: 0.78rem;
          color: var(--accent-purple);
          font-style: italic;
        }

        .chat-reactions-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--surface-secondary);
          border-top: 1px solid var(--border-color);
          overflow-x: auto;
        }

        .reaction-emoji-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 4px 8px;
          font-size: 1.1rem;
          transition: transform 0.15s ease, background 0.15s ease;
        }

        .reaction-emoji-btn:hover {
          transform: scale(1.25);
          background: rgba(255,255,255,0.12);
        }

        .chat-input-row {
          padding: 12px 14px;
          background: var(--surface-primary);
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .chat-textarea {
          flex: 1;
          background: var(--surface-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          font-size: 0.9rem;
          color: var(--text-primary);
          outline: none;
          resize: none;
          max-height: 80px;
        }

        .chat-textarea:focus {
          border-color: var(--accent-pink);
        }
      `}</style>

      <div className="chat-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={18} color="var(--accent-pink)" />
          <span>Room Chat</span>
        </div>
        <span className="form-hint">{messages.length} messages</span>
      </div>

      {/* Messages List Area */}
      <div ref={chatContainerRef} className="chat-messages-area">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="chat-system-msg">
                <span>{msg.avatar || '💬'}</span> {msg.text}
              </div>
            );
          }

          return (
            <div key={msg.id} className="chat-msg-row">
              <div className="chat-avatar">
                {msg.avatar ? (
                  <img
                    src={msg.avatar}
                    alt={msg.sender}
                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  msg.sender.charAt(0).toUpperCase()
                )}
              </div>

              <div className="chat-msg-content">
                <div className="chat-msg-header">
                  <span className="chat-sender-name">{msg.sender}</span>
                  {msg.isHost && (
                    <Crown size={12} color="var(--accent-pink)" title="Host" />
                  )}
                  <span className="form-hint" style={{ marginLeft: 'auto' }}>
                    {msg.timestamp}
                  </span>
                </div>
                <div>{msg.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing status indicator */}
      {typingUsers && typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Quick Reaction Bar */}
      <div className="chat-reactions-bar">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="reaction-emoji-btn"
            onClick={() => handleReactionClick(emoji)}
            title={`Send floating ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSubmit} className="chat-input-row">
        <textarea
          className="chat-textarea"
          rows={1}
          placeholder="Say something to the room..."
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />

        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '10px 14px' }}
          disabled={!inputText.trim()}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
