// src/popup/SlideShow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getData } from './slideShowData';
import './popup.css';

const SlideShow = ({ setView, timeRange }) => {
    const data = getData(timeRange);  
    const [index, setIndex] = useState(0);
    const previousDisable = index === 0;
    const nextDisable = index >= data.length - 1;
    const videoRef = useRef(null);

    const handlePrevious = () => {
        setIndex(index - 1);
    }

    const handleNext = () => {
        setIndex(index + 1);
    }

    useEffect(() => {
      if (videoRef.current) {
          videoRef.current.load();
      }
  }, [index]);

    useEffect(() => {
        const timer = setInterval(() => {
          setIndex(prevIndex => {
            if (prevIndex < data.length - 1) {
              return prevIndex + 1;
            }
            return prevIndex;
          });
        }, 5000);
    
        return () => clearInterval(timer);
      }, [index], data.length);

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <video   ref={videoRef} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}
             onError={(e) => console.error("Error loading video:", e)}
      >
          <source src={data[index].video} type="video/mp4" />
      </video>
          <button
              onClick={(e) => {
                  e.stopPropagation();
                  setView('home');
              }}
              style={{
                  position: 'absolute',
                  top: "10px",
                  right: '10px',
                  fontSize: '40px',
                  border: 'none',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer'
              }}
          >
          x
          </button>
  
          <h1 style={{ color: "#fff", textAlign: "center", width: "100%", position: 'absolute', top: '50%' }}>
          {data[index] && data[index].prompt}
          </h1>
  
        <button 
          style={{position: 'absolute', right: '10px', top: '300px'}} 
          onClick={handleNext}
          disabled={nextDisable}
        >
          NEXT
        </button>
        <button 
          style={{position: 'absolute', left: '10px', top: '300px'}} 
          onClick={handlePrevious}
          disabled={previousDisable}
        >
          BACK
        </button>
      </div>
    );
  };
  
  export default SlideShow;
  