// src/popup/SlideShow.jsx
import React, { useState } from 'react';
import { getData } from './slideShowData';
import './popup.css';

const SlideShow = ({ setView, timeRange, historyData }) => {
    const slides = getData(timeRange, historyData);
    const [index, setIndex] = useState(0);
    const previousDisable = index === 0;
    const nextDisable = index >= slides.length - 1;

    const handlePrevious = () => {
        setIndex(index - 1);
    }

    const handleNext = () => {
        setIndex(index + 1);
    }

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
      }, [index]);

    return (
      <div
          style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${slides[index].img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'background-image 0.5s ease-in-out'
          }}
      >
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
  
          <h1 style={{ color: "#fff", textAlign: "center", width: "100%", marginTop: "300px" }}>
              {slides[index].prompt}
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
  