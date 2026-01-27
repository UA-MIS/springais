/**
 * RoadmapAssistant - AI chat component for roadmap assistance
 *
 * Features:
 * - Full chat interface for asking questions about the roadmap
 * - Suggested questions based on context
 * - Always collapsible/togglable
 */

import { useState, useRef, useEffect } from 'react';
import { useTheme, themeColors } from '../../context/ThemeContext';
import { useRoadmap } from '../../hooks/useRoadmap';

interface RoadmapAssistantProps {
  visible: boolean;
}

const SUGGESTED_QUESTIONS = [
  'What should I focus on first?',
  'How can I accelerate my progress?',
  'What resources do you recommend?',
  'How do I overcome the challenges?',
  'Can you explain this milestone?',
];

export default function RoadmapAssistant({ visible }: RoadmapAssistantProps) {
  const { isDark } = useTheme();
  const colors = isDark ? themeColors.dark : themeColors.light;

  const {
    chatMessages,
    chatLoading,
    sendChatMessage,
    toggleChat,
  } = useRoadmap();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatLoading) return;

    const message = input;
    setInput('');
    await sendChatMessage(message);
  };

  const handleSuggestedQuestion = (question: string) => {
    sendChatMessage(question);
  };

  // Show floating button when not visible
  if (!visible) {
    return (
      <button
        onClick={toggleChat}
        className="fixed right-4 bottom-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 transition-all active:scale-95"
        style={{ backgroundColor: colors.accent, color: '#2e2e38' }}
        title="Open Roadmap Assistant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="fixed right-4 bottom-4 w-96 rounded-2xl overflow-hidden shadow-2xl z-50 flex flex-col"
      style={{
        backgroundColor: isDark ? '#1a1a1f' : '#fff',
        border: `1px solid ${colors.cardBorder}`,
        maxHeight: 'calc(100vh - 120px)',
      }}
    >
      {/* Header */}
      <div
        className="p-4 font-semibold flex items-center justify-between flex-shrink-0"
        style={{ backgroundColor: colors.accent, color: '#2e2e38' }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>Roadmap Assistant</span>
        </div>
        <button onClick={toggleChat} className="hover:opacity-70 transition-opacity" title="Close assistant">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
        {chatMessages.length === 0 && (
          <div className="text-sm" style={{ color: colors.textMuted }}>
            <p className="mb-3">
              I'm your career roadmap assistant! Ask me anything about your plan.
            </p>
            <p className="text-xs font-medium mb-2">Try asking:</p>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="block w-full text-left text-xs p-2 rounded-lg transition-colors hover:bg-yellow-500/10"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    color: colors.textSecondary,
                  }}
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg text-sm ${msg.role === 'user' ? 'ml-8' : 'mr-4'}`}
            style={{
              backgroundColor:
                msg.role === 'user'
                  ? isDark
                    ? 'rgba(255, 230, 0, 0.2)'
                    : 'rgba(255, 230, 0, 0.3)'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.05)',
              color: colors.textPrimary,
            }}
          >
            <div className="whitespace-pre-wrap">
              {msg.content || (msg.role === 'assistant' ? 'Sorry, I could not generate a response.' : '')}
            </div>
          </div>
        ))}

        {chatLoading && (
          <div
            className="p-3 rounded-lg text-sm animate-pulse mr-4"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              color: colors.textMuted,
            }}
          >
            Thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t flex gap-2"
        style={{ borderColor: colors.cardBorder }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your roadmap..."
          className="flex-1 px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            color: colors.textPrimary,
            border: `1px solid ${colors.cardBorder}`,
          }}
        />
        <button
          type="submit"
          disabled={chatLoading || !input.trim()}
          className="px-4 py-2 rounded-lg font-medium active:scale-95 transition-all"
          style={{
            backgroundColor: colors.accent,
            color: '#2e2e38',
            opacity: chatLoading || !input.trim() ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
