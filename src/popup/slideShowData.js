
import promptsData from './prompts.json';

// Helper to get a random intro prompt from your prompts JSON
const getRandomIntroPrompt = (timeRange) => {
  console.log(timeRange);
  const introPrompts = promptsData.prompts.introRecap;
  const randomIndex = Math.floor(Math.random() * introPrompts.length);
  let prompt = introPrompts[randomIndex].text;
  return prompt.replace('[x]', timeRangeMap[timeRange] || 'this period');
};

const timeRangeMap = {
  day: 'today',
  week: 'this week',
  month: 'this month'
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
  '/assets/videos/11.mp4',

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

export const getData = (timeRange) => [
  {
    id: 'slide1',
    video: shuffledVideos[0],
    prompt: getRandomIntroPrompt(timeRange), // Randomly selected prompt from introRecap
    metric: false,
    metric_type: null
  },
  {
    id: 'slide2',
    video: shuffledVideos[1],
    prompt: 'Lets take a look of how many websites youve visited',
    metric: false,
    metric_type: null
  },
  {
    id: 'slide3',
    video: shuffledVideos[2],
    prompt: null,
    metric: true,
    metric_type: 'total_websites_visited'
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
