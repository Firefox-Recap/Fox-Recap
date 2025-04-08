import React, { useState, useEffect, useRef } from "react";
import { getData } from "./slideShowData";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { HistofySDK } from "../sdk/sdk.js";
import AnalyticsChartSlide from "./AnalyticsChartSlide.jsx";
import TopCategoriesChartSlide from "./TopCategoriesChartSlide.jsx"; // ✅ Add this import
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
    const type = slides[index]?.metric_type;
    if (type === "peakHours" || type === "topCategoriesChart") return;

    const timer = setTimeout(() => {
      if (index < slides.length - 1) setIndex(index + 1);
    }, 2000);
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

  // 🔥 Special Chart Slide: Peak Hours
  if (currentSlide?.metric_type === "peakHours") {
    return renderChartSlide(
      currentSlide,
      <AnalyticsChartSlide
        data={
          currentSlide.chartData?.length
            ? currentSlide.chartData
            : visitDurations
        }
      />
    );
  }

  // 🔥 Special Chart Slide: Top Categories
  if (currentSlide?.metric_type === "topCategoriesChart") {
    return renderChartSlide(
      currentSlide,
      <TopCategoriesChartSlide
        data={
          currentSlide.chartData?.length
            ? currentSlide.chartData
            : categoryDurations
        }
      />
    );
  }

  // 🧠 Default Slide (Prompt only)
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

  // 🧠 Utility for rendering fullscreen chart slides
  function renderChartSlide(slide, ChartComponent) {
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
          {slides.length > 0 && <source src={slide.video} type="video/mp4" />}
        </video>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {ChartComponent}
        </div>

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
};

export default SlideShow;
