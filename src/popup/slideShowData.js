import promptsData from "./prompts.json";
import {
  getHistory,
  getTopVisitedDomains,
  getTopCategories
} from "../sdk/firefoxrecapSDK";

const backgroundVideos = [
  "/assets/videos/2.mp4",
  "/assets/videos/3.mp4",
  "/assets/videos/4.mp4",
  "/assets/videos/5.mp4",
  "/assets/videos/6.mp4",
  "/assets/videos/7.mp4",
  "/assets/videos/8.mp4",
  "/assets/videos/9.mp4",
  "/assets/videos/10.mp4",
];

const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

const shuffledVideos = shuffle([...backgroundVideos]);

const timeRangeMap = {
  day: "today",
  week: "this week",
  month: "this month",
};

const getRandomPrompt = (timeRange, type) => {
  const prompts = promptsData.prompts[type] || [];
  if (!prompts.length) return "";
  const index = Math.floor(Math.random() * prompts.length);
  return prompts[index].text.replace("[x]", timeRangeMap[timeRange]);
};

export const getData = async (timeRange) => {
  // 1) fetch raw history + stats
  const { data: history, stats: historyStats } = await getHistory(timeRange);

  // 2) fetch top‑visited domains
  const topDomains = await getTopVisitedDomains(timeRange);

  // 3) fetch top categories
  const topCategoriesData = await getTopCategories(timeRange);
  console.log("Top categories data", topCategoriesData);
  console.log(historyStats)
  const metrics = {
    // count unique URLs in this slice
    totalWebsites: new Set(history.map(h => h.url)).size,
    totalDurationMs: (historyStats.totalTime || 0) * 1000,
    topCategories: topCategoriesData.map(c => c.category)
  };

  // convenience prompt builder still works
  const getTopVisitedPrompt = (td) => {
    if (td.length < 3) return "Top sites data is not available.";
    const tpl = promptsData.prompts.top3Websites[0].text;
    return tpl
      .replace("[Website 1]", td[0].url || td[0].domain)
      .replace("[Website 2]", td[1].url || td[1].domain)
      .replace("[Website 3]", td[2].url || td[2].domain);
  };

  return [
    {
      id: "slide1",
      video: shuffledVideos[0],
      prompt: getRandomPrompt(timeRange, "introRecap"),
      metric: false,
      metric_type: null,
    },
    {
      id: "slide2",
      video: shuffledVideos[1],
      prompt: getRandomPrompt(timeRange, "introToTotalWebsites"),
      metric: false,
      metric_type: null,
    },
    {
      id: "slide3",
      video: shuffledVideos[2],
      prompt: `You've visited ${metrics.totalWebsites} unique websites ${timeRangeMap[timeRange]}—explorer of the digital universe! 🌌🚀`,
      metric: true,
      metric_type: "totalWebsites",
    },
    {
      id: "slide4",
      video: shuffledVideos[3],
      prompt: `You spent ${(metrics.totalDurationMs / 60000).toFixed(1)} minutes online ${timeRangeMap[timeRange]}. Need a break? 😅`,
      metric: true,
      metric_type: "totalDuration",
    },
    {
      id: "slide5",
      video: shuffledVideos[4],
      prompt: getTopVisitedPrompt(topDomains),
      metric: false,
      metric_type: "topDomains",
    },
    {
      id: "slide6",
      video: shuffledVideos[5],
      prompt: `Your top categories were: ${metrics.topCategories.join(", ")}`,
      metric: true,
      metric_type: "topCategories",
    },
    {
      id: "slide7",
      video: shuffledVideos[6],
      prompt: "",
      metric: true,
      metric_type: "topCategoriesChart",
      chartData: topCategoriesData.map(c => ({ category: c.category, duration: c.count }))
    },
    {
      id: "slide8",
      video: shuffledVideos[7],
      prompt: "Here's when you're most active online by the hour ⏰",
      metric: false,
      metric_type: "peakIntro",
    },
    {
      id: "slide9",
      video: shuffledVideos[8],
      prompt: "",
      metric: true,
      metric_type: "peakHours",
      chartData: [],
    },
    {
      id: "slide10",
      video: shuffledVideos[0],
      prompt: "Here’s when you browse the most, day by day... 📅",
      metric: false,
      metric_type: "peakDaysIntro",
    },
    {
      id: "slide11",
      video: shuffledVideos[1],
      prompt: "",
      metric: true,
      metric_type: "peakDaysChart",
      chartData: [],
    },
    {
      id: "slide12",
      video: shuffledVideos[2],
      prompt: "Let’s rewind your journey. Here are your key moments 🎞️",
      metric: false,
      metric_type: "journeyIntro",
    },
    {
      id: "slide13",
      video: shuffledVideos[3],
      prompt: "",
      metric: true,
      metric_type: "journeyTimeline",
      chartData: [],
    }
  ];
};
