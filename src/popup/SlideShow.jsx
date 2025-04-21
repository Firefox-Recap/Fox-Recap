import React, { useState, useEffect, useRef } from 'react';
import promptsData from './prompts.json';
import './popup.css';

const SlideShow = ({ setView, timeRange, topDomains }) => {
    const [slides, setSlides] = useState([]);
    const [index, setIndex] = useState(0);
    const videoRef = useRef(null);

    useEffect(() => {
        // Call getData when the component mounts and whenever topDomains or timeRange changes
        setSlides(getData(timeRange, topDomains));
    }, [timeRange, topDomains]); // Depend on timeRange and topDomains

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
            setIndex(prevIndex => (prevIndex < slides.length - 1 ? prevIndex + 1 : prevIndex));
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]); // Depend on slides.length to adjust auto-advance

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            <video ref={videoRef} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => console.error("Error loading video:", e)}>
                {slides.length > 0 && <source src={slides[index].video} type="video/mp4" />}
            </video>
            <button onClick={(e) => {
                e.stopPropagation();
                setView('home');
            }} style={{
                position: 'absolute',
                top: "10px",
                right: '10px',
                fontSize: '40px',
                border: 'none',
                background: 'transparent',
                color: '#fff',
                cursor: 'pointer'
            }}>
                x
            </button>
            <h1 style={{ color: "#fff", textAlign: "center", width: "100%", position: 'absolute', top: '50%' }}>
                {slides.length > 0 && slides[index].prompt}
            </h1>
            <button style={{ position: 'absolute', right: '10px', top: '300px' }}
                onClick={handleNext}
                disabled={index >= slides.length - 1}>
                NEXT
            </button>
            <button style={{ position: 'absolute', left: '10px', top: '300px' }}
                onClick={handlePrevious}
                disabled={index === 0}>
                BACK
            </button>
        </div>
    );
};

export default SlideShow;