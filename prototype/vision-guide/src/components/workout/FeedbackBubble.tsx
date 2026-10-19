import React from 'react';

interface FeedbackBubbleProps {
  message: string | null;
}

export const FeedbackBubble: React.FC<FeedbackBubbleProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="feedback-bubble">
      <div className="feedback-icon">&#128172;</div>
      <div className="feedback-text">{message}</div>
    </div>
  );
};
