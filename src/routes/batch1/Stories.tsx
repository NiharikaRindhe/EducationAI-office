import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Volume2, ChevronLeft, ChevronRight, Check, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Story {
  id: string;
  title: string;
  emoji: string;
  subject: string;
  readTime: string;
  completed: boolean;
  pages: string[];
  quiz: {
    q: string;
    options: string[];
    correct: string;
  }[];
}

export const Batch1Stories: React.FC = () => {
  const { incrementXP } = useApp();

  const [activeTab, setActiveTab] = useState<'All' | 'English' | 'Maths' | 'Science'>('All');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Quiz states
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [completedStories, setCompletedStories] = useState<string[]>([]);

  const storiesData: Story[] = [
    {
      id: 's1',
      title: 'The Wise Old Owl',
      emoji: '🦉',
      subject: 'English',
      readTime: '3 min',
      completed: false,
      pages: [
        "Once upon a time, there was an old owl who lived in a large oak tree. Every day, he watched people around him and listened to their conversations.",
        "He saw a boy helping an old man carry a heavy bag. He also saw a girl sharing her lunch with a friend who had lost hers.",
        "As the days went by, the owl spoke less and less. He only listened. By listening, he learned about how people helped each other and showed kindness.",
        "The owl became wiser every day. The animals in the forest came to him for advice, and he taught them that listening is the key to wisdom."
      ],
      quiz: [
        { q: 'Where did the wise owl live?', options: ['In a cave', 'In a large oak tree', 'On a mountain', 'In a nest'], correct: 'In a large oak tree' },
        { q: 'What did the owl do every day?', options: ['Slept all day', 'Watched and listened to people', 'Flew to the city', 'Sang songs'], correct: 'Watched and listened to people' },
        { q: 'What is the lesson of the story?', options: ['Speak loudly', 'Listening helps you learn', 'Fly fast', 'Help monkeys'], correct: 'Listening helps you learn' }
      ]
    },
    {
      id: 's2',
      title: 'Monkeys Count Bananas',
      emoji: '🍌',
      subject: 'Maths',
      readTime: '4 min',
      completed: false,
      pages: [
        "Three monkeys, Chintu, Pintu, and Mantu, went into the deep jungle to search for delicious food. Soon, they found a beautiful wild banana tree!",
        "Chintu plucked 4 yellow bananas. Pintu plucked 3 sweet bananas. Mantu plucked 5 ripe bananas. They stacked them all in a large wooden basket.",
        "They wanted to divide them equally. Let's count them first: 4 bananas + 3 bananas + 5 bananas = 12 bananas in total!",
        "Since they were 3 monkeys, they divided 12 bananas by 3. Each monkey got exactly 4 bananas! They sat down and happily ate their lunch."
      ],
      quiz: [
        { q: 'How many bananas did Chintu pluck?', options: ['3 bananas', '4 bananas', '5 bananas', '2 bananas'], correct: '4 bananas' },
        { q: 'What was the total number of bananas?', options: ['10 bananas', '12 bananas', '8 bananas', '15 bananas'], correct: '12 bananas' },
        { q: 'How many bananas did each monkey get?', options: ['4 bananas', '3 bananas', '6 bananas', '5 bananas'], correct: '4 bananas' }
      ]
    },
    {
      id: 's3',
      title: 'The Little Seed Grows',
      emoji: '🌱',
      subject: 'Science',
      readTime: '3 min',
      completed: false,
      pages: [
        "A tiny seed named Pip lay asleep under the warm, brown soil. Pip was very cozy and wanted to sleep forever.",
        "One day, the gentle rain tapped on the soil: pit-pat, pit-pat. Pip drank the cool water and began to stretch.",
        "Then, the bright sun warmed the soil. Pip pushed out a tiny green shoot and reached up, up, up towards the light!",
        "Soon, Pip grew leaves and became a beautiful green plant. Pip learned that seeds need soil, water, and sunlight to grow."
      ],
      quiz: [
        { q: 'What was the name of the tiny seed?', options: ['Pip', 'Pop', 'Pip-pat', 'Seedling'], correct: 'Pip' },
        { q: 'What tapped on the soil to wake Pip?', options: ['A bird', 'The gentle rain', 'A worm', 'A wind'], correct: 'The gentle rain' },
        { q: 'What three things do seeds need to grow?', options: ['Soil, rain, wind', 'Sunlight, water, soil', 'Soil, leaves, stones', 'Insects, sun, shade'], correct: 'Sunlight, water, soil' }
      ]
    },
    {
      id: 's4',
      title: 'The Lion and the Mouse',
      emoji: '🦁',
      subject: 'English',
      readTime: '4 min',
      completed: false,
      pages: [
        "A tiny mouse accidentally woke up a sleeping lion. The lion was angry and caught the mouse in his huge paw.",
        "The mouse cried, 'Please spare me! One day I might help you!' The lion laughed and let the little mouse go.",
        "A few weeks later, the lion was caught in a hunter's strong net. He roared loudly. The mouse heard him and ran to help.",
        "The mouse chewed through the thick ropes with his sharp teeth and set the lion free. The lion learned that even tiny friends can help."
      ],
      quiz: [
        { q: 'Who did the tiny mouse wake up?', options: ['A rabbit', 'A sleeping lion', 'A hunter', 'A monkey'], correct: 'A sleeping lion' },
        { q: 'How did the mouse help the lion?', options: ['By roaring', 'By chewing the net ropes', 'By calling elephant', 'By scratching hunter'], correct: 'By chewing the net ropes' },
        { q: 'What is the lesson of the story?', options: ['Lions are mean', 'Chew everything', 'Even tiny friends can help', 'Do not sleep'], correct: 'Even tiny friends can help' }
      ]
    }
  ];

  const filteredStories = storiesData.filter(s => activeTab === 'All' || s.subject === activeTab);

  const startReading = (story: Story) => {
    setSelectedStory(story);
    setCurrentPage(0);
    setIsQuizMode(false);
    setIsQuizFinished(false);
    setQuizScore(0);
    setSelectedAnswer(null);
    setCurrentQuizQuestion(0);
  };

  const handleAudioSimulate = () => {
    setIsPlayingAudio(true);
    // Simulate audio narration playing
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 4000);
  };

  const handleNextPage = () => {
    if (!selectedStory) return;
    if (currentPage < selectedStory.pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleAnswerClick = (option: string) => {
    if (selectedAnswer !== null || !selectedStory) return;
    setSelectedAnswer(option);
    
    const correctAns = selectedStory.quiz[currentQuizQuestion].correct;
    if (option === correctAns) {
      setQuizScore(prev => prev + 1);
    }
  };

  const advanceQuiz = () => {
    if (!selectedStory) return;
    setSelectedAnswer(null);
    if (currentQuizQuestion < selectedStory.quiz.length - 1) {
      setCurrentQuizQuestion(prev => prev + 1);
    } else {
      setIsQuizFinished(true);
      // Award XP
      incrementXP(50);
      // Mark story as completed
      if (selectedStory && !completedStories.includes(selectedStory.id)) {
        setCompletedStories(prev => [...prev, selectedStory.id]);
      }
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up">
      {/* If reading a story */}
      {selectedStory ? (
        <div className="bg-white border border-amber-100 rounded-3xl p-6 md:p-8 shadow-md">
          {/* Header row */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <button
              onClick={() => setSelectedStory(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back to Stories
            </button>
            <span className="badge pill-amber text-[10px] font-black">{selectedStory.subject}</span>
          </div>

          {!isQuizMode ? (
            /* STORY READING MODE */
            <div className="flex flex-col gap-8">
              {/* Illustrated emoji banner */}
              <div className="h-44 bg-gradient-to-tr from-amber-50 to-orange-50/50 rounded-2xl flex items-center justify-center text-7xl select-none anim-float">
                {selectedStory.emoji}
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center items-center gap-1.5">
                {selectedStory.pages.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      currentPage === idx ? 'bg-amber-500 scale-125' : 'bg-slate-200'
                    }`}
                  ></div>
                ))}
              </div>

              {/* Story Page content */}
              <div className="px-4 text-center max-w-2xl mx-auto">
                <h3 className="font-display font-extrabold text-2xl text-slate-800 mb-4">{selectedStory.title}</h3>
                <p className="font-sans text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                  {selectedStory.pages[currentPage]}
                </p>
              </div>

              {/* Audio & Navigation Controls */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                {/* Audio Narrator */}
                <button
                  onClick={handleAudioSimulate}
                  disabled={isPlayingAudio}
                  className={`flex items-center gap-1.5 py-2 px-4 rounded-xl border border-amber-200 font-sans font-bold text-xs cursor-pointer shadow-xs transition-all ${
                    isPlayingAudio ? 'bg-amber-500 text-white border-transparent animate-pulse' : 'bg-amber-50/50 text-amber-700 hover:bg-amber-100/50'
                  }`}
                >
                  <Volume2 size={16} />
                  {isPlayingAudio ? 'Playing Audio...' : 'Read Aloud'}
                </button>

                {/* Page turners */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-30 cursor-pointer transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span className="font-sans text-xs text-slate-400 font-semibold select-none">
                    Page {currentPage + 1} of {selectedStory.pages.length}
                  </span>

                  {currentPage < selectedStory.pages.length - 1 ? (
                    <button
                      onClick={handleNextPage}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsQuizMode(true)}
                      className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-sans font-bold text-xs shadow-md shadow-amber-500/10 cursor-pointer transition-all"
                    >
                      Take the Quiz!
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* STORY QUIZ MODE */
            <div className="flex flex-col gap-6 max-w-xl mx-auto">
              {!isQuizFinished ? (
                /* QUIZ FLOW */
                <div className="flex flex-col gap-6">
                  {/* Progress */}
                  <div>
                    <span className="font-sans text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      QUESTION {currentQuizQuestion + 1} OF 3
                    </span>
                    <div className="progress-bar mt-1 bg-slate-100">
                      <div 
                        className="progress-fill bg-amber-500" 
                        style={{ width: `${((currentQuizQuestion + 1) / 3) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Question */}
                  <h3 className="font-display font-extrabold text-xl text-slate-800 leading-snug">
                    {selectedStory.quiz[currentQuizQuestion].q}
                  </h3>

                  {/* Options */}
                  <div className="flex flex-col gap-2.5 mt-2">
                    {selectedStory.quiz[currentQuizQuestion].options.map((opt) => {
                      const correctAns = selectedStory.quiz[currentQuizQuestion].correct;
                      const isSelected = selectedAnswer === opt;
                      const isCorrect = opt === correctAns;
                      
                      let btnClass = 'border-slate-200 hover:bg-slate-50 text-slate-700';
                      if (selectedAnswer !== null) {
                        if (isCorrect) btnClass = 'bg-emerald-500 text-white border-transparent shadow-md shadow-emerald-500/10';
                        else if (isSelected) btnClass = 'bg-red-500 text-white border-transparent shadow-md shadow-red-500/10';
                        else btnClass = 'opacity-40 border-slate-100 text-slate-400';
                      }

                      return (
                        <button
                          key={opt}
                          onClick={() => handleAnswerClick(opt)}
                          disabled={selectedAnswer !== null}
                          className={`w-full text-left py-4 px-5 rounded-2xl border font-sans text-xs font-semibold cursor-pointer transition-all ${btnClass}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next question indicator */}
                  {selectedAnswer !== null && (
                    <button
                      onClick={advanceQuiz}
                      className="w-full py-3.5 mt-4 rounded-xl bg-slate-900 text-white font-sans font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {currentQuizQuestion < selectedStory.quiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              ) : (
                /* QUIZ SCORE SCREEN */
                <div className="text-center flex flex-col items-center gap-6 py-6 animate-fade-up">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-4xl select-none">
                    🏆
                  </div>
                  
                  <div>
                    <h3 className="font-display font-black text-2xl text-slate-800">
                      {quizScore === 3 ? 'Perfect Score!' : quizScore >= 2 ? 'Great effort!' : 'Keep practicing!'}
                    </h3>
                    <p className="font-sans text-xs text-slate-400 mt-1">
                      You collected {quizScore} stars in this quiz adventure.
                    </p>
                  </div>

                  {/* Stars Collection indicator */}
                  <div className="flex gap-2">
                    {[1, 2, 3].map((star) => (
                      <Star 
                        key={star}
                        size={32}
                        className={star <= quizScore ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}
                      />
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-100/50 p-4 rounded-2xl w-full flex justify-between items-center px-6 text-xs font-bold text-amber-800 select-none">
                    <span>XP REWARD</span>
                    <span>+50 XP Earned</span>
                  </div>

                  <button
                    onClick={() => setSelectedStory(null)}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs shadow-md shadow-indigo-600/15 cursor-pointer transition-all"
                  >
                    Back to Stories
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* STORIES LIST VIEW */
        <div className="flex flex-col gap-6">
          {/* Tabs header */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 select-none">
              {(['All', 'English', 'Maths', 'Science'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-5 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Stories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStories.map((story) => {
              const isDone = completedStories.includes(story.id);
              return (
                <div 
                  key={story.id}
                  onClick={() => startReading(story)}
                  className="bento-card border border-amber-100/50 bg-white flex flex-col justify-between gap-6 card-interactive cursor-pointer p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3.5">
                      <span className="text-4xl bg-slate-50 border border-slate-100 p-2.5 rounded-2xl select-none">
                        {story.emoji}
                      </span>
                      <div>
                        <h3 className="font-display font-bold text-sm text-slate-800 leading-tight">
                          {story.title}
                        </h3>
                        <span className="badge pill-amber text-[9px] font-black mt-1.5">{story.subject}</span>
                      </div>
                    </div>
                    {isDone && (
                      <span className="badge pill-green text-[9px] font-bold flex items-center gap-1 select-none">
                        <Check size={10} />
                        Read
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-50 mt-2 select-none text-[11px] font-bold">
                    <span className="text-slate-400">Time: {story.readTime}</span>
                    <span className="text-amber-600 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Read Story
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
