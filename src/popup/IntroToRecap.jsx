import React, { useEffect, useState } from 'react';

const IntroToRecap = ({ period, setView }) => {
  const [prompt, setPrompt] = useState('');

  const prompts = [
    "Here’s a recap of your browser activity this {period}.",
    "Let's check out what was browsed this {period}.",
    "Here’s what your browsing looked like this {period}.",
    "Let's dive into the digital depths of your browser activity this {period}.",
    "Ready to rewind? Here's a glance back at your browsing from this {period}.",
    "Peek into your past pages—here's your browser history for this {period}."
  ];

  useEffect(() => {
    // Update the prompt on period change
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    const periodText = {
      day: 'today',
      week: 'this week',
      month: 'this month'
    };

    // Replace the placeholder with the correct period text
    const formattedPrompt = randomPrompt.replace('{period}', periodText[period]);

    setPrompt(formattedPrompt);
  }, [period]);

  return (
    <div>
      <h2>{prompt}</h2>
      <button onClick={() => setView("topFive")}>Top 5 Websites</button>
    </div>
  );
};

export default IntroToRecap;
