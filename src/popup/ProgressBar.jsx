import React from 'react';
import './popup.css';

export default function ProgressBar({ currentIndex, slideCount, durationMs = 5000 }) {
  return (
    <div className="story-progress">
      {Array.from({ length: slideCount }).map((_, idx) => {
        const isActive = idx === currentIndex;
        const isDone   = idx < currentIndex;
        return (
          <div key={idx} className="story-progress__segment">
            <div
              className={[
                'story-progress__fill',
                isActive  ? 'active'    : '',
                isDone    ? 'completed' : ''
              ].join(' ')}
              style={isActive ? { animationDuration: `${durationMs}ms` } : {}}
            />
          </div>
        );
      })}
    </div>
  );
}
