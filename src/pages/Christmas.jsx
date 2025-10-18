// pages/ChristmasTrivia.js

import React from 'react';
import TriviaGame from '../components/Triviagame';
import { BACKEND_URL } from '../config';


const shuffleOptions = (question) => {
  const options = [...question.options];
  const correctAnswer = question.answer;

  // Fisher-Yates Shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    ...question,
    options,
    answer: correctAnswer, // answer stays as a string and will match the shuffled options
  };
};


const fetchChristmasQuestions = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/questions`);
    if (!response.ok) throw new Error('Failed to fetch questions');
    const rawQuestions = await response.json();

    const questions = rawQuestions.map((q) => ({
      question: q.Question,
      options: [q.Option1, q.Option2, q.Option3, q.Option4],
      answer: q.Answer,
    }));

    return questions.map(shuffleOptions);
  } catch (err) {
    console.error('Error fetching questions:', err);
    return [];
  }
};

const ChristmasTrivia = () => {
  return <TriviaGame fetchQuestions={fetchChristmasQuestions} categoryName="Christmas" />;
};

export default ChristmasTrivia;
