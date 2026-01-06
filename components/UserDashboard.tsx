
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { geminiService } from '../services/geminiService';
import { LearningPathItem, SkillGap, Course, MicroLesson, User, Achievement, SkillStat, QuizBank, UserTab } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const UserDashboard: React.FC = () => {
  const { user, logout, updateUser } = useAuth() as any;
  const [activeTab, setActiveTab] = useState<UserTab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Course Feature State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  // Assessment State
  const [activeQuiz, setActiveQuiz] = useState<{courseId: string, bank: QuizBank} | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Chat AI State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hi ${user?.name.split(' ')[0]}! I'm your EduAI Study Buddy. How can I help you reach your goal of "${user?.learningGoal}" today?` }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Other State
  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([]);
  const [activeMicroLesson, setActiveMicroLesson] = useState<MicroLesson | null>(null);
  const [microAnswers, setMicroAnswers] = useState<Record<string, number>>({});
  const [microSubmitted, setMicroSubmitted] = useState(false);
  const [explorerSearch, setExplorerSearch] = useState('');
  const [explorerResult, setExplorerResult] = useState<any>(null);

  // Creative/Image State
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  useEffect(() => {
    setApiError(null);
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const courses: Course[] = [
      {
        id: '1',
        title: 'Advanced React Patterns',
        description: 'Master render props, HOCs, and performance tuning for high-scale applications. Learn to architect scalable frontend systems.',
        price: 49.99,
        instructorId: 'inst-1',
        studentsCount: 150,
        rating: 4.8,
        level: 'Advanced' as const,
        materials: [
          { type: 'video', title: 'Introduction to Patterns', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { type: 'video', title: 'Deep Dive into HOCs', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ],
        quizBanks: [
          { 
            id: 'q1', 
            title: 'Hooks Deep Dive', 
            difficulty: 'Intermediate' as const, 
            questions: [
              { id: 'h1', question: 'What is the primary use of useMemo?', options: ['Side effects', 'Memoizing values', 'DOM access', 'State updates'], correctAnswer: 1, explanation: 'useMemo caches computation results specifically to avoid expensive re-calculations on every render.', skillTag: 'React Hooks' },
              { id: 'h2', question: 'When does useEffect with an empty dependency array run?', options: ['Every render', 'Only on mount', 'Only on unmount', 'Never'], correctAnswer: 1, explanation: 'An empty dependency array [] tells React that your effect doesn’t depend on any values from props or state, so it never needs to re-run.', skillTag: 'React Lifecycle' }
            ] 
          }
        ]
      },
      {
        id: '2',
        title: 'Mindfulness & Wellness',
        description: 'Techniques for stress management and focus in a high-pressure tech world. Master the art of the calm mind.',
        price: 19.99,
        instructorId: 'inst-2',
        studentsCount: 890,
        rating: 4.9,
        level: 'Beginner' as const,
        materials: [
          { type: 'video', title: 'Breathwork Basics', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
        ],
        quizBanks: []
      }
    ];
    setAvailableCourses(courses);
  }, []);

  const handleSendMessage = async (customMessage?: string) => {
    const text = customMessage || chatInput;
    if (!text.trim() || loading) return;

    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', text }];
    setChatMessages(newMessages);
    setChatInput('');
    setLoading(true);
    setApiError(null);

    try {
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const context = `The learner is at ${user.skillLevel} level. Interests: ${user.areasOfInterest?.join(', ')}.`;
      const response = await geminiService.getChatbotResponse(text, history, context);
      setChatMessages([...newMessages, { role: 'model', text: response }]);
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = () => {
    if (!activeQuiz) return;
    setQuizSubmitted(true);
    const correctCount = activeQuiz.bank.questions.filter(q => quizAnswers[q.id] === q.correctAnswer).length;
    const score = Math.round((correctCount / activeQuiz.bank.questions.length) * 100);
    const today = new Date().toLocaleDateString();

    updateUser({
      ...user,
      points: user.points + 50,
      quizHistory: [...user.quizHistory, { topic: activeQuiz.bank.title, score, date: today, moduleTitle: activeQuiz.bank.title }]
    });
  };

  const handleEnroll = (courseId: string) => {
    if (user.enrolledCourseIds.includes(courseId)) return;
    updateUser({
      ...user,
      enrolledCourseIds: [...user.enrolledCourseIds, courseId]
    });
  };

  const generateRoadmap = async (goal?: string) => {
    setLoading(true);
    setApiError(null);
    try {
      const path = await geminiService.generateLearningPath(goal || user.learningGoal || 'Full-Stack Developer', user.skillLevel || 'Beginner');
      setLearningPath(path);
      if (goal) updateUser({...user, learningGoal: goal});
    } catch (e: any) {
      setApiError(e.message);
    } finally { setLoading(false); }
  };

  const handleCareerSearch = async () => {
    if (!explorerSearch) return;
    setLoading(true);
    setApiError(null);
    try {
      const result = await geminiService.exploreCareerPath(explorerSearch);
      setExplorerResult(result);
    } catch (e: any) {
      setApiError(e.message);
    } finally { setLoading(false); }
  };

  const handleEditImage = async () => {
    if (!sourceImage || !imagePrompt) return;
    setLoading(true);
    try {
      const base64Data = sourceImage.split(',')[1];
      const mimeType = sourceImage.split(',')[0].split(':')[1].split(';')[0];
      const result = await geminiService.editImage(base64Data, mimeType, imagePrompt);
      setEditedImage(result);
    } catch (e: any) {
      setApiError(e.message);
    } finally { setLoading(false); }
  };

  const startMicroLesson = async (topic: string) => {
    setLoading(true);
    try {
      const lesson = await geminiService.generateMicroLesson(topic);
      lesson.videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ"; 
      setActiveMicroLesson(lesson);
      setMicroAnswers({});
      setMicroSubmitted(false);
    } catch (e: any) {
      setApiError(e.message);
    } finally { setLoading(false); }
  };

  const tabs: {id: UserTab, label: string, icon: string}[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'assessments', label: 'Assessments', icon: 'fa-vial' },
    { id: 'chat', label: 'AI Assistant', icon: 'fa-comment-dots' },
    { id: 'courses', label: 'Courses', icon: 'fa-book' },
    { id: 'explorer', label: 'Career Explorer', icon: 'fa-compass' },
    { id: 'micro', label: 'Micro-Learning', icon: 'fa-bolt' },
    { id: 'creative', label: 'Creative AI', icon: 'fa-wand-magic-sparkles' },
    { id: 'roadmap', label: 'Roadmap', icon: 'fa-bullseye' },
    { id: 'profile', label: 'Profile', icon: 'fa-user' },
  ];

  const avgProficiency = user.quizHistory.length > 0 
    ? Math.round(user.quizHistory.reduce((acc: number, q: any) => acc + q.score, 0) / user.quizHistory.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="px-12 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
             <i className="fas fa-graduation-cap"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black text-indigo-700 tracking-tight leading-none">EduAI</h1>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest leading-none">Lifelong Learning</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-amber-500 font-black">
             <i className="fas fa-bolt"></i>
             <span className="text-sm">{user?.points || 0} XP</span>
          </div>
          <img src={user?.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-indigo-100 shadow-sm" />
          <button onClick={logout} className="text-xs font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">Logout</button>
        </div>
      </header>

      <nav className="px-12 py-6 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white border-b border-slate-100 sticky top-[73px] z-30">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedCourse(null); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </nav>

      <main className="px-12 py-8 max-w-7xl mx-auto min-h-[70vh]">
        {loading && <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center"><div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Focus on your growth, {user?.name.split(' ')[0]}</h2>
                <p className="text-slate-400 font-medium text-lg">You have earned <span className="text-indigo-600 font-black">{user.points} XP</span> on your journey.</p>
              </div>
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-5xl"><i className="fas fa-rocket"></i></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-4">Current Path</h4>
                <p className="text-3xl font-black mb-8">{user?.learningGoal || 'Define your path'}</p>
                <button onClick={() => setActiveTab('roadmap')} className="bg-white/10 px-8 py-3 rounded-2xl hover:bg-white/20 font-black text-xs uppercase tracking-widest transition-all">Review Roadmap</button>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Average Proficiency</h4>
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                    <circle 
                      cx="64" cy="64" r="58" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray="364.4" 
                      strokeDashoffset={364.4 - (364.4 * (avgProficiency / 100))} 
                      className="text-indigo-600 transition-all duration-1000" 
                    />
                  </svg>
                  <span className="absolute text-2xl font-black text-slate-900">{avgProficiency}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="animate-in fade-in duration-500">
            {!selectedCourse ? (
              <div className="space-y-8">
                <h2 className="text-3xl font-black text-slate-900">Adaptive Courses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {availableCourses.map(course => (
                    <div key={course.id} className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col">
                      <div className="h-40 bg-slate-100 flex items-center justify-center text-4xl text-slate-300">
                        <i className="fas fa-book-open"></i>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-xl font-black text-slate-900 mb-3">{course.title}</h3>
                        <p className="text-sm text-slate-400 font-medium mb-8 flex-1 line-clamp-2">{course.description}</p>
                        <div className="flex items-center justify-between mb-6">
                           <span className="text-xs font-black px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg uppercase tracking-widest">{course.level}</span>
                           <div className="flex items-center gap-1 text-amber-500 font-black"><i className="fas fa-star"></i> {course.rating}</div>
                        </div>
                        <button 
                          onClick={() => setSelectedCourse(course)}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                        >
                          View Course Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-8">
                <button onClick={() => setSelectedCourse(null)} className="mb-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                  <i className="fas fa-arrow-left mr-2"></i> Back to Catalog
                </button>

                {user.enrolledCourseIds.includes(selectedCourse.id) ? (
                  // COURSE PLAYER VIEW
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-slate-900 rounded-[2.5rem] aspect-video overflow-hidden shadow-2xl border-4 border-slate-800">
                         <iframe 
                           className="w-full h-full" 
                           src={selectedCourse.materials[0]?.url || "https://www.youtube.com/embed/dQw4w9WgXcQ"} 
                           title="Lesson Video" 
                           allowFullScreen 
                         />
                      </div>
                      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-2xl font-black text-slate-900 mb-4">{selectedCourse.title}</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">{selectedCourse.description}</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                       <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                         <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Course Content</h4>
                         <div className="space-y-4">
                           {selectedCourse.materials.map((m, i) => (
                             <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all group cursor-pointer border border-transparent hover:border-indigo-100">
                               <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                 {i + 1}
                               </div>
                               <div>
                                 <p className="text-sm font-black text-slate-700">{m.title}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{m.type}</p>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                       {selectedCourse.quizBanks.map(bank => (
                         <div key={bank.id} className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                           <div className="relative z-10">
                             <h4 className="text-lg font-black mb-2">{bank.title}</h4>
                             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">{bank.difficulty} Assessment</p>
                             <button 
                               onClick={() => { setActiveQuiz({courseId: selectedCourse.id, bank}); setActiveTab('assessments'); }}
                               className="w-full py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all"
                             >
                               Take Module Quiz
                             </button>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                ) : (
                  // COURSE INTRODUCTION VIEW
                  <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-900 p-16 text-white text-center space-y-4">
                      <h3 className="text-5xl font-black tracking-tight">{selectedCourse.title}</h3>
                      <div className="flex items-center justify-center gap-6 pt-4">
                        <span className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{selectedCourse.level}</span>
                        <span className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"><i className="fas fa-users mr-2"></i>{selectedCourse.studentsCount} Enrolled</span>
                        <span className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"><i className="fas fa-star mr-2 text-amber-400"></i>{selectedCourse.rating}</span>
                      </div>
                    </div>
                    <div className="p-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
                      <div className="space-y-10">
                        <section>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">About the Course</h4>
                          <p className="text-xl font-medium text-slate-600 leading-relaxed">{selectedCourse.description}</p>
                        </section>
                        <section>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">What's Inside</h4>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                              <p className="text-2xl font-black text-slate-900 mb-1">{selectedCourse.materials.length}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Video Lessons</p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                              <p className="text-2xl font-black text-slate-900 mb-1">{selectedCourse.quizBanks.length}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">AI Modules</p>
                            </div>
                          </div>
                        </section>
                      </div>
                      <div className="flex flex-col justify-center">
                         <div className="bg-indigo-50 p-12 rounded-[3rem] border border-indigo-100 text-center space-y-8">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Full Access Pass</p>
                            <h5 className="text-6xl font-black text-slate-900">${selectedCourse.price}</h5>
                            <button 
                              onClick={() => handleEnroll(selectedCourse.id)}
                              className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                            >
                              Enroll & Start Learning
                            </button>
                            <p className="text-xs text-slate-400 font-bold">Includes Lifetime Updates & Certification</p>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-12 animate-in fade-in">
            <h2 className="text-3xl font-black text-slate-900">Assessment Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableCourses.filter(c => user.enrolledCourseIds.includes(c.id)).map(course => (
                <div key={course.id} className="space-y-6">
                  <h3 className="text-xl font-black text-indigo-600 border-b pb-2">{course.title}</h3>
                  {course.quizBanks.map(bank => (
                    <div key={bank.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                      <div className="flex justify-between items-start mb-6">
                         <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${bank.difficulty === 'Advanced' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {bank.difficulty}
                         </span>
                         <i className="fas fa-vial text-slate-200 group-hover:text-indigo-400 transition-colors"></i>
                      </div>
                      <h4 className="text-xl font-black text-slate-800 mb-3">{bank.title}</h4>
                      <p className="text-sm text-slate-400 font-medium mb-8">Test your knowledge on this module specific concepts.</p>
                      <button 
                        onClick={() => { setActiveQuiz({courseId: course.id, bank}); setQuizAnswers({}); setQuizSubmitted(false); }}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                      >
                        Start Assessment
                      </button>
                    </div>
                  ))}
                </div>
              ))}
              {user.enrolledCourseIds.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed">
                  <p className="text-slate-400 font-black uppercase tracking-widest">Enroll in a course to unlock assessments</p>
                </div>
              )}
            </div>

            {activeQuiz && (
              <div className="fixed inset-0 z-[60] bg-white p-10 overflow-y-auto animate-in slide-in-from-bottom-8">
                <div className="max-w-4xl mx-auto pb-20">
                   <div className="flex items-center justify-between mb-10">
                     <button onClick={() => setActiveQuiz(null)} className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-colors">
                       <i className="fas fa-arrow-left mr-2"></i> Exit
                     </button>
                     {quizSubmitted && <span className="bg-indigo-50 text-indigo-600 px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest">Review Mode</span>}
                   </div>

                   <h2 className="text-4xl font-black text-slate-900 mb-2">{activeQuiz.bank.title}</h2>
                   <p className="text-slate-500 font-bold mb-12">Difficulty: {activeQuiz.bank.difficulty}</p>
                   
                   <div className="space-y-12">
                     {activeQuiz.bank.questions.map((q, idx) => {
                       const userChoice = quizAnswers[q.id];
                       const isCorrect = userChoice === q.correctAnswer;
                       
                       return (
                         <div key={q.id} className={`p-8 rounded-[2.5rem] border-2 transition-all ${
                           quizSubmitted 
                            ? isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-rose-50/30 border-rose-100'
                            : 'bg-white border-transparent'
                         }`}>
                            <div className="flex items-start justify-between mb-6">
                              <p className="text-xl font-black text-slate-800 max-w-[80%]">{idx+1}. {q.question}</p>
                              {quizSubmitted && (
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                  <i className={`fas ${isCorrect ? 'fa-check' : 'fa-times'}`}></i>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                              {q.options.map((opt, oIdx) => {
                                let style = "bg-white border-slate-100 text-slate-600";
                                if (quizAnswers[q.id] === oIdx) {
                                  style = quizSubmitted 
                                    ? (oIdx === q.correctAnswer ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200') 
                                    : 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200';
                                } else if (quizSubmitted && oIdx === q.correctAnswer) {
                                  style = 'bg-emerald-50 border-emerald-300 text-emerald-700 font-black';
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    disabled={quizSubmitted}
                                    onClick={() => setQuizAnswers(prev => ({...prev, [q.id]: oIdx}))}
                                    className={`p-6 rounded-2xl border-2 text-left font-bold transition-all relative group ${style}`}
                                  >
                                    <span className="relative z-10">{opt}</span>
                                    {quizSubmitted && oIdx === q.correctAnswer && !isCorrect && (
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] uppercase font-black bg-emerald-100 text-emerald-600 px-2 py-1 rounded">Correct Answer</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {quizSubmitted && (
                              <div className="animate-in slide-in-from-top-4 duration-500">
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-sm"><i className="fas fa-robot"></i></div>
                                    <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest">AI Explanation</h5>
                                  </div>
                                  <p className="text-sm font-medium text-slate-500 leading-relaxed italic border-l-4 border-indigo-500 pl-4">
                                    {q.explanation}
                                  </p>
                                  <div className="pt-4 border-t border-slate-50 flex flex-wrap items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill Deep Dive:</span>
                                    <a 
                                      href={`https://www.google.com/search?q=${encodeURIComponent(q.skillTag + " mastery")}`} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2"
                                    >
                                      {q.skillTag} <i className="fas fa-external-link-alt text-[8px]"></i>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}
                         </div>
                       );
                     })}
                   </div>

                   {!quizSubmitted ? (
                     <button onClick={handleQuizSubmit} className="w-full py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-sm shadow-xl mt-12">Submit Assessment</button>
                   ) : (
                     <div className="mt-12 text-center">
                        <button onClick={() => setActiveQuiz(null)} className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs">Finish & Review</button>
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-[75vh] max-w-4xl mx-auto bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
            <header className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-100"><i className="fas fa-robot"></i></div>
                <div><h2 className="text-xl font-black text-slate-900 leading-none">EduAI Brain</h2><p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Live Tutoring</p></div>
              </div>
              <button onClick={() => setChatMessages([{ role: 'model', text: `Cleared. How can I help?` }])} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reset History</button>
            </header>
            <div className="flex-1 overflow-y-auto p-10 space-y-6 no-scrollbar">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                   <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm font-medium shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                     {msg.text}
                   </div>
                </div>
              ))}
              {loading && <div className="flex justify-start animate-pulse"><div className="bg-slate-50 p-5 rounded-[2rem] text-slate-400 text-xs font-bold uppercase">EduAI is generating...</div></div>}
              <div ref={chatEndRef} />
            </div>
            <footer className="p-8 bg-slate-50/50 border-t border-slate-100">
              <div className="flex gap-4">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask anything about your lessons..." className="flex-1 px-8 py-5 bg-white border border-slate-200 rounded-2xl outline-none text-sm shadow-sm" />
                <button onClick={() => handleSendMessage()} disabled={loading} className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-indigo-700 transition-all"><i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i></button>
              </div>
            </footer>
          </div>
        )}

        {activeTab === 'explorer' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Career Explorer</h2>
            <p className="text-slate-400 font-medium mb-10">Discover your path. Start a personalized roadmap instantly.</p>
            
            <div className="flex gap-4 mb-12">
               <input 
                 type="text" 
                 value={explorerSearch}
                 onChange={(e) => setExplorerSearch(e.target.value)}
                 placeholder="Search a career (e.g. AI Engineer, UX Lead)" 
                 className="flex-1 px-8 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-medium shadow-sm"
               />
               <button onClick={handleCareerSearch} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all hover:bg-indigo-700">Search Path</button>
            </div>

            {explorerResult && (
              <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm animate-in zoom-in-95 duration-500">
                <div className="flex justify-between items-start mb-10 pb-10 border-b border-slate-100">
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 mb-2">{explorerResult.title}</h3>
                    <p className="text-indigo-600 font-black uppercase tracking-widest text-xs">{explorerResult.demandLevel} Market Demand</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Typical Salary</p>
                    <p className="text-2xl font-black text-slate-900">{explorerResult.salaryRange}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Market Insight</h4>
                    <p className="text-slate-600 leading-relaxed font-medium">{explorerResult.description}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Prerequisite Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {explorerResult.requiredSkills.map((s: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setActiveTab('roadmap');
                    generateRoadmap(explorerResult.title);
                  }}
                  className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
                >
                  Start Career Roadmap
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'micro' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Video Micro-Learning</h2>
            <p className="text-slate-400 font-medium mb-10">4-stage mastery: Concept, Video, Notes, and Quiz.</p>

            {activeMicroLesson ? (
              <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-2xl max-w-5xl mx-auto animate-in zoom-in-95 duration-500">
                <button onClick={() => setActiveMicroLesson(null)} className="text-[10px] font-black text-slate-400 mb-12 uppercase tracking-widest hover:text-indigo-600">
                  <i className="fas fa-arrow-left mr-2"></i> Exit Lesson
                </button>
                <h3 className="text-4xl font-black text-slate-900 mb-12 tracking-tight">{activeMicroLesson.title}</h3>
                
                <div className="mb-16">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-indigo-600 pl-4 mb-6">Stage 1: The Concept</h4>
                  <div className="prose prose-slate max-w-none text-slate-700 font-medium text-lg leading-relaxed">
                    {activeMicroLesson.content}
                  </div>
                </div>

                <div className="mb-16">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-blue-500 pl-4 mb-6">Stage 2: Video Demonstration</h4>
                  <div className="w-full aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-slate-900">
                    <iframe className="w-full h-full" src={activeMicroLesson.videoUrl} title="Demonstration Video" allowFullScreen></iframe>
                  </div>
                </div>

                <div className="space-y-8 pt-12 border-t border-slate-100">
                  <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner"><i className="fas fa-check-double"></i></span>
                    Final Concept Check
                  </h4>
                  {activeMicroLesson.quiz.map((q, idx) => (
                    <div key={idx} className="space-y-4">
                      <p className="font-bold text-slate-700 text-lg">{idx + 1}. {q.question}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            disabled={microSubmitted}
                            onClick={() => setMicroAnswers(prev => ({...prev, [q.id]: oIdx}))}
                            className={`p-6 rounded-2xl border text-sm font-bold text-left transition-all ${
                              microAnswers[q.id] === oIdx 
                                ? microSubmitted ? (oIdx === q.correctAnswer ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-rose-600 text-white shadow-lg shadow-rose-200') : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : microSubmitted && oIdx === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 hover:border-indigo-300'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!microSubmitted ? (
                    <button onClick={() => {
                      setMicroSubmitted(true);
                      updateUser({...user, points: user.points + 25});
                    }} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 shadow-xl mt-12 transition-all">
                       Submit Quiz & Complete Lesson
                    </button>
                  ) : (
                    <button onClick={() => setActiveMicroLesson(null)} className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 shadow-xl mt-12 transition-all">
                       Back to Lessons
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: 'React Hook Mastery', desc: '5-minute deep dive with video demonstration', icon: 'fa-code' },
                  { title: 'Flexbox Architecture', desc: 'Visual guide to complex web layouts', icon: 'fa-layer-group' },
                  { title: 'Pythonic Logic', desc: 'Writing clean, efficient code quickly', icon: 'fa-terminal' },
                ].map((topic, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 hover:shadow-2xl transition-all group flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-10">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                          <i className={`fas ${topic.icon} text-2xl`}></i>
                        </div>
                        <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl flex items-center gap-2 uppercase tracking-widest">5 MIN</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">{topic.title}</h3>
                      <p className="text-sm text-slate-400 font-medium mb-12">{topic.desc}</p>
                    </div>
                    <button onClick={() => startMicroLesson(topic.title)} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 shadow-xl transition-all">
                      <i className="fas fa-play mr-2"></i> Play Sprint
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'creative' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 pb-20 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Creative AI Studio</h2>
            <p className="text-slate-400 font-medium mb-10">Use natural language to edit and transform educational visuals.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div 
                  className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] aspect-square flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-indigo-400 transition-all overflow-hidden relative group shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {sourceImage ? (
                    <img src={sourceImage} className="w-full h-full object-cover rounded-2xl" alt="Source" />
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt text-5xl text-slate-200 mb-6"></i>
                      <p className="text-slate-400 font-bold">Click to upload image</p>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setSourceImage(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
                <input 
                  type="text" 
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe your edit..."
                  className="w-full px-8 py-5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-medium shadow-sm"
                />
                <button 
                  onClick={handleEditImage}
                  disabled={!sourceImage || !imagePrompt || loading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all hover:bg-indigo-700"
                >
                  Transform Image
                </button>
              </div>
              <div className="bg-slate-900 rounded-[2.5rem] aspect-square flex items-center justify-center p-8 relative overflow-hidden shadow-2xl">
                {editedImage ? (
                  <img src={editedImage} className="w-full h-full object-contain rounded-2xl shadow-2xl animate-in fade-in" alt="Result" />
                ) : (
                  <div className="text-slate-600 flex flex-col items-center">
                    <i className="fas fa-sparkles text-6xl mb-6 opacity-20"></i>
                    <p className="font-black uppercase tracking-widest text-xs opacity-50 text-center">AI Transformation Result</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-12">
            <div className="flex items-center justify-between">
              <div><h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">AI Personal Roadmap</h2><p className="text-slate-500 font-medium text-lg">Your custom path to becoming a <b>{user.learningGoal}</b>.</p></div>
              <button onClick={() => generateRoadmap()} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl transition-all"><i className="fas fa-magic mr-2"></i> {learningPath.length > 0 ? 'Regenerate' : 'Generate Journey'}</button>
            </div>
            {learningPath.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {learningPath.map((item, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl mb-10 group-hover:bg-indigo-600 group-hover:text-white transition-all">W{item.week}</div>
                    <h3 className="text-2xl font-black text-slate-900 mb-6">{item.topic}</h3>
                    <p className="text-base text-slate-400 font-medium mb-12 leading-relaxed">{item.description}</p>
                    <div className="flex items-center justify-between pt-10 border-t border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase">{item.estimatedHours} Hours</span><button onClick={() => setActiveTab('courses')} className="w-12 h-12 bg-slate-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><i className="fas fa-arrow-right"></i></button></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-32 text-center"><i className="fas fa-map-marked-alt text-7xl text-slate-100 mb-10"></i><h3 className="text-3xl font-black text-slate-300">Your journey starts here.</h3></div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in duration-500 space-y-10 pb-20">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 flex items-center gap-10 shadow-sm">
               <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-black border-4 border-white shadow-2xl overflow-hidden">
                 <img src={user?.avatar} alt="" className="w-full h-full object-cover" />
               </div>
               <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-1">{user?.name}</h2>
                  <p className="text-slate-400 font-bold text-lg">{user?.email}</p>
                  <div className="mt-4 flex gap-2">
                    <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">PRO Member</span>
                    <span className="px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">Streak: {user?.streak} Days</span>
                  </div>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[3rem] p-14 space-y-14 shadow-sm relative overflow-hidden">
               <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Bio</h3>
                  <p className="text-slate-700 font-medium text-lg leading-relaxed">{user?.bio || 'No bio provided.'}</p>
               </section>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
                  <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Skill Level</h3>
                    <p className="text-slate-900 font-black text-2xl">{user?.skillLevel || 'Beginner'}</p>
                  </section>
               </div>

               <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Primary Learning Goal</h3>
                  <p className="text-slate-900 font-black text-2xl tracking-tight">{user?.learningGoal}</p>
               </section>

               <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Areas of Interest</h3>
                  <div className="flex flex-wrap gap-4">
                     {user?.areasOfInterest?.map((tag: string) => (
                       <span key={tag} className="px-6 py-2.5 bg-slate-50 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
                         {tag}
                       </span>
                     ))}
                  </div>
               </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};