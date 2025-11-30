import React, { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 15, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const index = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    index.current = 0;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const typeChar = () => {
      if (index.current < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index.current));
        index.current++;
        timeoutRef.current = window.setTimeout(typeChar, speed);
      } else {
        if (onComplete) onComplete();
      }
    };

    typeChar();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed, onComplete]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
};

export default Typewriter;