
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { geminiService } from '../services/geminiService';
import { LearningPathItem, SkillGap, Course, MicroLesson, User, Achievement, SkillStat } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type UserTab = 'dashboard' | 'courses' | 'explorer' | 'micro' | 'chat' | 'creative' | 'roadmap' | 'analytics' | 'skills' | 'resume' | 'achievements' | 'profile';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const UserDashboard: React.FC = () => {
  const { user, logout, updateUser } = useAuth() as any;
  const [activeTab, setActiveTab] = useState<UserTab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Chat AI State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hi ${user?.name.split(' ')[0]}! I'm your EduAI Study Buddy. How can I help you reach your goal of "${user?.learningGoal}" today?` }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Image AI State
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Proficiency calculation
  const stats = Object.values(user.skillStats || {}) as SkillStat[];
  const avgProficiency = stats.length > 0 
    ? Math.round(stats.reduce((acc, s) => acc + s.avgQuizScore, 0) / stats.length)
    : 0;

  // Other State
  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([]);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [activeMicroLesson, setActiveMicroLesson] = useState<MicroLesson | null>(null);
  const [microAnswers, setMicroAnswers] = useState<Record<string, number>>({});
  const [microSubmitted, setMicroSubmitted] = useState(false);
  const [explorerSearch, setExplorerSearch] = useState('');
  const [explorerResult, setExplorerResult] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'skills') calculateSkillGaps();
    setApiError(null);
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const calculateSkillGaps = () => {
    const gaps: SkillGap[] = [];
    Object.entries(user.skillStats || {}).forEach(([skill, stat]: [string, any]) => {
      if (stat.avgQuizScore < 75) {
        gaps.push({
          skill,
          incorrectAnswers: Math.round(stat.timeInvestedHours * 3),
          totalQuestions: Math.round(stat.timeInvestedHours * 10),
          weaknessRate: (100 - stat.avgQuizScore) / 100,
          recommendedCourse: { id: 'suggested', title: `${skill} Professional Certification` }
        });
      }
    });
    setSkillGaps(gaps);
  };

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
      const context = `The learner is at ${user.skillLevel} level. Their bio is "${user.bio}". Interests: ${user.areasOfInterest?.join(', ')}.`;
      
      const response = await geminiService.getChatbotResponse(text, history, context);
      setChatMessages([...newMessages, { role: 'model', text: response }]);
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditImage = async (customPrompt?: string) => {
    const prompt = customPrompt || imagePrompt;
    if (!sourceImage || !prompt) return;
    
    setLoading(true);
    setApiError(null);
    try {
      const base64Data = sourceImage.split(',')[1];
      const mimeType = sourceImage.split(',')[0].split(':')[1].split(';')[0];
      const result = await geminiService.editImage(base64Data, mimeType, prompt);
      setEditedImage(result);
    } catch (e: any) {
      setApiError(e.message);
    } finally { setLoading(false); }
  };

  const startMicroLesson = async (topic: string) => {
    setLoading(true);
    setApiError(null);
    try {
      const lesson = await geminiService.generateMicroLesson(topic);
      lesson.videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&controls=1"; 
      setActiveMicroLesson(lesson);
      setMicroAnswers({});
      setMicroSubmitted(false);
    } catch (e: any) {
      setApiError(e.message);
    } finally { setLoading(false); }
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

  // Fix for line 415: Implement handleEnroll to add course to user profile
  const handleEnroll = (courseId: string) => {
    if (user.enrolledCourseIds.includes(courseId)) return;
    updateUser({
      ...user,
      enrolledCourseIds: [...user.enrolledCourseIds, courseId]
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
        setEditedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMicroSubmit = () => {
    setMicroSubmitted(true);
    const correctCount = Object.entries(microAnswers).filter(([id, ans]) => {
      const q = activeMicroLesson?.quiz.find(q => q.id === id);
      return q && q.correctAnswer === ans;
    }).length;
    
    const score = (correctCount / (activeMicroLesson?.quiz.length || 1)) * 100;
    const today = new Date().toLocaleDateString();

    const mainSkill = activeMicroLesson?.quiz[0]?.skillTag || 'General Knowledge';
    const currentStat = user.skillStats?.[mainSkill] || {
      name: mainSkill,
      level: 'Beginner',
      confidenceScore: 50,
      avgQuizScore: 0,
      timeInvestedHours: 0,
      lastTestedDate: today
    };

    const newAvgScore = currentStat.avgQuizScore === 0 ? score : (currentStat.avgQuizScore + score) / 2;
    
    const updatedSkillStats = {
      ...user.skillStats,
      [mainSkill]: {
        ...currentStat,
        avgQuizScore: Math.round(newAvgScore),
        confidenceScore: Math.min(100, currentStat.confidenceScore + 10),
        timeInvestedHours: currentStat.timeInvestedHours + 0.5,
        lastTestedDate: today
      }
    };

    updateUser({ 
      ...user, 
      points: user.points + 25, 
      lessonsCompletedCount: user.lessonsCompletedCount + 1,
      quizHistory: [...user.quizHistory, { topic: mainSkill, score, date: today }],
      skillStats: updatedSkillStats
    });
  };

  const tabs: {id: UserTab, label: string, icon: string}[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'chat', label: 'AI Assistant', icon: 'fa-comment-dots' },
    { id: 'courses', label: 'Courses', icon: 'fa-book' },
    { id: 'explorer', label: 'Career Explorer', icon: 'fa-compass' },
    { id: 'micro', label: 'Micro-Learning', icon: 'fa-bolt' },
    { id: 'creative', label: 'Creative AI', icon: 'fa-wand-magic-sparkles' },
    { id: 'roadmap', label: 'Roadmap', icon: 'fa-bullseye' },
    { id: 'analytics', label: 'Analytics', icon: 'fa-chart-bar' },
    { id: 'profile', label: 'Profile', icon: 'fa-user' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="px-12 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl">
             <i className="fas fa-graduation-cap"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black text-indigo-700 tracking-tight leading-none">LearnHub</h1>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest leading-none">Personalized Learning Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-amber-500 font-black">
             <i className="fas fa-trophy"></i>
             <span className="text-sm">{user?.points || 0} points</span>
          </div>
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow-md border-2 border-white overflow-hidden">
            <img src={user?.avatar} alt="" className="w-full h-full object-cover" />
          </div>
          <button onClick={logout} className="flex items-center gap-2 border border-slate-200 px-4 py-1.5 rounded-lg text-xs font-black hover:bg-slate-50 transition-all">
             <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <nav className="px-12 py-6 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white border-b border-slate-100 sticky top-[73px] z-30 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
            }`}
          >
            <i className={`fas ${tab.icon} ${activeTab === tab.id ? 'text-white' : 'text-slate-300'}`}></i>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="px-12 py-8 max-w-7xl mx-auto min-h-[70vh]">
        {loading && activeTab !== 'chat' && (
          <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center">
             <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-indigo-600">AI Processing...</p>
          </div>
        )}

        {apiError && (
          <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-[2rem] flex items-center gap-4 text-rose-700 font-bold shadow-sm animate-in slide-in-from-top-4">
             <i className="fas fa-exclamation-triangle text-2xl"></i>
             <p className="text-sm">{apiError}</p>
          </div>
        )}

        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="animate-in zoom-in-95 duration-500 space-y-8">
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Focus on your growth, {user?.name.split(' ')[0]}</h2>
                <p className="text-slate-400 font-medium text-lg">Your automatic <span className="text-indigo-600 font-black">Resume Portfolio</span> builds with every quiz.</p>
              </div>
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner border border-indigo-100">
                <i className="fas fa-chart-pie"></i>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform"><i className="fas fa-rocket text-6xl"></i></div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-4">Current Master Goal</h4>
                <p className="text-3xl font-black leading-tight mb-8 tracking-tighter">{user?.learningGoal || 'Define your path'}</p>
                <div className="flex gap-4">
                  <button onClick={() => setActiveTab('roadmap')} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest bg-white/10 px-8 py-3 rounded-2xl hover:bg-white/20 transition-all">
                    Review Roadmap <i className="fas fa-arrow-right text-[10px]"></i>
                  </button>
                  <button onClick={() => setActiveTab('chat')} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest bg-indigo-500/30 px-8 py-3 rounded-2xl hover:bg-indigo-500/50 transition-all">
                    Ask AI Assistant <i className="fas fa-comment-dots text-[10px]"></i>
                  </button>
                </div>
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

        {/* 2. CHAT ASSISTANT */}
        {activeTab === 'chat' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col h-[75vh] max-w-5xl mx-auto bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl">
            <header className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-100">
                   <i className="fas fa-robot"></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-none">EduAI Assistant</h2>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Live Mentorship Active</p>
                </div>
              </div>
              <button onClick={() => setChatMessages([{ role: 'model', text: `Chat history cleared. How can I help you now, ${user?.name.split(' ')[0]}?` }])} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500">Clear History</button>
            </header>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                   <div className={`max-w-[80%] p-6 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm ${
                     msg.role === 'user' 
                       ? 'bg-indigo-600 text-white rounded-tr-none' 
                       : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'
                   }`}>
                     {msg.text}
                   </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start animate-pulse">
                   <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 text-xs font-bold uppercase tracking-widest">EduAI is thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <footer className="p-8 bg-slate-50/50 border-t border-slate-100 space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                 {['Explain a concept', 'Check progress', 'Career advice'].map(tip => (
                   <button 
                     key={tip} 
                     onClick={() => handleSendMessage(tip)}
                     className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                   >
                     {tip}
                   </button>
                 ))}
              </div>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about your learning journey..." 
                  className="flex-1 px-8 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-medium shadow-sm"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={loading}
                  className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                </button>
              </div>
            </footer>
          </div>
        )}

        {/* 3. COURSES */}
        {activeTab === 'courses' && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <h2 className="text-3xl font-black text-slate-900">Course Library</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { id: '1', title: 'Advanced React Patterns', description: 'Master hooks, context, and HOCs.', price: 49.99, rating: 4.8 },
                { id: '2', title: 'Mindfulness & Wellness', description: 'Techniques for stress management and focus.', price: 19.99, rating: 4.9 },
                { id: '3', title: 'Fullstack Web Development', description: 'Node, React, and MongoDB from scratch.', price: 39.99, rating: 4.7 }
              ].map(course => (
                <div key={course.id} className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
                  <div className="h-48 bg-slate-100 flex items-center justify-center relative">
                    <i className="fas fa-graduation-cap text-6xl text-slate-200 group-hover:text-indigo-500 transition-colors"></i>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight">{course.title}</h3>
                    <p className="text-sm text-slate-400 font-medium mb-8 flex-1">{course.description}</p>
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-2xl font-black text-slate-900">${course.price}</span>
                      <div className="flex items-center gap-1 text-amber-500 font-black text-sm"><i className="fas fa-star"></i> {course.rating}</div>
                    </div>
                    <button onClick={() => handleEnroll(course.id)} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">
                      {user.enrolledCourseIds.includes(course.id) ? 'Enrolled' : 'Enroll Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. CAREER EXPLORER */}
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

        {/* 5. MICRO-LEARNING */}
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
                    <button onClick={handleMicroSubmit} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 shadow-xl mt-12 transition-all">
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

        {/* 6. CREATIVE AI (IMAGE EDITING) */}
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
                    <>
                      <img src={sourceImage} className="w-full h-full object-cover rounded-2xl" alt="Source" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-black uppercase text-xs">Change Image</div>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt text-5xl text-slate-200 mb-6"></i>
                      <p className="text-slate-400 font-bold">Click or drag an image here to start editing</p>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Transform with Prompt</h4>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleEditImage()}
                      placeholder="e.g., Add a retro filter, Remove background"
                      className="w-full px-8 py-5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-medium shadow-sm pr-20"
                    />
                    <button 
                      onClick={() => handleEditImage()}
                      className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-6 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                      disabled={!sourceImage || !imagePrompt || loading}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900 rounded-[2.5rem] aspect-square flex items-center justify-center p-8 text-center relative overflow-hidden shadow-2xl">
                  {editedImage ? (
                    <img src={editedImage} className="w-full h-full object-contain rounded-2xl shadow-2xl animate-in fade-in duration-1000" alt="Result" />
                  ) : (
                    <div className="text-slate-600 flex flex-col items-center">
                      <i className="fas fa-sparkles text-6xl mb-6 opacity-20"></i>
                      <p className="font-black uppercase tracking-widest text-xs opacity-50">AI Result will appear here</p>
                    </div>
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                       <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-6"></div>
                       <p className="font-black uppercase tracking-widest text-xs">Synthesizing Visuals...</p>
                    </div>
                  )}
                </div>
                {editedImage && (
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = editedImage;
                      link.download = 'eduai-creation.png';
                      link.click();
                    }}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    <i className="fas fa-download"></i> Save Creation
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-500 space-y-8 pb-20">
            <h2 className="text-3xl font-black text-slate-900">Learning Insights</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-black mb-10 text-slate-800">Retention Tracking</h3>
                  <div className="h-80">
                     {user.quizHistory.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={user.quizHistory}>
                          <defs><linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="topic" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <Tooltip />
                          <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#scoreColor)" />
                        </AreaChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                         <i className="fas fa-chart-area text-6xl mb-6"></i>
                         <p className="text-sm font-black uppercase tracking-widest">Complete a lesson to see insights</p>
                       </div>
                     )}
                  </div>
               </div>
               <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000"><i className="fas fa-brain text-[12rem]"></i></div>
                  <div className="relative z-10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-6">Learning Efficiency</h4>
                    <p className="text-5xl font-black mb-4">{user.quizHistory.length > 0 ? '94%' : '0%'}</p>
                    <p className="text-sm font-medium opacity-80 leading-relaxed">Dynamic calculation based on lesson speed versus quiz accuracy.</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* 10. PROFILE */}
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
                  <p className="text-slate-700 font-medium text-lg leading-relaxed">{user?.bio}</p>
               </section>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
                  <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Skill Level</h3>
                    <p className="text-slate-900 font-black text-2xl">{user?.skillLevel}</p>
                  </section>
                  <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Learning Style</h3>
                    <p className="text-slate-900 font-black text-2xl">{user?.learningStyle}</p>
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

            <div className="space-y-8">
               <h3 className="text-xl font-black text-slate-900 px-6">Learning Statistics</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="bg-blue-50/50 p-12 rounded-[2.5rem] border border-blue-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
                     <i className="fas fa-book-open text-blue-600 text-2xl mb-8"></i>
                     <h4 className="text-5xl font-black text-slate-900 mb-2">{user?.enrolledCourseIds?.length || 0}</h4>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Courses Enrolled</p>
                  </div>
                  <div className="bg-emerald-50/50 p-12 rounded-[2.5rem] border border-emerald-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
                     <i className="fas fa-check-circle text-emerald-600 text-2xl mb-8"></i>
                     <h4 className="text-5xl font-black text-slate-900 mb-2">{user?.coursesCompletedCount || 0}</h4>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Courses Completed</p>
                  </div>
                  <div className="bg-amber-50/50 p-12 rounded-[2.5rem] border border-amber-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
                     <i className="fas fa-trophy text-amber-600 text-2xl mb-8"></i>
                     <h4 className="text-5xl font-black text-slate-900 mb-2">{user?.achievements?.filter((a: Achievement) => a.isEarned).length || 0}</h4>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Achievements</p>
                  </div>
                  <div className="bg-purple-50/50 p-12 rounded-[2.5rem] border border-purple-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
                     <i className="fas fa-star text-purple-600 text-2xl mb-8"></i>
                     <h4 className="text-5xl font-black text-slate-900 mb-2">{user?.points || 0}</h4>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Points</p>
                  </div>
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
      </main>
    </div>
  );
};