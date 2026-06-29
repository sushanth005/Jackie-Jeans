'use client';

import { useEffect, useRef } from 'react';
import styles from './TranscriptBubble.module.css';

export interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  isInterim?: boolean;
}

interface TranscriptBubbleProps {
  messages: Message[];
  currentTranscript?: string; // live interim speech
}

export default function TranscriptBubble({ messages, currentTranscript }: TranscriptBubbleProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript]);

  return (
    <div className={styles.container} aria-live="polite" aria-label="Conversation transcript">
      <div className={styles.messages}>
        {messages.slice(-4).map((msg, idx, arr) => {
          const isOld = idx < arr.length - 2;
          return (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.role === 'ai' ? styles.ai : styles.user}`}
              style={{ opacity: isOld ? 0.35 : 1, filter: isOld ? 'blur(0.5px)' : 'none', transition: 'all 0.4s' }}
            >
              {msg.role === 'ai' && (
                <div className={styles.aiAvatar} aria-hidden="true">J</div>
              )}
              <div className={styles.bubble}>
                <p className={styles.text}>{msg.text}</p>
              </div>
            </div>
          );
        })}

        {/* Live interim transcript */}
        {currentTranscript && (
          <div className={`${styles.message} ${styles.user}`}>
            <div className={`${styles.bubble} ${styles.interim}`}>
              <p className={styles.text}>{currentTranscript}</p>
              <span className={styles.listeningDots}>
                <span /><span /><span />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
