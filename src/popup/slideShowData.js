
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

const backgroundImages = [
  '/assets/images/1.png',
  '/assets/images/2.png',
  '/assets/images/3.png',
  '/assets/images/4.png',
  '/assets/images/5.png',
  '/assets/images/6.png',
  '/assets/images/7.png',
  '/assets/images/8.png',
  '/assets/images/9.png'
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
const shuffledImages = shuffle([...backgroundImages]);

export const getData = (timeRange, historyData) => [
  {
    id: 'slide1',
    img: shuffledImages[0],
    prompt: getRandomIntroPrompt(timeRange), // Randomly selected prompt from introRecap
    metric: false,
    metric_type: null
  },
  {
    id: 'slide2',
    img: shuffledImages[1],
    prompt: 'Lets take a look of how many websites youve visited',
    metric: false,
    metric_type: null
  },
  {
    id: 'slide3',
    img: shuffledImages[2],
    prompt: null,
    metric: true,
    metric_type: 'total_websites_visited'
  },
  {
    id: 'slide4',
    img: shuffledImages[3],
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  },
  {
    id: 'slide5',
    img: shuffledImages[4],
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  },
  {
    id: 'slide6',
    img: shuffledImages[5],
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  },
  {
    id: 'slide7',
    img: shuffledImages[6],
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  },
  {
    id: 'slide8',
    img: shuffledImages[7],
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  },
  {
    id: 'slide9',
    img: shuffledImages[8],
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  }
];
