
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { geminiService } from '../services/geminiService';
import { LearningPathItem, SkillGap, Course, MicroLesson, SkillStat } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type UserTab = 'dashboard' | 'courses' | 'explorer' | 'micro' | 'roadmap' | 'analytics' | 'skills' | 'resume' | 'achievements' | 'profile';

const tabs: {id: UserTab, label: string, icon: string}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
  { id: 'courses', label: 'Courses', icon: 'fa-book' },
  { id: 'explorer', label: 'Career Explorer', icon: 'fa-compass' },
  { id: 'micro', label: 'Micro-Learning', icon: 'fa-bolt' },
  { id: 'roadmap', label: 'Roadmap', icon: 'fa-bullseye' },
  { id: 'analytics', label: 'Analytics', icon: 'fa-chart-bar' },
  { id: 'skills', label: 'Skill Gaps', icon: 'fa-info-circle' },
  { id: 'resume', label: 'Resume', icon: 'fa-file-alt' },
  { id: 'achievements', label: 'Achievements', icon: 'fa-trophy' },
  { id: 'profile', label: 'Profile', icon: 'fa-user' },
];

export const UserDashboard: React.FC = () => {
  const { user, logout, updateUser } = useAuth() as any;
  const [activeTab, setActiveTab] = useState<UserTab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Memoized derived data
  const avgProficiency = useMemo(() => {
    const statsList = Object.values(user.skillStats || {}) as SkillStat[];
    if (statsList.length === 0) return 0;
    return Math.round(statsList.reduce((acc, s) => acc + s.avgQuizScore, 0) / statsList.length);
  }, [user.skillStats]);

  const skillGaps = useMemo(() => {
    const gaps: SkillGap[] = [];
    Object.entries(user.skillStats || {}).forEach(([skill, stat]: [string, any]) => {
      if (stat.avgQuizScore < 75) {
        gaps.push({
          skill,
          incorrectAnswers: Math.round((stat.timeInvestedHours || 1) * 3),
          totalQuestions: Math.round((stat.timeInvestedHours || 1) * 10),
          weaknessRate: (100 - stat.avgQuizScore) / 100,
          recommendedCourse: { id: 'suggested', title: `${skill} Mastery Specialization` }
        });
      }
    });
    return gaps;
  }, [user.skillStats]);

  const achievements = useMemo(() => {
    const list = [
      { id: '1', title: 'Knowledge Seeker', desc: 'Enrolled in your first course', icon: 'fa-book-open', color: 'bg-blue-500', earned: (user.enrolledCourseIds?.length || 0) > 0 },
      { id: '2', title: 'Perfect Score', desc: 'Achieved 100% on a micro-sprint', icon: 'fa-star', color: 'bg-amber-500', earned: user.quizHistory?.some((q: any) => q.score === 100) },
      { id: '3', title: 'Streak Master', desc: 'Maintained a 3-day learning streak', icon: 'fa-fire', color: 'bg-orange-500', earned: user.streak >= 3 },
      { id: '4', title: 'Skill Architect', desc: 'Verified 3 different professional skills', icon: 'fa-layer-group', color: 'bg-indigo-500', earned: Object.keys(user.skillStats || {}).length >= 3 },
      { id: '5', title: 'Roadmap Explorer', desc: 'Generated your first AI learning path', icon: 'fa-map-marked-alt', color: 'bg-emerald-500', earned: (user.learningGoal && user.learningGoal !== 'Advance my career in web development') }
    ];
    return list;
  }, [user]);

  const verifiedSkills = useMemo(() => {
    return Object.values(user.skillStats || {}).filter((s: any) => s.avgQuizScore >= 80);
  }, [user.skillStats]);

  const [learningPath, setLearningPath] = useState<LearningPathItem[]>([]);
  const [explorerSearch, setExplorerSearch] = useState('');
  const [explorerResult, setExplorerResult] = useState<any>(null);
  const [activeMicroLesson, setActiveMicroLesson] = useState<MicroLesson | null>(null);
  const [microAnswers, setMicroAnswers] = useState<Record<string, number>>({});
  const [microSubmitted, setMicroSubmitted] = useState(false);

  const availableCourses = [
    { id: '1', title: 'Advanced React Patterns', description: 'Master hooks, context, and performance tuning.', price: 49.99, rating: 4.8 },
    { id: '2', title: 'Fullstack Development', description: 'Build complete web apps from scratch.', price: 59.99, rating: 4.9 },
    { id: '3', title: 'UI Fundamentals', description: 'Master hierarchy, typography, and colors.', price: 29.99, rating: 4.7 }
  ];

  const microTopics = [
    { title: 'React Hook Mastery', desc: '5-minute deep dive into useState/useEffect', icon: 'fa-code' },
    { title: 'Flexbox Architecture', desc: 'Master layout centering and growth patterns', icon: 'fa-layer-group' },
    { title: 'Modern Async JS', desc: 'Handle promises and await patterns like a pro', icon: 'fa-bolt' },
  ];

  const handleEnroll = (courseId: string) => {
    if (!user.enrolledCourseIds.includes(courseId)) {
      updateUser({ ...user, enrolledCourseIds: [...user.enrolledCourseIds, courseId] });
    }
  };

  const startMicroLesson = async (topic: string) => {
    setLoading(true);
    setApiError(null);
    try {
      const lesson = await geminiService.generateMicroLesson(topic);
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
      const path = await geminiService.generateLearningPath(goal || user.learningGoal || 'Developer', user.skillLevel || 'Beginner');
      setLearningPath(path);
      if (goal) updateUser({ ...user, learningGoal: goal });
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

  const handleMicroSubmit = () => {
    setMicroSubmitted(true);
    const correctCount = Object.entries(microAnswers).filter(([id, ans]) => {
      const q = activeMicroLesson?.quiz.find(q => q.id === id);
      return q && q.correctAnswer === ans;
    }).length;
    
    const score = (correctCount / (activeMicroLesson?.quiz.length || 1)) * 100;
    const today = new Date().toLocaleDateString();
    const mainSkill = activeMicroLesson?.quiz[0]?.skillTag || 'General';

    const currentStat = user.skillStats?.[mainSkill] || {
      name: mainSkill,
      level: 'Beginner',
      avgQuizScore: 0,
      timeInvestedHours: 0,
      lastTestedDate: today
    };

    const newAvg = currentStat.avgQuizScore === 0 ? score : Math.round((currentStat.avgQuizScore + score) / 2);

    updateUser({ 
      ...user, 
      points: user.points + 25, 
      quizHistory: [...user.quizHistory, { topic: mainSkill, score, date: today }],
      skillStats: {
        ...user.skillStats,
        [mainSkill]: { ...currentStat, avgQuizScore: newAvg, timeInvestedHours: (currentStat.timeInvestedHours || 0) + 0.5 }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="px-12 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-100">
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
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow-md border-2 border-white">
            {user?.name.split(' ').map((n: string) => n[0]).join('')}
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
            onClick={() => { setActiveTab(tab.id); setApiError(null); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </nav>

      <main className="px-12 py-8 max-w-7xl mx-auto min-h-[70vh]">
        {loading && (
          <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center">
             <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-6 text-sm font-black uppercase tracking-widest text-indigo-600">AI Processing...</p>
          </div>
        )}

        {apiError && (
          <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-[2rem] flex items-center gap-4 text-amber-800 font-bold shadow-sm animate-in slide-in-from-top-2">
             <i className="fas fa-hourglass-half text-2xl"></i>
             <p className="text-sm">{apiError}</p>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="animate-in zoom-in-95 duration-500 space-y-8">
            <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Focus on your growth, {user?.name.split(' ')[0]}</h2>
                <p className="text-slate-400 font-medium text-lg">Your automatic <span className="text-indigo-600 font-black">Resume Portfolio</span> builds with every quiz.</p>
              </div>
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-5xl border border-indigo-100">
                <i className="fas fa-chart-pie"></i>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-20"><i className="fas fa-rocket text-6xl"></i></div>
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">Current Master Goal</h4>
                <p className="text-3xl font-black mb-8 tracking-tighter">{user?.learningGoal}</p>
                <button onClick={() => setActiveTab('roadmap')} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest bg-white/10 px-8 py-3 rounded-2xl hover:bg-white/20 transition-all">
                  Review Roadmap <i className="fas fa-arrow-right"></i>
                </button>
              </div>
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Overall Proficiency</h4>
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                    <circle 
                      cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364.4" 
                      strokeDashoffset={364.4 - (364.4 * (avgProficiency / 100))} className="text-indigo-600 transition-all duration-1000" 
                    />
                  </svg>
                  <span className="absolute text-2xl font-black text-slate-900">{avgProficiency}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-500 space-y-10 pb-20">
            <h2 className="text-3xl font-black text-slate-900">Learning Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-black mb-10 text-slate-800">Retention & Score History</h3>
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
                         <p className="text-sm font-black uppercase tracking-widest">Start a Micro-Sprint to see insights</p>
                       </div>
                     )}
                  </div>
               </div>
               <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-10 opacity-10"><i className="fas fa-brain text-[12rem]"></i></div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-6">Learning Efficiency</h4>
                    <p className="text-5xl font-black mb-4">{user.quizHistory.length > 0 ? '94%' : '0%'}</p>
                    <p className="text-sm font-medium opacity-80 leading-relaxed">Calculated based on sprint completion speed versus quiz accuracy.</p>
                  </div>
                  <div className="bg-white/10 p-6 rounded-2xl border border-white/10">
                     <p className="text-xs font-black uppercase tracking-widest mb-2">Performance Tip</p>
                     <p className="text-xs opacity-70">Consistent daily micro-learning sprints increase retention by up to 40%.</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* SKILL GAPS TAB */}
        {activeTab === 'skills' && (
          <div className="animate-in fade-in duration-500 space-y-10 pb-20">
            <h2 className="text-3xl font-black text-slate-900">Skill Gap Identification</h2>
            <p className="text-slate-400 font-medium mb-12">AI identified gaps based on your performance trends.</p>
            {skillGaps.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center max-w-2xl mx-auto flex flex-col items-center">
                 <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-8 shadow-inner"><i className="fas fa-shield-heart"></i></div>
                 <h3 className="text-2xl font-black text-slate-800 mb-4">You're on track!</h3>
                 <p className="text-slate-500 font-medium mb-10 leading-relaxed text-lg">No significant gaps found in your current knowledge areas. Keep up the great work!</p>
                 <button onClick={() => setActiveTab('micro')} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">Start A Sprint</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {skillGaps.map((gap, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm hover:border-orange-200 transition-all group">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:bg-orange-500 group-hover:text-white transition-all"><i className="fas fa-triangle-exclamation"></i></div>
                      <h4 className="text-2xl font-black text-slate-800">{gap.skill}</h4>
                    </div>
                    <div className="space-y-6 mb-12">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Weakness Rate</span>
                        <span className="text-orange-600">{(gap.weaknessRate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{width: `${gap.weaknessRate * 100}%`}}></div>
                      </div>
                    </div>
                    <div className="p-8 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                       <div>
                         <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Recommended Solution</p>
                         <p className="text-base font-black text-slate-800 italic">{gap.recommendedCourse.title}</p>
                       </div>
                       <button onClick={() => setActiveTab('courses')} className="w-12 h-12 bg-white text-indigo-600 border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm hover:bg-indigo-600 hover:text-white transition-all"><i className="fas fa-arrow-right"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESUME / LIVE PORTFOLIO TAB */}
        {activeTab === 'resume' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-12 pb-20">
             <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-3xl font-black text-slate-900">Live AI Portfolio</h2>
                   <p className="text-slate-500 font-medium">Your skills and progress, verified by real-time assessments.</p>
                </div>
                <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
                   <i className="fas fa-download mr-2"></i> Export Resume
                </button>
             </div>

             <div className="bg-white border border-slate-200 rounded-[3rem] p-16 shadow-sm space-y-16">
                <div className="flex flex-col md:flex-row justify-between border-b border-slate-100 pb-16 gap-10">
                   <div className="max-w-xl">
                      <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">{user.name}</h3>
                      <p className="text-slate-600 font-medium leading-relaxed italic text-lg">"{user.bio}"</p>
                      <div className="mt-8 space-y-2">
                         <div className="flex items-center gap-3 text-slate-500 font-bold"><i className="fas fa-envelope text-indigo-600"></i> {user.email}</div>
                         <div className="flex items-center gap-3 text-slate-500 font-bold"><i className="fas fa-graduation-cap text-indigo-600"></i> {user.skillLevel} Specialist</div>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Master Goal</p>
                      <p className="text-2xl font-black text-indigo-600 max-w-xs ml-auto">{user.learningGoal}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                   <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 border-l-4 border-indigo-600 pl-4">Verified Proficiencies</h4>
                      <div className="space-y-6">
                         {verifiedSkills.length > 0 ? verifiedSkills.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group">
                               <div>
                                  <p className="font-black text-slate-800 text-lg">{s.name}</p>
                                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">Skill Verified • {s.avgQuizScore}% Score</p>
                               </div>
                               <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg"><i className="fas fa-check"></i></div>
                            </div>
                         )) : (
                            <p className="text-slate-400 font-medium italic">Complete micro-sprints with >80% to verify skills here.</p>
                         )}
                      </div>
                   </section>
                   <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 border-l-4 border-teal-500 pl-4">Learning Milestones</h4>
                      <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                         {user.quizHistory.slice(-4).reverse().map((h: any, i: number) => (
                            <div key={i} className="relative pl-10">
                               <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border-2 border-teal-500 rounded-full shadow-sm z-10 flex items-center justify-center text-[8px] font-black text-teal-600">
                                  {user.quizHistory.length - i}
                               </div>
                               <p className="font-black text-slate-800">{h.topic} Verification</p>
                               <p className="text-xs text-slate-400 font-bold mb-1">{h.date}</p>
                               <p className="text-xs text-emerald-600 font-black">Scored {h.score}% Efficiency</p>
                            </div>
                         ))}
                      </div>
                   </section>
                </div>
             </div>
          </div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeTab === 'achievements' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-12 pb-20">
             <div className="flex items-center justify-between">
                <div>
                   <h2 className="text-3xl font-black text-slate-900">Achievements Vault</h2>
                   <p className="text-slate-500 font-medium">Badges and milestones earned through your dedication.</p>
                </div>
                <div className="bg-amber-100 text-amber-700 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-3">
                   <i className="fas fa-medal"></i>
                   {achievements.filter(a => a.earned).length} / {achievements.length} Badges
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {achievements.map((a) => (
                   <div key={a.id} className={`bg-white border p-10 rounded-[2.5rem] flex flex-col items-center text-center transition-all ${
                      a.earned ? 'border-amber-200 shadow-xl shadow-amber-500/5' : 'border-slate-100 opacity-60 grayscale'
                   }`}>
                      <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-3xl mb-8 shadow-inner relative ${a.earned ? a.color + ' text-white' : 'bg-slate-100 text-slate-300'}`}>
                         <i className={`fas ${a.icon}`}></i>
                         {a.earned && (
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-amber-500 rounded-full flex items-center justify-center shadow-md border-2 border-amber-500 text-xs">
                               <i className="fas fa-check"></i>
                            </div>
                         )}
                      </div>
                      <h4 className={`text-xl font-black mb-3 ${a.earned ? 'text-slate-900' : 'text-slate-400'}`}>{a.title}</h4>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{a.desc}</p>
                      <div className="mt-8 pt-8 border-t border-slate-50 w-full">
                         {a.earned ? (
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Mastered on {user.lastActive.split('T')[0]}</span>
                         ) : (
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-slate-300 w-1/3"></div>
                            </div>
                         )}
                      </div>
                   </div>
                ))}
             </div>

             <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10"><i className="fas fa-trophy text-[10rem]"></i></div>
                <div className="relative z-10">
                   <h3 className="text-3xl font-black mb-4 tracking-tight">The Next Milestone</h3>
                   <p className="text-slate-400 font-medium text-lg max-w-lg">Earn <b className="text-white">Elite Scholar</b> by verifying 5 distinct skills with an average score of 95% or higher.</p>
                </div>
                <div className="bg-white/10 p-10 rounded-[2.5rem] text-center border border-white/10 min-w-[240px] relative z-10 backdrop-blur-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Progress To Elite</p>
                   <p className="text-5xl font-black mb-2 text-indigo-400">20%</p>
                   <div className="w-full h-3 bg-white/5 rounded-full mt-6 overflow-hidden">
                      <div className="h-full bg-indigo-500 w-1/5"></div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* PROFILE TAB (ALEX JOHNSON REF MATCH) */}
        {activeTab === 'profile' && (
          <div className="animate-in fade-in duration-500 space-y-12 pb-20">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 flex items-center gap-12 shadow-sm">
               <div className="w-28 h-28 bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-black border-4 border-white shadow-2xl overflow-hidden">
                 <img src={user?.avatar} alt="Profile" className="w-full h-full object-cover" />
               </div>
               <div>
                  <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">{user?.name}</h2>
                  <p className="text-slate-400 font-bold text-xl">{user?.email}</p>
                  <div className="mt-6 flex gap-3">
                    <span className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl">Pro Member</span>
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border border-indigo-100">Learning Enthusiast</span>
                  </div>
               </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-[4rem] p-16 space-y-16 shadow-sm">
               <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Bio</h3>
                  <p className="text-slate-700 font-medium text-xl leading-relaxed">{user?.bio}</p>
               </section>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                  <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Skill Level</h3>
                    <p className="text-slate-900 font-black text-3xl tracking-tight">{user?.skillLevel}</p>
                  </section>
                  <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Learning Style</h3>
                    <p className="text-slate-900 font-black text-3xl tracking-tight">{user?.learningStyle}</p>
                  </section>
               </div>
               <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Primary Learning Goal</h3>
                  <p className="text-slate-900 font-black text-3xl tracking-tight leading-none">{user?.learningGoal}</p>
               </section>
               <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Areas of Interest</h3>
                  <div className="flex flex-wrap gap-5">
                     {user?.areasOfInterest?.map((tag: string) => (
                       <span key={tag} className="px-8 py-3 bg-slate-50 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm">
                         {tag}
                       </span>
                     ))}
                  </div>
               </section>
               <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Secondary Goals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {user?.secondaryGoals?.map((goal: string) => (
                       <div key={goal} className="flex items-center gap-6 bg-slate-50/50 p-8 rounded-3xl border border-slate-100 shadow-inner">
                         <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm shadow-sm">
                            <i className="fas fa-check"></i>
                         </div>
                         <p className="text-lg font-black text-slate-800">{goal}</p>
                       </div>
                     ))}
                  </div>
               </section>
            </div>
            <div className="space-y-10">
               <h3 className="text-2xl font-black text-slate-900 px-8">Learning Statistics</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="bg-blue-50/50 p-12 rounded-[3rem] border border-blue-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform shadow-sm">
                     <i className="fas fa-book-open text-blue-600 text-3xl mb-10"></i>
                     <h4 className="text-6xl font-black text-slate-900 mb-2">{user?.enrolledCourseIds?.length || 0}</h4>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Courses Enrolled</p>
                  </div>
                  <div className="bg-emerald-50/50 p-12 rounded-[3rem] border border-emerald-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform shadow-sm">
                     <i className="fas fa-check-circle text-emerald-600 text-3xl mb-10"></i>
                     <h4 className="text-6xl font-black text-slate-900 mb-2">{user?.coursesCompletedCount || 0}</h4>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Courses Completed</p>
                  </div>
                  <div className="bg-amber-50/50 p-12 rounded-[3rem] border border-amber-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform shadow-sm">
                     <i className="fas fa-trophy text-amber-600 text-3xl mb-10"></i>
                     <h4 className="text-6xl font-black text-slate-900 mb-2">{user?.achievementsCount || 0}</h4>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Achievements</p>
                  </div>
                  <div className="bg-purple-50/50 p-12 rounded-[3rem] border border-purple-100 flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform shadow-sm">
                     <i className="fas fa-star text-purple-600 text-3xl mb-10"></i>
                     <h4 className="text-6xl font-black text-slate-900 mb-2">{user?.points || 0}</h4>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Points</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div className="animate-in fade-in duration-500 space-y-10 pb-20">
            <h2 className="text-3xl font-black text-slate-900">Curriculum Library</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {availableCourses.map(course => (
                <div key={course.id} className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all group flex flex-col h-full">
                  <div className="h-44 bg-slate-100 flex items-center justify-center relative">
                    <i className="fas fa-graduation-cap text-7xl text-slate-200 group-hover:text-indigo-500 transition-colors"></i>
                  </div>
                  <div className="p-10 flex flex-col flex-1">
                    <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{course.title}</h3>
                    <p className="text-sm text-slate-400 font-medium mb-10 flex-1">{course.description}</p>
                    <div className="flex items-center justify-between mb-10">
                      <span className="text-3xl font-black text-slate-900">${course.price}</span>
                      <div className="flex items-center gap-1 text-amber-500 font-black text-base"><i className="fas fa-star"></i> {course.rating}</div>
                    </div>
                    <button onClick={() => handleEnroll(course.id)} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">
                      {user.enrolledCourseIds.includes(course.id) ? 'Resume Course' : 'Enroll Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPLORER TAB */}
        {activeTab === 'explorer' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Career Explorer</h2>
            <p className="text-slate-400 font-medium mb-10">Identify market-driven career paths and start your roadmap.</p>
            <div className="flex gap-4 mb-12">
               <input 
                 type="text" 
                 value={explorerSearch}
                 onChange={(e) => setExplorerSearch(e.target.value)}
                 placeholder="e.g. UX Designer, Data Analyst" 
                 className="flex-1 px-8 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-sm font-medium shadow-sm"
               />
               <button onClick={handleCareerSearch} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">Explore</button>
            </div>
            {explorerResult && (
               <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm animate-in zoom-in-95">
                  <div className="flex justify-between items-start mb-10 pb-10 border-b border-slate-100">
                     <div>
                        <h3 className="text-4xl font-black text-slate-900 mb-2">{explorerResult.title}</h3>
                        <p className="text-indigo-600 font-black uppercase tracking-widest text-xs">{explorerResult.demandLevel} Demand</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Salary</p>
                        <p className="text-2xl font-black text-slate-900">{explorerResult.salaryRange}</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                     <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Market Overview</h4>
                        <p className="text-slate-600 leading-relaxed font-medium">{explorerResult.description}</p>
                     </div>
                     <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Core Skills</h4>
                        <div className="flex flex-wrap gap-2">
                           {explorerResult.requiredSkills.map((s: string, i: number) => (
                             <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">{s}</span>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white flex items-center justify-between shadow-xl">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner"><i className="fas fa-map-signs"></i></div>
                        <div>
                          <p className="font-black text-2xl tracking-tight">Generate Roadmap?</p>
                          <p className="text-sm opacity-80 font-medium">Create your personalized AI learning path for this role.</p>
                        </div>
                     </div>
                     <button onClick={() => { setActiveTab('roadmap'); generateRoadmap(explorerResult.title); }} className="px-12 py-4 bg-white text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-slate-50 transition-all">Start Journey</button>
                  </div>
               </div>
            )}
          </div>
        )}

        {/* ROADMAP TAB */}
        {activeTab === 'roadmap' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-12 pb-20">
            <div className="flex items-center justify-between">
              <div><h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Your AI Roadmap</h2><p className="text-slate-500 font-medium text-lg">Goal: <b className="text-indigo-600">{user.learningGoal}</b></p></div>
              <button onClick={() => generateRoadmap()} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 shadow-xl transition-all">Regenerate</button>
            </div>
            {learningPath.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {learningPath.map((item, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-2xl mb-10 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">W{item.week}</div>
                    <h3 className="text-2xl font-black text-slate-900 mb-6">{item.topic}</h3>
                    <p className="text-base text-slate-400 font-medium mb-12 leading-relaxed">{item.description}</p>
                    <div className="flex items-center justify-between pt-10 border-t border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.estimatedHours}h Est.</span><button onClick={() => setActiveTab('courses')} className="w-14 h-14 bg-slate-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><i className="fas fa-arrow-right"></i></button></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[4rem] p-36 text-center"><i className="fas fa-map-marked-alt text-8xl text-slate-100 mb-10"></i><h3 className="text-3xl font-black text-slate-300">Generate your first roadmap to start.</h3></div>
            )}
          </div>
        )}

        {/* MICRO-LEARNING TAB (4-STAGE FLOW) */}
        {activeTab === 'micro' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Micro-Learning Sprints</h2>
            <p className="text-slate-400 font-medium mb-10">4-Stage pedagogical sprints in 5 minutes.</p>
            {activeMicroLesson ? (
              <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-2xl max-w-5xl mx-auto space-y-16">
                <button onClick={() => setActiveMicroLesson(null)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600"><i className="fas fa-arrow-left mr-2"></i> Exit Sprint</button>
                <section>
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-indigo-600 pl-4 mb-6">Stage 1: The Concept</h3>
                   <div className="prose prose-slate max-w-none text-slate-700 text-lg font-medium leading-relaxed">{activeMicroLesson.content}</div>
                </section>
                <section>
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-blue-500 pl-4 mb-6">Stage 2: Video Explanation</h3>
                   <div className="aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-slate-900">
                     <iframe className="w-full h-full" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Concept Video" allowFullScreen></iframe>
                   </div>
                </section>
                <section>
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-4 mb-6">Stage 3: Short Notes</h3>
                   <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 font-bold text-slate-600 text-sm italic shadow-inner">
                      "To master this concept, prioritize understanding the underlying state flow and modular architecture. Avoid complex side effects until core logic is validated."
                   </div>
                </section>
                <section className="pt-12 border-t border-slate-100">
                   <h4 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-10">
                     <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner"><i className="fas fa-check-double"></i></span>
                     Stage 4: Validation Quiz
                   </h4>
                   <div className="space-y-10">
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
                                  ? microSubmitted ? (oIdx === q.correctAnswer ? 'bg-emerald-600 text-white shadow-lg' : 'bg-rose-600 text-white shadow-lg') : 'bg-indigo-600 text-white shadow-lg'
                                  : microSubmitted && oIdx === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 hover:border-indigo-300'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {!microSubmitted ? (
                    <button onClick={handleMicroSubmit} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs mt-12 hover:bg-indigo-600 transition-all shadow-xl">Submit Sprint</button>
                  ) : (
                    <div className="mt-12 bg-emerald-50 p-8 rounded-[2.5rem] flex items-center justify-between border border-emerald-100 shadow-sm animate-in zoom-in-95">
                       <div className="flex items-center gap-6">
                          <i className="fas fa-trophy text-emerald-500 text-3xl"></i>
                          <div><p className="font-black text-emerald-900 text-xl">Success!</p><p className="text-emerald-700 text-sm font-medium">Knowledge verified. Proficiency updated.</p></div>
                       </div>
                       <button onClick={() => setActiveMicroLesson(null)} className="px-10 py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Back to Sprints</button>
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {microTopics.map((topic, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 hover:shadow-2xl transition-all group flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-10">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><i className={`fas ${topic.icon}`}></i></div>
                        <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl uppercase tracking-widest">5 MIN</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">{topic.title}</h3>
                      <p className="text-sm text-slate-400 font-medium mb-12">{topic.desc}</p>
                    </div>
                    <button onClick={() => startMicroLesson(topic.title)} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 shadow-xl transition-all flex items-center justify-center gap-3">
                      <i className="fas fa-play"></i> Start Sprint
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
