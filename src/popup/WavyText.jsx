import React from 'react';
import './popup.css';


const WavyText = ({ text }) => {
    return (
      <div className="wavy-text">
        {text.split(/(\s+)/).map((segment, index) => {
          if (segment.trim() === '') {
            // Render spaces without animation
            return <span key={index}>{segment}</span>;
          } else {
            // Render each character in the word with animation
            return (
              <span key={index}>
                {segment.split('').map((char, charIndex) => (
                  <span
                    key={charIndex}
                    className="wavy-char"
                    style={{ '--i': charIndex }}
                  >
                    {char}
                  </span>
                ))}
              </span>
            );
          }
        })}
      </div>
    );
  };
  
  export default WavyText;