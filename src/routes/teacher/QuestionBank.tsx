import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface QuestionBankItem {
  id: string;
  class_num: number;
  subject: string;
  chapter_num?: number;
  type: string;
  difficulty: string;
  text: string;
  correct_answer?: string;
  rubric?: string;
  marks: number;
  is_pyq: boolean;
  pyq_year?: number;
  pyq_source?: string;
  scope: 'global' | 'school';
}

const SUBJECT_WHITELIST = ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi'];
const TYPE_OPTIONS = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' },
  { value: 'fill_blank', label: 'Fill in Blanks' }
];

export const TeacherQuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionBankItem[] | null>(null);
  
  // Filters
  const [classNum, setClassNum] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [isPyq, setIsPyq] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // Add question modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [formClass, setFormClass] = useState('7');
  const [formSubject, setFormSubject] = useState('Science');
  const [formType, setFormType] = useState('mcq');
  const [formDiff, setFormDiff] = useState('medium');
  const [formMarks, setFormMarks] = useState('5');
  const [formText, setFormText] = useState('');
  const [formCorrectAns, setFormCorrectAns] = useState('');
  const [formRubric, setFormRubric] = useState('');
  const [formIsPyq, setFormIsPyq] = useState(false);
  const [formPyqYear, setFormPyqYear] = useState('2024');
  const [formPyqSource, setFormPyqSource] = useState('CBSE');

  const fetchQuestions = () => {
    setQuestions(null);
    const query: Record<string, any> = {};
    if (classNum) query.classNum = classNum;
    if (subject) query.subject = subject;
    if (type) query.type = type;
    if (isPyq) query.isPyq = true;
    if (search) query.search = search;

    api.get<QuestionBankItem[]>('/teacher/question-bank', query)
      .then(setQuestions)
      .catch(() => setQuestions([])); // fallback gracefully
  };

  useEffect(() => {
    fetchQuestions();
  }, [classNum, subject, type, isPyq]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.post('/teacher/question-bank', {
        classNum: Number(formClass),
        subject: formSubject,
        type: formType,
        difficulty: formDiff,
        marks: Number(formMarks),
        text: formText,
        correctAnswer: formCorrectAns || undefined,
        rubric: formRubric || undefined,
        isPyq: formIsPyq,
        pyqYear: formIsPyq ? Number(formPyqYear) : undefined,
        pyqSource: formIsPyq ? formPyqSource : undefined,
      });

      setSuccessMsg('Question added successfully!');
      setFormText('');
      setFormCorrectAns('');
      setFormRubric('');
      fetchQuestions();
      setTimeout(() => {
        setShowModal(false);
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add question');
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setClassNum('');
    setSubject('');
    setType('');
    setIsPyq(false);
    setSearch('');
  };

  return (
    <div className="flex flex-col gap-6 font-sans select-none anim-fade-up text-left relative">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-800 font-black">Question Bank</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Browse CBSE mock questions &amp; add school-scoped challenges.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-md shadow-indigo-600/10"
        >
          <Plus size={14} /> Add Question
        </button>
      </div>

      {/* Main Two-Pane layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left pane: Filters */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col gap-4">
          <div className="bento-card border border-slate-100 bg-white p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-display font-bold text-xs text-slate-700">Filters</span>
              <button onClick={clearFilters} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Clear All</button>
            </div>

            {/* Class filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Class Level</label>
              <select
                value={classNum}
                onChange={e => setClassNum(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none cursor-pointer"
              >
                <option value="">All Classes</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            {/* Subject filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none cursor-pointer"
              >
                <option value="">All Subjects</option>
                {SUBJECT_WHITELIST.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Type filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Question Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none cursor-pointer"
              >
                <option value="">All Types</option>
                {TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* PYQ toggle */}
            <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isPyq}
                onChange={e => setIsPyq(e.target.checked)}
                className="accent-indigo-600"
              />
              <span>Past Year Paper (PYQ)</span>
            </label>
          </div>
        </div>

        {/* Right pane: Results */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col gap-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search question bank content…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 bg-white rounded-xl outline-none focus:border-indigo-500 font-sans"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Search
            </button>
          </form>

          {questions === null ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
          ) : questions.length === 0 ? (
            <div className="text-center py-16 bento-card bg-white border border-slate-100 text-slate-400 text-sm">
              No questions found matching the selected filters.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{questions.length} questions available</p>
              {questions.map(q => (
                <QuestionCard key={q.id} item={q} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Question Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 anim-fade-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-sm text-slate-800">Add New Question</h3>

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 flex gap-2 text-xs font-bold">
                <CheckCircle className="text-emerald-600 shrink-0" size={14} />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 flex gap-2 text-xs font-bold">
                <AlertCircle className="text-rose-600 shrink-0" size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddQuestionSubmit} className="flex flex-col gap-3 text-left text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label>Class Level</label>
                  <select value={formClass} onChange={e => setFormClass(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label>Subject</label>
                  <select value={formSubject} onChange={e => setFormSubject(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    {SUBJECT_WHITELIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label>Type</label>
                  <select value={formType} onChange={e => setFormType(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    {TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label>Difficulty</label>
                  <select value={formDiff} onChange={e => setFormDiff(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label>Marks</label>
                  <input type="number" min="1" max="20" value={formMarks} onChange={e => setFormMarks(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label>Question Content</label>
                <textarea rows={3} required value={formText} onChange={e => setFormText(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans" placeholder="Write question statement here..." />
              </div>

              <div className="flex flex-col gap-1">
                <label>Correct Answer (Optional)</label>
                <input type="text" value={formCorrectAns} onChange={e => setFormCorrectAns(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="e.g. A" />
              </div>

              <div className="flex flex-col gap-1">
                <label>Subjective Rubric (Optional)</label>
                <textarea rows={2} value={formRubric} onChange={e => setFormRubric(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans" placeholder="What points should be mentioned to earn marks..." />
              </div>

              {/* PYQ check */}
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
                <input type="checkbox" checked={formIsPyq} onChange={e => setFormIsPyq(e.target.checked)} className="accent-indigo-600" />
                <span>Tag as Board PYQ</span>
              </label>

              {formIsPyq && (
                <div className="grid grid-cols-2 gap-3 animate-fade-up">
                  <div className="flex flex-col gap-1">
                    <label>PYQ Year</label>
                    <input type="number" min="1990" max="2030" value={formPyqYear} onChange={e => setFormPyqYear(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label>Source Board</label>
                    <input type="text" value={formPyqSource} onChange={e => setFormPyqSource(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer font-bold flex items-center justify-center gap-1">
                  {submitting && <Loader2 size={12} className="animate-spin" />}
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Individual Question Card component ────────────────────── */
const QuestionCard: React.FC<{ item: QuestionBankItem }> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  const diffColors: Record<string, string> = {
    easy: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    hard: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="bento-card border border-slate-100 bg-white p-4 flex flex-col gap-3 transition-all hover:border-slate-200">
      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{item.subject}</span>
          <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Class {item.class_num}</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${diffColors[item.difficulty] ?? ''}`}>
            {item.difficulty}
          </span>
          <span className="text-[9px] font-bold text-slate-400">{item.marks}M</span>
          {item.is_pyq && (
            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              PYQ {item.pyq_year}
            </span>
          )}
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.scope === 'global' ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-700'}`}>
            {item.scope}
          </span>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <p className="font-sans text-xs text-slate-700 font-semibold leading-relaxed truncate-2-lines">
        {item.text}
      </p>

      {expanded && (
        <div className="border-t border-slate-100 pt-3 flex flex-col gap-3 font-sans text-xs text-slate-600 animate-fade-up">
          {item.correct_answer && (
            <div>
              <span className="font-bold text-slate-800">Correct Answer:</span>
              <p className="mt-0.5 bg-slate-50 p-2 rounded-lg font-mono text-[11px]">{item.correct_answer}</p>
            </div>
          )}
          {item.rubric && (
            <div>
              <span className="font-bold text-slate-800">Subjective Rubric:</span>
              <p className="mt-0.5 bg-slate-50 p-2.5 rounded-lg leading-relaxed">{item.rubric}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
