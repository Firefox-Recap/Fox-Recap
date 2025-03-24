// src/popup/slideShowData.js
import promptsData from './prompts.json';

const getRandomIntroPrompt = () => {
  const introPrompts = promptsData.prompts.introRecap;
  const randomIndex = Math.floor(Math.random() * introPrompts.length);
  return introPrompts[randomIndex].text;
};

export const data = [
  {
    id: 'slide1',
    img: '/assets/images/11.png', 
    prompt: getRandomIntroPrompt(),  // Randomly selected prompt from introRecap
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
    img: '/assets/images/14.png', 
    prompt: "That looks like some cool websites",
    metric: false,
    metric_type: null
  }
];
