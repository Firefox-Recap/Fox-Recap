import React, { useState, useEffect, useRef } from "react";
import { getData } from "./slideShowData";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { HistofySDK } from "../sdk/sdk.js";
import AnalyticsChartSlide from "./AnalyticsChartSlide.jsx";
import "./popup.css";

const SlideShow = ({ setView, timeRange, topDomains }) => {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [visitDurations, setVisitDurations] = useState([]);
  const [categoryDurations, setCategoryDurations] = useState([]);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [visits, categories] = await Promise.all([
          HistofySDK.getVisitDurations(),
          HistofySDK.getCategoryDurations(),
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

  const handlePrevious = () => setIndex((prev) => prev - 1);
  const handleNext = () => setIndex((prev) => prev + 1);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [index]);

  useEffect(() => {
    // If current slide is the chart slide, do NOT auto-advance (so you can see it).
    if (slides[index]?.metric_type === "peakHours") return;

    const timer = setTimeout(() => {
      if (index < slides.length - 1) {
        setIndex(index + 1);
      }
    }, 2000); // 2 seconds for other slides
    return () => clearTimeout(timer);
  }, [index, slides]);

  if (loading) {
    return (
      <div style={{ color: "white", padding: "2rem" }}>
        <h2>Loading metrics and slides...</h2>
      </div>
    );
  }

  const currentSlide = slides[index];
  console.log("🔎 Current slide ID:", currentSlide?.id);
  console.log("🔎 Current slide metric_type:", currentSlide?.metric_type);

  // Chart-only slide
  if (currentSlide?.metric_type === "peakHours") {
    console.log("🔥 Reached peakHours slide => chartData:", currentSlide.chartData);

    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            inset: 0,
          }}
        >
          {slides.length > 0 && (
            <source src={currentSlide.video} type="video/mp4" />
          )}
        </video>

        {/* Center the chart */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnalyticsChartSlide
            data={
              currentSlide.chartData?.length
                ? currentSlide.chartData
                : visitDurations
            }
          />
        </div>

        {/* Close Button */}
        <button
          onClick={() => setView("home")}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            fontSize: "40px",
            border: "none",
            background: "transparent",
            color: "#fff",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          x
        </button>

        {/* Next & Prev Arrows */}
        <button
          style={{
            position: "absolute",
            right: "10px",
            top: "45%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            zIndex: 10,
          }}
          onClick={handleNext}
          disabled={index >= slides.length - 1}
        >
          <FaArrowRight size={32} color="#fff" />
        </button>

        <button
          style={{
            position: "absolute",
            left: "10px",
            top: "45%",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            zIndex: 10,
          }}
          onClick={handlePrevious}
          disabled={index === 0}
        >
          <FaArrowLeft size={32} color="#fff" />
        </button>
      </div>
    );
  }

  // Normal slides
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          position: "absolute",
          inset: 0,
        }}
      >
        {slides.length > 0 && (
          <source src={currentSlide.video} type="video/mp4" />
        )}
      </video>

      <button
        onClick={() => setView("home")}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          fontSize: "40px",
          border: "none",
          background: "transparent",
          color: "#fff",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        x
      </button>

      <h1
        style={{
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
        }}
      >
        {currentSlide.prompt}
      </h1>

      {/* Arrows */}
      <button
        style={{
          position: "absolute",
          right: "10px",
          top: "45%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          zIndex: 10,
        }}
        onClick={handleNext}
        disabled={index >= slides.length - 1}
      >
        <FaArrowRight size={32} color="#fff" />
      </button>

      <button
        style={{
          position: "absolute",
          left: "10px",
          top: "45%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          zIndex: 10,
        }}
        onClick={handlePrevious}
        disabled={index === 0}
      >
        <FaArrowLeft size={32} color="#fff" />
      </button>

      {/* Debug Info */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          color: "white",
          fontSize: "12px",
          background: "rgba(0,0,0,0.5)",
          padding: "10px",
          borderRadius: "8px",
          zIndex: 10,
        }}
      >
        <div>
          <strong>Visits:</strong> {visitDurations.length}
        </div>
        <div>
          <strong>Categories:</strong> {categoryDurations.length}
        </div>
      </div>
    </div>
  );
};

export default SlideShow;
