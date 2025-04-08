import promptsData from "./prompts.json";
import { HistofySDK } from "../sdk/sdk.js";

const timeRangeMap = {
  day: "today",
  week: "this week",
  month: "this month",
};

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
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

const shuffledVideos = shuffle([...backgroundVideos]);

function getCutoffTimestamp(timeRange) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (timeRange === "day") {
    return now.getTime();
  } else if (timeRange === "week") {
    now.setDate(now.getDate() - 7);
    return now.getTime();
  } else if (timeRange === "month") {
    now.setDate(now.getDate() - 30);
    return now.getTime();
  }

  return 0;
}

export const getSlideMetrics = async (timeRange, visits, durations, categoryStats) => {
  try {
    const cutoff = getCutoffTimestamp(timeRange);

    const recentVisits = visits.filter((v) => v?.timestamp >= cutoff);
    const recentDurations = durations.filter((d) => d?.timestamp >= cutoff);

    const totalWebsites = new Set(
      recentVisits.map((v) => v.domain).filter(Boolean)
    ).size;

    const topCategories = categoryStats
      .filter((cat) => cat?.duration >= 0 && cat.category)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3)
      .map((cat) => cat.category);

    const totalMs = recentDurations.reduce((acc, cur) => acc + cur.duration, 0);

    if (timeRange === "day" && totalWebsites === 0 && totalMs === 0) {
      console.warn("⚠️ No data for 'day'. Retrying with 'week'...");
      return await getSlideMetrics("week", visits, durations, categoryStats);
    }

    return {
      totalWebsites,
      totalDurationMs: totalMs,
      topCategories,
    };
  } catch (err) {
    console.error("❌ Failed to compute slide metrics:", err);
    return {
      totalWebsites: 0,
      totalDurationMs: 0,
      topCategories: [],
    };
  }
};

const getRandomPrompt = (timeRange, promptType) => {
  const prompts = promptsData.prompts[promptType];
  const randomIndex = Math.floor(Math.random() * prompts.length);
  let prompt = prompts[randomIndex].text;
  return prompt.replace("[x]", timeRangeMap[timeRange] || "this period");
};

export const getTopVisitedPrompt = (topDomains) => {
  if (!topDomains || topDomains.length < 3) {
    return "Top sites data is not available.";
  }
  const topWebsitePrompts = promptsData.prompts.top3Websites;
  const randomIndex = Math.floor(Math.random() * topWebsitePrompts.length);
  let prompt = topWebsitePrompts[randomIndex].text;
  prompt = prompt.replace("[Website 1]", topDomains[0].domain);
  prompt = prompt.replace("[Website 2]", topDomains[1].domain);
  prompt = prompt.replace("[Website 3]", topDomains[2].domain);
  return prompt;
};

export const getData = async (timeRange, topDomains, visits, categories) => {
  const durations = await HistofySDK.getVisitDurations();
  const metrics = await getSlideMetrics(timeRange, visits, durations, categories);

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
      prompt: `You spent ${(metrics.totalDurationMs / 60000).toFixed(1)} minutes online ${
        timeRangeMap[timeRange]
      }. Need a break? 😅`,
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
      prompt: "That looks like some cool websites",
      metric: false,
      metric_type: null
    },
    {
      id: "slide8",
      video: shuffledVideos[7],
      prompt: "That looks like some cool websites",
      metric: false,
      metric_type: null
    },
    {
      id: "slide9",
      video: shuffledVideos[8],
      prompt: "", // Chart-only slide for peak hours
      metric: true,
      metric_type: "peakHours",
      chartData: peakHours,
    },
    {
      id: "slide10",
      video: shuffledVideos[0],
      prompt: "That looks like some cool websites",
      metric: false,
      metric_type: null,
    },
  ];
};
