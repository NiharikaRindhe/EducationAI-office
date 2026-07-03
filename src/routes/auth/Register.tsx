import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ArrowRight, ArrowLeft, Check, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const EMOJI_OPTIONS = ['🦁', '🐯', '🦊', '🐼', '🐸', '🦋', '🦄', '🐉', '🚀', '⭐', '🎯', '🏆'];

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useApp();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'student' | 'teacher' | 'parent'>('student');
  const [schoolCode, setSchoolCode] = useState('');
  const [isSchoolVerified, setIsSchoolVerified] = useState(false);
  const [isVerifyingSchool, setIsVerifyingSchool] = useState(false);
  const [showVerifiedToast, setShowVerifiedToast] = useState(false);

  // Step 2 Form details
  const [fullName, setFullName] = useState('');
  const [classNum, setClassNum] = useState(3);
  const [section, setSection] = useState('A');
  const [selectedEmoji, setSelectedEmoji] = useState('🦊');

  // Teacher details
  const [employeeId, setEmployeeId] = useState('');
  const [specialization, setSpecialization] = useState('Science');
  const [classesTaught, setClassesTaught] = useState<string[]>(['Class 7', 'Class 8']);

  // Parent details
  const [parentPhone, setParentPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [childClass, setChildClass] = useState(3);

  // Step 3 creation loading
  const [isCreating, setIsCreating] = useState(false);

  // Verify School simulation
  const handleVerifySchool = () => {
    if (!schoolCode) return;
    setIsVerifyingSchool(true);
    setTimeout(() => {
      setIsVerifyingSchool(false);
      setIsSchoolVerified(true);
      setShowVerifiedToast(true);
      setTimeout(() => setShowVerifiedToast(false), 3000);
    }, 1500);
  };

  // Helper for batch mapping
  const getBatchFromClass = (c: number): number => {
    if (c >= 1 && c <= 4) return 1;
    if (c >= 5 && c <= 8) return 2;
    if (c >= 9 && c <= 10) return 3;
    if (c >= 11 && c <= 12) return 4;
    return 1;
  };

  const handleNextStep = () => {
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  // Create account & login
  const handleCreateAccount = () => {
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      if (role === 'student') {
        login('student', classNum, fullName, selectedEmoji);
        navigate(`/batch${getBatchFromClass(classNum)}/home`);
      } else if (role === 'teacher') {
        login('teacher');
        navigate('/teacher/dashboard');
      } else if (role === 'parent') {
        login('parent', childClass, childName);
        navigate('/parent/dashboard');
      }
    }, 1500);
  };

  // Checkbox toggles for teacher
  const toggleClassTaught = (cls: string) => {
    setClassesTaught(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#fcf8ff] font-sans">
      <div className="w-full max-w-[500px] flex flex-col gap-6 relative z-10">
        
        {/* Verification Toast */}
        {showVerifiedToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-sans font-bold text-xs py-3 px-5 rounded-2xl shadow-lg flex items-center gap-2 anim-fade-up z-50">
            <CheckCircle2 size={16} />
            <span>✓ School code verified successfully!</span>
          </div>
        )}

        {/* Step progress header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-2 select-none">
          <div className="flex gap-2 w-full justify-around text-center">
            {[
              { num: 1, label: 'Role & School' },
              { num: 2, label: 'Your Details' },
              { num: 3, label: 'Confirm' }
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === s.num 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                    : step > s.num 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-200 text-slate-400'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`text-[10px] font-bold ${step === s.num ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Step Wrapper */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-md">
          {/* STEP 1: Role & School */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="text-center md:text-left">
                <h2 className="font-display font-bold text-xl text-slate-800">Select your role & school</h2>
                <p className="font-sans text-xs text-slate-400 mt-1">We need to connect you to your school curriculum</p>
              </div>

              {/* Role Cards */}
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'student', icon: '👨‍🎓', label: 'Student' },
                  { key: 'teacher', icon: '👨‍🏫', label: 'Teacher' },
                  { key: 'parent', icon: '👨‍👩‍👧', label: 'Parent' }
                ] as const).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setRole(item.key);
                      setIsSchoolVerified(false);
                    }}
                    className={`p-4 border rounded-2xl flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      role === item.key
                        ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-500'
                    }`}
                  >
                    <span className="text-2xl select-none">{item.icon}</span>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* School Code Input */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">SCHOOL CODE</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">apartment</span>
                    <input
                      type="text"
                      value={schoolCode}
                      onChange={(e) => {
                        setSchoolCode(e.target.value);
                        setIsSchoolVerified(false);
                      }}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/15 focus:ring-4 rounded-xl font-sans text-xs outline-none transition-all"
                      placeholder="e.g. DPS-NOIDA-2024"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifySchool}
                    disabled={isVerifyingSchool || !schoolCode}
                    className="py-3 px-5 rounded-xl bg-slate-900 text-white font-sans font-bold text-xs hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1"
                  >
                    {isVerifyingSchool ? <Loader2 size={12} className="animate-spin" /> : 'Verify'}
                  </button>
                </div>
                {isSchoolVerified && (
                  <span className="text-[10px] text-emerald-600 font-bold ml-1 flex items-center gap-1 select-none">
                    ✓ School verified successfully
                  </span>
                )}
              </div>

              {/* Navigation button */}
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!isSchoolVerified}
                className="w-full py-3.5 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                Next Step
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="text-center md:text-left">
                <h2 className="font-display font-bold text-xl text-slate-800">Enter your details</h2>
                <p className="font-sans text-xs text-slate-400 mt-1">Set up your profile credentials</p>
              </div>

              {/* Student Details */}
              {role === 'student' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">FULL NAME</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                      placeholder="e.g. Aarav Sharma"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">CLASS</label>
                      <select
                        value={classNum}
                        onChange={(e) => setClassNum(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>Class {n}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">SECTION</label>
                      <select
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                      >
                        {['A', 'B', 'C', 'D'].map((sec) => (
                          <option key={sec} value={sec}>Section {sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Avatar Picker */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">CHOOSE YOUR AVATAR</label>
                    <div className="grid grid-cols-6 gap-2 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSelectedEmoji(emoji)}
                          className={`w-11 h-11 text-2xl flex items-center justify-center rounded-xl cursor-pointer hover:scale-110 transition-transform ${
                            selectedEmoji === emoji 
                              ? 'bg-white ring-2 ring-indigo-500 shadow-sm' 
                              : 'bg-white/50 border border-slate-100'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher Details */}
              {role === 'teacher' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">TEACHER NAME</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                      placeholder="e.g. Mrs. Sharma"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">EMPLOYEE ID</label>
                    <input
                      type="text"
                      required
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                      placeholder="e.g. TCH-908"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">SUBJECT SPECIALIZATION</label>
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                    >
                      {['Mathematics', 'Science', 'English', 'Social Science', 'Hindi'].map((subj) => (
                        <option key={subj} value={subj}>{subj}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Parent Details */}
              {role === 'parent' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">PARENT FULL NAME</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                      placeholder="e.g. Mr. Rajesh Patel"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">PHONE NUMBER</label>
                    <input
                      type="text"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 mt-1">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">CHILD'S NAME</label>
                      <input
                        type="text"
                        required
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                        placeholder="e.g. Dev"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-caps text-[9px] font-bold text-slate-400 ml-1">CHILD'S CLASS</label>
                      <select
                        value={childClass}
                        onChange={(e) => setChildClass(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-sans text-xs outline-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>Class {n}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-4 select-none">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-sans text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!fullName}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  Confirm Details
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="text-center md:text-left">
                <h2 className="font-display font-bold text-xl text-slate-800">Confirm and launch</h2>
                <p className="font-sans text-xs text-slate-400 mt-1">Review your setup credentials before finalizing</p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-4 font-sans text-xs">
                <div className="flex items-center gap-4">
                  {role === 'student' ? (
                    <span className="text-4xl bg-white border border-slate-100 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs select-none">
                      {selectedEmoji}
                    </span>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-display font-bold text-xl select-none">
                      {role === 'teacher' ? 'T' : 'P'}
                    </div>
                  )}

                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-800">{fullName}</h3>
                    <span className="font-medium text-[10px] text-slate-400 uppercase tracking-wide">
                      ROLE: {role}
                    </span>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-slate-200/50"></div>

                <div className="flex flex-col gap-2 font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">School Code</span>
                    <span className="font-bold text-slate-800">{schoolCode}</span>
                  </div>

                  {role === 'student' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Class & Section</span>
                        <span className="font-bold text-slate-800">Class {classNum} - {section}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned Cohort</span>
                        <span className="font-bold text-indigo-600">Batch {getBatchFromClass(classNum)} Student</span>
                      </div>
                    </>
                  )}

                  {role === 'teacher' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Employee ID</span>
                        <span className="font-bold text-slate-800">{employeeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Specialization</span>
                        <span className="font-bold text-indigo-600">{specialization}</span>
                      </div>
                    </>
                  )}

                  {role === 'parent' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Parent Phone</span>
                        <span className="font-bold text-slate-800">{parentPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Child's Name</span>
                        <span className="font-bold text-indigo-600">{childName} (Class {childClass})</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-4 select-none">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3.5 px-4 border border-slate-200 rounded-xl font-sans text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={isCreating}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10 transition-all"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <Check size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center font-sans text-xs text-slate-400 select-none">
          <span>Already have an account? </span>
          <Link to="/login" className="font-bold text-indigo-600 hover:underline">
            Sign In →
          </Link>
        </div>
      </div>
    </div>
  );
};
