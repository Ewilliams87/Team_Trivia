// pages/ChristmasTrivia.js

import React from 'react';
import TriviaGame from '../components/Triviagame';


const fetchChristmasQuestions = async () => {
  // These could come from an API, file, or database in a real app
  return [
    {
      question: "What is traditionally placed on top of a Christmas tree?",
      options: ["Star", "Candy Cane", "Bell", "Snowflake"],
      answer: "Star",
    },
    {
      question: "Which country started the tradition of putting up a Christmas tree?",
      options: ["Germany", "USA", "France", "Canada"],
      answer: "Germany",
    },
    {
      question: "In the song 'The Twelve Days of Christmas', what did my true love give me on the 5th day?",
      options: ["Five golden rings", "Five candy canes", "Five elves", "Five gingerbreads"],
      answer: "Five golden rings",
    },
    {
      question: "Who tries to stop Christmas from coming, by stealing all the presents?",
      options: ["The Grinch", "Scrooge", "Jack Frost", "Rudolph"],
      answer: "The Grinch",
    },
    {
      question: "What beverage is also known as 'milk punch' and is popular around Christmas?",
      options: ["Eggnog", "Hot chocolate", "Mulled wine", "Apple cider"],
      answer: "Eggnog",
    },
    {
      question: "What is the name of the red-nosed reindeer?",
      options: ["Rudolph", "Dasher", "Blitzen", "Comet"],
      answer: "Rudolph",
    },
    {
      question: "What color suit did Santa wear before Coca-Cola made him red?",
      options: ["Green", "Blue", "Purple", "White"],
      answer: "Green",
    },
    {
      question: "In 'Home Alone', where are the McCallisters going on vacation when they leave Kevin behind?",
      options: ["Paris", "London", "Rome", "New York"],
      answer: "Paris",
    },
    {
      question: "Which plant is associated with Christmas and known for its red and green leaves?",
      options: ["Poinsettia", "Mistletoe", "Holly", "Fern"],
      answer: "Poinsettia",
    },
    {
      question: "What date is Christmas celebrated?",
      options: ["December 25", "December 24", "January 1", "November 25"],
      answer: "December 25",
    },
  ];
};

const ChristmasTrivia = () => {
  return <TriviaGame fetchQuestions={fetchChristmasQuestions} categoryName="Christmas" />;
};

export default ChristmasTrivia;
