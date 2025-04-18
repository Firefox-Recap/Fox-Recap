import React, { useState, useEffect, useRef } from "react";
import { getData } from "./slideShowData";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import AnalyticsChartSlide from "./AnalyticsChartSlide.jsx";
import TopCategoriesChartSlide from "./TopCategoriesChartSlide.jsx";
import PeakDaysRings from "./PeakDaysRings.jsx";
import JourneyTimelineSlide from "./JourneyTimelineSlide.jsx";
import "./popup.css";

const SlideShow = ({ setView, timeRange, topDomains }) => {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const visits = [];
        const categories = [];
        const data = await getData(timeRange, topDomains, visits, categories);
        setSlides(data);
      } catch (err) {
        console.error("❌ Failed to load slides:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange, topDomains]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.load();
  }, [index]);

  useEffect(() => {
    const type = slides[index]?.metric_type;
    if (["peakHours", "topCategoriesChart", "peakDaysChart", "journeyTimeline"].includes(type)) return;
    const timer = setTimeout(() => {
      if (index < slides.length - 1) setIndex(index + 1);
    }, 5000);
    return () => clearTimeout(timer);
  }, [index, slides]);

  const handlePrevious = () => setIndex((prev) => prev - 1);
  const handleNext = () => setIndex((prev) => prev + 1);

  if (loading) {
    return <div style={{ color: "white", padding: "2rem" }}><h2>Loading slides...</h2></div>;
  }

  const currentSlide = slides[index];

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
      >
        {slides.length > 0 && <source src={currentSlide.video} type="video/mp4" />}
      </video>

      {currentSlide.prompt && (
        <h1 style={{
          color: "#fff",
          textAlign: "center",
          width: "80%",
          position: "absolute",
          top: "40%",
          left: "10%",
          fontSize: "1.8rem",
          lineHeight: "1.4",
          fontWeight: 700,
          zIndex: 9,
          textShadow: "0 0 10px rgba(0,0,0,0.5)"
        }}>{currentSlide.prompt}</h1>
      )}

      <button onClick={() => setView("home")} style={{ position: "absolute", top: "10px", right: "10px", fontSize: "40px", background: "transparent", color: "#fff", border: "none", cursor: "pointer", zIndex: 10 }}>x</button>

      <button onClick={handleNext} disabled={index >= slides.length - 1} style={{ position: "absolute", right: "10px", top: "45%", background: "transparent", border: "none", cursor: "pointer", zIndex: 10 }}>
        <FaArrowRight size={32} color="#fff" />
      </button>

      <button onClick={handlePrevious} disabled={index === 0} style={{ position: "absolute", left: "10px", top: "45%", background: "transparent", border: "none", cursor: "pointer", zIndex: 10 }}>
        <FaArrowLeft size={32} color="#fff" />
      </button>
    </div>
  );
};

export default SlideShow;