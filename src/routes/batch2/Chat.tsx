import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Send, Trash2, Paperclip, ChevronDown, CheckCircle2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'student' | 'ai';
  text: string;
  citation?: string;
}

export const Batch2Chat: React.FC = () => {
  const { studentName } = useApp();
  const [subject, setSubject] = useState<'Mathematics' | 'Science' | 'English'>('Mathematics');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: "Hello! I am your AI Doubt Solver. Ask me anything about your NCERT chapters, formulas, or homework problems! 🧠",
      citation: 'System Intro'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickStarters = {
    Mathematics: [
      'Solve linear equation: 4x + 5 = 21',
      'What is a rational number?',
      'Explain Ch 3 properties of integers',
      'What is the formula for area of triangle?'
    ],
    Science: [
      'What is photosynthesis in plants?',
      'State Newton’s Second Law of Motion',
      'Explain the difference between acids and bases',
      'What is the function of mitochondria?'
    ],
    English: [
      'Summarize Chapter 1: Three Questions',
      'What is the rhyme scheme of a sonnet?',
      'Identify nouns in "The quick brown fox"',
      'Explain main theme of Novel "The Lost Key"'
    ]
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // Add student message
    const newStudentMsg: ChatMessage = {
      id: `m_${Date.now()}_stud`,
      sender: 'student',
      text
    };
    setMessages(prev => [...prev, newStudentMsg]);
    setInputMsg('');
    setIsTyping(true);

    // Simulate AI response after 1200ms
    setTimeout(() => {
      setIsTyping(false);
      
      let aiText = "Interesting question! Let me check Ch 4 of your NCERT textbook to provide a step-by-step breakdown. (Math Equation: \\(y = mx + c\\) )";
      let citation = "NCERT Ch 4";

      // Customize response slightly based on prompt
      const query = text.toLowerCase();
      if (query.includes('4x + 5 = 21')) {
        aiText = "Let's solve: \\(4x + 5 = 21\\)\n\n1. Subtract 5 from both sides:\n\\(4x = 21 - 5\\)\n\\(4x = 16\\)\n\n2. Divide by 4:\n\\(x = 16 / 4\\)\n\\(x = 4\\)\n\nResult is \\(x = 4\\)!";
        citation = "Maths Ch 4 Algebra";
      } else if (query.includes('photosynthesis')) {
        aiText = "Photosynthesis is the process by which green plants make food using:\n1. Carbon dioxide\n2. Water\n3. Sunlight (absorbed by chlorophyll)\n\nReaction formula:\n\\(6CO_2 + 6H_2O \\xrightarrow{\\text{light}} C_6H_{12}O_6 + 6O_2\\)";
        citation = "Science Ch 1 Nutrition";
      } else if (query.includes('second law')) {
        aiText = "Newton's Second Law of Motion states that force equals mass times acceleration:\n\n\\[F = ma\\]\n\nWhere:\n- \\(F\\) = Force applied (Newtons)\n- \\(m\\) = Mass of object (kg)\n- \\(a\\) = Acceleration (\\(m/s^2\\))\n\nReal life: Pushing an empty swing is easier than pushing a heavy person!";
        citation = "Science Ch 5 Motion";
      } else if (query.includes('rational number')) {
        aiText = "A rational number is any number that can be written in the fraction form:\n\n\\[\\frac{p}{q}\\]\n\nWhere:\n- \\(p\\) and \\(q\\) are integers\n- \\(q \\neq 0\\)\n\nExamples: \\(2/3\\), \\(-5/9\\), \\(4\\) (which is \\(4/1\\)).";
        citation = "Maths Ch 3 Numbers";
      }

      const newAiMsg: ChatMessage = {
        id: `m_${Date.now()}_ai`,
        sender: 'ai',
        text: aiText,
        citation
      };
      setMessages(prev => [...prev, newAiMsg]);
    }, 1200);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'm1',
        sender: 'ai',
        text: "Cleared! What doubt can I solve for you now? 💬",
        citation: 'System Intro'
      }
    ]);
  };

  return (
    <div className="bg-white border border-indigo-100 rounded-3xl overflow-hidden shadow-md flex flex-col h-[calc(100vh-160px)] font-sans select-none anim-fade-up">
      {/* Top Header bar with selector and clear button */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-xs text-slate-700">Subject context:</span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as any)}
            className="px-3.5 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold outline-none"
          >
            {['Mathematics', 'Science', 'English'].map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 py-2 px-3 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all rounded-xl font-sans text-xs font-semibold cursor-pointer"
        >
          <Trash2 size={14} />
          Clear Chat
        </button>
      </div>

      {/* Chat scroll bubble container */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.map((msg) => {
          const isStud = msg.sender === 'student';
          return (
            <div 
              key={msg.id}
              className={`flex flex-col gap-1 max-w-[80%] ${
                isStud ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              {/* Citation badge for AI */}
              {!isStud && msg.citation && (
                <span className="badge pill-indigo text-[8px] font-black tracking-wide uppercase select-none mb-0.5">
                  ✓ Citation: {msg.citation}
                </span>
              )}

              <div 
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  isStud 
                    ? 'bg-indigo-600 text-white rounded-tr-xs shadow-md shadow-indigo-600/10' 
                    : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-xs shadow-sm font-medium'
                }`}
                style={{ whiteSpace: 'pre-line' }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="self-start flex flex-col gap-1 items-start max-w-[80%]">
            <span className="text-[10px] text-slate-400 font-bold select-none animate-pulse">
              AI Doubt Solver is thinking...
            </span>
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl rounded-tl-xs flex gap-1 select-none">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Bottom input area with starters */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
        {/* Suggested questions chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 select-none">
          {quickStarters[subject].map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item)}
              className="py-1.5 px-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-[10px] font-bold text-slate-500 whitespace-nowrap cursor-pointer transition-all"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Input form */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(inputMsg); }}
          className="flex gap-2"
        >
          <button
            type="button"
            className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <Paperclip size={18} />
          </button>
          
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            className="flex-1 px-4 py-3 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl font-sans text-xs outline-none transition-all"
            placeholder={`Ask anything about ${subject} NCERT chapters...`}
          />

          <button
            type="submit"
            disabled={!inputMsg.trim()}
            className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/15 cursor-pointer disabled:opacity-50 transition-all"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
