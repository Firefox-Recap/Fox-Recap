// src/popup/slideShowData.js
import promptsData from './prompts.json';

const timeRangeMap = {
  day: 'this day',
  week: 'this week',
  month: 'this month'
};

export const getRandomIntroPrompt = (timeRange) => {
  const introPrompts = promptsData.prompts.introRecap;
  const randomIndex = Math.floor(Math.random() * introPrompts.length);
  let prompt = introPrompts[randomIndex].text;
  return prompt.replace('[x]', timeRangeMap[timeRange] || 'this period');
};

const formatTopSites = (historyData) => {
  const topFive = historyData.slice(0, 5);
  const listItems = topFive.map((item, index) => 
    `${index + 1}. ${item.domain} - ${item.visitCount} visits`
  ).join(''); // Join with nothing in between because each item is wrapped in <div>
  return `Top 5 Websites Visited:<br>${listItems}`;
};

export const getData = (timeRange, historyData) => [
  {
    id: 'slide1',
    img: '/assets/images/11.png', 
    prompt: getRandomIntroPrompt(timeRange),
    metric: false,
    metric_type: null
  },
  {
    id: 'slide2',
    img: '/assets/images/12.png', 
    prompt: 'Lets take a look of how many websites youve visited',
    metric: false,
    metric_type: null
  },
  {
    id: 'slide3',
    img: '/assets/images/13.png', 
    prompt: null,
    metric: true, 
    metric_type: 'total_websites_visited'
  },
  {
    id: 'slide4',
    img: '/assets/images/13.png', 
    prompt: formatTopSites(historyData),
    metric: true, 
    metric_type: 'top5'
  },
  {
    id: 'slide5',
    img: '/assets/images/14.png', 
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  }
];
