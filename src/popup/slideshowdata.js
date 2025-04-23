import promptsData from './prompts.json';

const timeRangeMap = {
  day: 'today',
  week: 'this week',
  month: 'this month'
};

const getRandomPrompt = (timeRange, type) => {
  const prompts = promptsData.prompts[type] || [];
  if (!prompts.length) return "";
  const index = Math.floor(Math.random() * prompts.length);
  return prompts[index].text.replace("[x]", timeRangeMap[timeRange]);
};

export const getTopVisitedPrompt = (topDomains) => {
  if (!topDomains || topDomains.length < 3) {
    return "Top sites data is not available.";
  }
  const topWebsitePrompts = promptsData.prompts.top3Websites;
  const randomIndex = Math.floor(Math.random() * topWebsitePrompts.length);
  let prompt = topWebsitePrompts[randomIndex].text;
  prompt = prompt.replace('[Website 1]', topDomains[0].domain);
  prompt = prompt.replace('[Website 2]', topDomains[1].domain);
  prompt = prompt.replace('[Website 3]', topDomains[2].domain);
  return prompt;
};

const backgroundVideos = [
  '/assets/videos/2.mp4',
  '/assets/videos/3.mp4',
  '/assets/videos/4.mp4',
  '/assets/videos/5.mp4',
  '/assets/videos/6.mp4',
  '/assets/videos/7.mp4',
  '/assets/videos/8.mp4',
  '/assets/videos/9.mp4',
  '/assets/videos/10.mp4',
];

// Fisher-Yates shuffle algorithm to randomize the backgroundImages array
const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }
  return array;
};

// Shuffle the background images (make a copy to avoid mutating the original array)
const shuffledVideos = shuffle([...backgroundVideos]);

export const getData = (timeRange, topDomains) => [
  {
    id: 'slide1',
    video: shuffledVideos[0],
    prompt: getRandomPrompt(timeRange, "introRecap"),
    metric: false,
    metric_type: null
  },
  {
    id: 'slide2',
    video: shuffledVideos[1],
    prompt: getRandomPrompt(timeRange, "introToTotalWebsites"),
    metric: false,
    metric_type: null
  },
  {
    id: 'slide3',
    video: shuffledVideos[2],
    prompt: getTopVisitedPrompt(topDomains),
    metric: true,
    metric_type: null
  },
  {
    id: 'slide4',
    video: shuffledVideos[3],
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  },
  {
    id: 'slide5',
    video: shuffledVideos[4],
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  },
  {
    id: 'slide6',
    video: shuffledVideos[5],
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  },
  {
    id: 'slide7',
    video: shuffledVideos[6],
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  },
  {
    id: 'slide8',
    video: shuffledVideos[7],
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  },
  {
    id: 'slide9',
    video: shuffledVideos[8],
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  }
];