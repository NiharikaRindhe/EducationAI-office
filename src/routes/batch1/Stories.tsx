import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Volume2, ChevronLeft, ChevronRight, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getClassTheme } from './theme';
import { Button, Pic, PageHeader, ProgressBar, StarRow, T, PRESS } from './ui';

/**
 * Stories — the one Batch 1 page that predated the shared UI kit.
 *
 * It used to be its own visual system entirely (`bento-card`, `pill-amber`,
 * hand-rolled `.progress-bar`) built before `ui.tsx` existed, so it was the
 * one screen in the portal that didn't match anything else. It also read
 * "+50 XP Earned" at the end of a quiz, while every other reward in the
 * portal (the Games finish screen, the header stat) calls the same number
 * Stars — this now says the same thing everyone else does.
 *
 * The story list used a `<div onClick>` as its card, which a keyboard or
 * screen-reader user cannot reach at all. It's a real `<button>` now.
 *
 * Content and logic (the four stories, the reading flow, the three-question
 * quiz, the confetti and Star award) are unchanged — only the markup and
 * styling moved onto the shared kit. `completedStories` is still
 * component-only state, not persisted anywhere in the API, which is why the
 * Home tile for this page shows a story count rather than a progress bar —
 * see the note next to `STORIES_CAPTION` in Home.tsx.
 */

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
  const { incrementXP, currentClass } = useApp();
  const theme = getClassTheme(currentClass);

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
    },
    {
      id: 's5',
      title: 'Where Does Rain Come From?',
      emoji: '💧',
      subject: 'Science',
      readTime: '3 min',
      completed: false,
      pages: [
        "Mira stood at the window and watched the rain. 'Where does all this water come from?' she asked her teacher.",
        "Her teacher said the sun warms rivers and ponds. Tiny drops rise into the air like steam from a kettle. That is called evaporation.",
        "High in the sky the drops get cold and join together as clouds. When the clouds get heavy, the water falls back as rain.",
        "Mira smiled. The same water goes up, becomes a cloud, and comes home again. That journey is called the water cycle."
      ],
      quiz: [
        { q: 'What makes water rise into the air?', options: ['The wind only', 'The sun warming water', 'Fish swimming', 'A broom'], correct: 'The sun warming water' },
        { q: 'What are clouds made of?', options: ['Cotton', 'Tiny water drops', 'Smoke', 'Leaves'], correct: 'Tiny water drops' },
        { q: 'What is the water cycle?', options: ['A race', 'Water going up and coming back as rain', 'A song', 'A game'], correct: 'Water going up and coming back as rain' }
      ]
    },
    {
      id: 's6',
      title: 'Sharing the Rotis',
      emoji: '🫓',
      subject: 'Maths',
      readTime: '3 min',
      completed: false,
      pages: [
        "Ammi made 8 hot rotis for lunch. Arjun and his sister Zara sat at the table, very hungry.",
        "Ammi said, 'Share them fairly. Fair means each of you gets the same number.'",
        "They put the rotis in two plates: one for Arjun, one for Zara. 8 rotis shared by 2 children is 4 rotis each.",
        "Both plates had the same amount. Arjun said, 'Fair sharing is just dividing!' And then they ate."
      ],
      quiz: [
        { q: 'How many rotis did Ammi make?', options: ['6', '8', '10', '2'], correct: '8' },
        { q: 'How many children shared the rotis?', options: ['2', '3', '4', '8'], correct: '2' },
        { q: 'How many rotis did each child get?', options: ['2', '3', '4', '8'], correct: '4' }
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
      // Stars scale with how many quiz questions were actually answered
      // correctly — this used to award the full 50 unconditionally, even on
      // a 0-correct attempt, which didn't reflect the child's performance.
      incrementXP(Math.round(50 * (quizScore / selectedStory.quiz.length)));
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
    <div className="flex flex-col gap-5 select-none anim-fade-up">
      {selectedStory ? (
        /* ── Reading / quiz ── */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Button tone="quiet" onClick={() => setSelectedStory(null)} icon={<ArrowLeft size={20} strokeWidth={3} />}>
              Back
            </Button>
            <span
              className="px-3.5 py-2 font-display font-black text-xs"
              style={{ borderRadius: 999, background: T.surface.sunk, color: T.ink.muted }}
            >
              {selectedStory.subject}
            </span>
          </div>

          <div className="bg-white p-5 sm:p-8" style={{ borderRadius: T.radius.md, boxShadow: T.shadow.card }}>
            {!isQuizMode ? (
              /* STORY READING MODE */
              <div className="flex flex-col gap-8">
                <div
                  className="h-44 flex items-center justify-center anim-float"
                  style={{ borderRadius: T.radius.md, background: `linear-gradient(160deg, ${theme.accent}26, ${theme.accent}0d)` }}
                >
                  <Pic emoji={selectedStory.emoji} size={104} />
                </div>

                {/* Progress dots */}
                <div className="flex justify-center items-center gap-1.5">
                  {selectedStory.pages.map((_, idx) => (
                    <span
                      key={idx}
                      className="rounded-full transition-all"
                      style={{
                        width: currentPage === idx ? 11 : 8,
                        height: currentPage === idx ? 11 : 8,
                        background: currentPage === idx ? theme.accent : T.surface.line,
                      }}
                    />
                  ))}
                </div>

                {/* Story page content */}
                <div className="px-2 sm:px-4 text-center max-w-2xl mx-auto">
                  <h3 className="font-display font-black text-2xl mb-4" style={{ color: T.ink.strong }}>
                    {selectedStory.title}
                  </h3>
                  <p className="text-lg md:text-xl leading-relaxed font-semibold" style={{ color: T.ink.muted }}>
                    {selectedStory.pages[currentPage]}
                  </p>
                </div>

                {/* Audio & page controls */}
                <div
                  className="flex items-center justify-between gap-3 pt-6"
                  style={{ borderTop: `1px solid ${T.surface.line}` }}
                >
                  <button
                    type="button"
                    onClick={handleAudioSimulate}
                    disabled={isPlayingAudio}
                    className={`inline-flex items-center gap-2 px-4 font-display font-black text-xs ${isPlayingAudio ? 'animate-pulse' : PRESS}`}
                    style={{
                      height: 48, borderRadius: T.radius.sm,
                      background: isPlayingAudio ? theme.accent : T.surface.sunk,
                      color: isPlayingAudio ? '#FFFFFF' : T.ink.strong,
                    }}
                  >
                    <Volume2 size={16} />
                    {isPlayingAudio ? 'Playing…' : 'Read Aloud'}
                  </button>

                  <div className="flex items-center gap-2.5">
                    <PageNavButton onClick={handlePrevPage} disabled={currentPage === 0} label="Previous page">
                      <ChevronLeft size={18} />
                    </PageNavButton>

                    <span className="font-bold text-xs hidden sm:inline" style={{ color: T.ink.faint }}>
                      Page {currentPage + 1} of {selectedStory.pages.length}
                    </span>

                    {currentPage < selectedStory.pages.length - 1 ? (
                      <PageNavButton onClick={handleNextPage} label="Next page">
                        <ChevronRight size={18} />
                      </PageNavButton>
                    ) : (
                      <Button tone="primary" onClick={() => setIsQuizMode(true)}>
                        Take the Quiz!
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* STORY QUIZ MODE */
              <div className="flex flex-col gap-6 max-w-xl mx-auto">
                {!isQuizFinished ? (
                  <div className="flex flex-col gap-6">
                    <div>
                      <span className="font-display font-black text-[10px] tracking-[.1em] uppercase" style={{ color: T.ink.faint }}>
                        Question {currentQuizQuestion + 1} of {selectedStory.quiz.length}
                      </span>
                      <ProgressBar value={currentQuizQuestion + 1} max={selectedStory.quiz.length} className="mt-1.5" />
                    </div>

                    <h3 className="font-display font-black text-xl leading-snug" style={{ color: T.ink.strong }}>
                      {selectedStory.quiz[currentQuizQuestion].q}
                    </h3>

                    <div className="flex flex-col gap-2.5">
                      {selectedStory.quiz[currentQuizQuestion].options.map((opt) => {
                        const correctAns = selectedStory.quiz[currentQuizQuestion].correct;
                        const isSelected = selectedAnswer === opt;
                        const isCorrect = opt === correctAns;

                        let bg: string = '#FFFFFF';
                        let color: string = T.ink.strong;
                        let border: string = T.surface.line;
                        let anim = '';
                        if (selectedAnswer !== null) {
                          if (isCorrect) {
                            bg = '#3FCB6E'; color = '#FFFFFF'; border = 'transparent'; anim = 'animate-glow-green';
                          } else if (isSelected) {
                            bg = '#F0554C'; color = '#FFFFFF'; border = 'transparent'; anim = 'animate-game-shake';
                          } else {
                            bg = T.surface.sunk; color = T.ink.faint; border = T.surface.line;
                          }
                        }

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleAnswerClick(opt)}
                            disabled={selectedAnswer !== null}
                            className={`w-full text-left py-4 px-5 font-display font-bold text-sm ${PRESS} ${anim}`}
                            style={{ borderRadius: T.radius.sm, background: bg, color, border: `2px solid ${border}` }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {selectedAnswer !== null && (
                      <Button tone="primary" block onClick={advanceQuiz}>
                        {currentQuizQuestion < selectedStory.quiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
                      </Button>
                    )}
                  </div>
                ) : (
                  /* QUIZ SCORE SCREEN */
                  <div className="text-center flex flex-col items-center gap-5 py-6 anim-fade-up">
                    <Pic emoji="🏆" size={72} />

                    <div>
                      <h3 className="font-display font-black text-2xl" style={{ color: T.ink.strong }}>
                        {quizScore === 3 ? 'Perfect Score!' : quizScore >= 2 ? 'Great effort!' : 'Keep practicing!'}
                      </h3>
                      <p className="text-sm font-bold mt-1" style={{ color: T.ink.muted }}>
                        You collected {quizScore} stars in this quiz adventure.
                      </p>
                    </div>

                    <StarRow earned={quizScore} size={40} />

                    <div
                      className="w-full flex justify-between items-center px-5 py-3.5"
                      style={{ borderRadius: T.radius.sm, background: '#FFF3D6' }}
                    >
                      <span className="font-display font-black text-xs" style={{ color: '#96690A' }}>STAR REWARD</span>
                      <span className="font-display font-black text-xs" style={{ color: '#96690A' }}>+50 ⭐</span>
                    </div>

                    <Button tone="secondary" block onClick={() => setSelectedStory(null)}>
                      Back to Research
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Story list ── */
        <>
          <PageHeader emoji="📖" artKey="nav-stories" title="Research" hint="Pick a story and read along" />

          <div className="flex gap-2.5 flex-wrap" role="tablist" aria-label="Choose a subject">
            {(['All', 'English', 'Maths', 'Science'] as const).map((tab) => {
              const on = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActiveTab(tab)}
                  className={`font-display font-black text-sm sm:text-base px-5 ${PRESS}`}
                  style={{
                    minHeight: 52,
                    borderRadius: T.radius.sm,
                    background: on ? theme.accent : '#FFFFFF',
                    color: on ? '#FFFFFF' : T.ink.strong,
                    border: `2px solid ${on ? theme.accent : T.surface.line}`,
                    boxShadow: `0 3px 0 ${on ? theme.accentDark : '#CBDDE9'}`,
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStories.map((story) => {
              const isDone = completedStories.includes(story.id);
              return (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => startReading(story)}
                  className={`flex flex-col gap-5 bg-white p-5 text-left ${PRESS}`}
                  style={{ borderRadius: T.radius.md, boxShadow: T.shadow.card }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className="flex items-center justify-center shrink-0"
                        style={{ width: 60, height: 60, borderRadius: T.radius.sm, background: T.surface.sunk }}
                      >
                        <Pic emoji={story.emoji} size={38} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display font-black text-sm leading-tight" style={{ color: T.ink.strong }}>
                          {story.title}
                        </h3>
                        <span
                          className="inline-block mt-1.5 px-2.5 py-1 font-display font-black text-[10px]"
                          style={{ borderRadius: 999, background: T.surface.sunk, color: T.ink.muted }}
                        >
                          {story.subject}
                        </span>
                      </div>
                    </div>
                    {isDone && (
                      <span
                        className="flex items-center gap-1 px-2.5 py-1.5 font-display font-black text-[10px] shrink-0"
                        style={{ borderRadius: 999, background: '#DCF7E3', color: '#1B7F41' }}
                      >
                        <Check size={12} strokeWidth={3} />
                        Read
                      </span>
                    )}
                  </div>

                  <div
                    className="flex justify-between items-center pt-3 font-bold text-xs"
                    style={{ borderTop: `1px solid ${T.surface.line}`, color: T.ink.muted }}
                  >
                    <span>⏱ {story.readTime}</span>
                    <span className="flex items-center gap-1 font-display font-black" style={{ color: theme.accent }}>
                      Read Story
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

/** The small round chevron buttons that turn a story's page. Local to this
 *  file — it's the same shape as `IconButton` in ui.tsx but needs a disabled
 *  state, which that primitive doesn't have. */
const PageNavButton: React.FC<{
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ children, label, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={`inline-flex items-center justify-center bg-white ${disabled ? 'opacity-40' : PRESS}`}
    style={{
      width: 44, height: 44,
      borderRadius: T.radius.sm,
      color: T.ink.muted,
      border: `2px solid ${T.surface.line}`,
      boxShadow: disabled ? 'none' : '0 3px 0 rgba(20,90,140,.10)',
    }}
  >
    {children}
  </button>
);
