import React, { useState, useEffect, useRef } from 'react';
import { getData } from './slideShowData';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { HistofySDK } from '../sdk/sdk.js'; // ✅ Import SDK
import './popup.css';

const SlideShow = ({ setView, timeRange, topDomains }) => {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ Metrics state
  const [visitDurations, setVisitDurations] = useState([]);
  const [categoryDurations, setCategoryDurations] = useState([]);

  const videoRef = useRef(null);

  // ✅ Fetch metrics and slides
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [visits, categories] = await Promise.all([
          HistofySDK.getVisitDurations(),
          HistofySDK.getCategoryDurations()
        ]);
        setVisitDurations(visits);
        setCategoryDurations(categories);

        const data = await getData(timeRange, topDomains, visits, categories);
        setSlides(data);
      } catch (err) {
        console.error("❌ Failed to load metrics or slides:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, topDomains]);

  const handlePrevious = () => setIndex(index - 1);
  const handleNext = () => setIndex(index + 1);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [index]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (index < slides.length - 1) {
        setIndex(index + 1);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [index, slides.length]);

  if (loading) {
    return (
      <div className="container" style={{ color: 'white', padding: '2rem' }}>
        <h2>Loading metrics and slides...</h2>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => console.error("Error loading video:", e)}
      >
        {slides.length > 0 && <source src={slides[index].video} type="video/mp4" />}
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

      <h1
        style={{
          color: "#fff",
          textAlign: "center",
          width: "80%",
          position: 'absolute',
          top: '40%',
          left: '77px'
        }}
      >
        {slides.length > 0 && slides[index].prompt}
      </h1>

      <button
        style={{
          position: 'absolute',
          right: '10px',
          top: '45%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
        onClick={handleNext}
        disabled={index >= slides.length - 1}
      >
        <FaArrowRight size={32} color="#fff" />
      </button>

      <button
        style={{
          position: 'absolute',
          left: '10px',
          top: '45%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer'
        }}
        onClick={handlePrevious}
        disabled={index === 0}
      >
        <FaArrowLeft size={32} color="#fff" />
      </button>

      {/* ✅ DEBUG PANEL (can be removed later) */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        color: 'white',
        fontSize: '12px',
        background: 'rgba(0,0,0,0.5)',
        padding: '10px',
        borderRadius: '8px'
      }}>
        <div><strong>Visits:</strong> {visitDurations.length}</div>
        <div><strong>Categories:</strong> {categoryDurations.length}</div>
      </div>
    </div>
  );
};

export default SlideShow;
