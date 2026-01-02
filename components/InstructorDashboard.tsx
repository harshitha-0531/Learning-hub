
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { geminiService } from '../services/geminiService';
import { Course, QuizBank, QuizQuestion, QuizResult } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';

interface SubmissionDetail extends QuizResult {
  studentName: string;
  studentAvatar: string;
  answers: Record<string, number>;
  questions: QuizQuestion[];
}

export const InstructorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'analytics' | 'students' | 'revenue'>('analytics');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [courseAnalysis, setCourseAnalysis] = useState<string | null>(null);

  // Mock Data
  const [courses] = useState<Course[]>([
    {
      id: '1',
      title: 'Advanced React Patterns',
      description: 'Master render props, HOCs, and performance tuning.',
      price: 49.99,
      instructorId: user?.id || '',
      studentsCount: 1240,
      rating: 4.8,
      level: 'Advanced',
      materials: [],
      quizBanks: [
        { id: 'q1', title: 'Hooks Deep Dive', difficulty: 'Intermediate', questions: [] },
        { id: 'q2', title: 'Final Certification', difficulty: 'Advanced', questions: [] }
      ]
    },
    {
      id: '2',
      title: 'UI/UX for Developers',
      description: 'Learn design fundamentals to build better apps.',
      price: 29.99,
      instructorId: user?.id || '',
      studentsCount: 850,
      rating: 4.6,
      level: 'Beginner',
      materials: [],
      quizBanks: [{ id: 'q3', title: 'Color Theory Quiz', difficulty: 'Beginner', questions: [] }]
    }
  ]);

  const [submissions] = useState<SubmissionDetail[]>([
    {
      courseId: '1',
      quizBankId: 'q1',
      studentName: 'Alex Learner',
      studentAvatar: 'https://i.pravatar.cc/150?u=alex',
      score: 60,
      date: '2023-11-20',
      answers: { 'q_0': 1, 'q_1': 0, 'q_2': 2 },
      questions: [
        { id: 'q_0', question: 'What is a closure in JavaScript?', options: ['A function inside a function', 'A way to close a browser', 'An API for networking'], correctAnswer: 0, explanation: 'Closures allow a function to access variables from an outer scope even after that scope has finished.', skillTag: 'JavaScript Basics' },
        { id: 'q_1', question: 'How do you define a state in React?', options: ['useState hook', 'let variable', 'global constant'], correctAnswer: 0, explanation: 'React state must be managed via hooks like useState for reactivity.', skillTag: 'React Hooks' },
        { id: 'q_2', question: 'What does SSR stand for?', options: ['Simple Site React', 'Server Side Rendering', 'System State Registry'], correctAnswer: 1, explanation: 'Server Side Rendering renders pages on the server instead of the client.', skillTag: 'Web Performance' }
      ]
    },
    {
      courseId: '1',
      quizBankId: 'q1',
      studentName: 'Sam Chen',
      studentAvatar: 'https://i.pravatar.cc/150?u=sam',
      score: 100,
      date: '2023-11-21',
      answers: { 'q_0': 0, 'q_1': 0, 'q_2': 1 },
      questions: [] // Simplified for mock
    }
  ]);

  const enrollmentData = [
    { name: 'Mon', enrollments: 12 },
    { name: 'Tue', enrollments: 18 },
    { name: 'Wed', enrollments: 15 },
    { name: 'Thu', enrollments: 25 },
    { name: 'Fri', enrollments: 30 },
    { name: 'Sat', enrollments: 45 },
    { name: 'Sun', enrollments: 40 },
  ];

  const performanceData = courses.map(c => ({
    name: c.title,
    avgScore: Math.floor(Math.random() * 30) + 65,
    completions: Math.floor(c.studentsCount * 0.4)
  }));

  const handleAnalyzeCourseMistakes = async (course: Course) => {
    setLoading(true);
    try {
      // Sample data for Gemini analysis
      const failures = submissions.filter(s => s.score < 80).map(s => ({
        student: s.studentName,
        wrongAnswers: Object.entries(s.answers).filter(([id]) => {
           const q = s.questions.find(q => q.id === id);
           return q && s.answers[id] !== q.correctAnswer;
        })
      }));
      const analysis = await geminiService.getCourseErrorAnalysis(course.title, failures);
      setCourseAnalysis(analysis);
    } finally {
      setLoading(false);
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-teal-500/20">I</div>
          <span className="text-xl font-black tracking-tight">Instructor Hub</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarBtn active={activeTab === 'analytics'} onClick={() => {setActiveTab('analytics'); setSelectedCourseId(null); setViewingSubmission(null);}} icon="fa-chart-pie" label="Analytics" />
          <SidebarBtn active={activeTab === 'courses'} onClick={() => {setActiveTab('courses'); setSelectedCourseId(null); setViewingSubmission(null);}} icon="fa-book" label="Course Manager" />
          <SidebarBtn active={activeTab === 'students'} onClick={() => {setActiveTab('students'); setSelectedCourseId(null); setViewingSubmission(null);}} icon="fa-user-graduate" label="Submissions" />
          <SidebarBtn active={activeTab === 'revenue'} onClick={() => {setActiveTab('revenue'); setSelectedCourseId(null); setViewingSubmission(null);}} icon="fa-wallet" label="Earnings" />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 p-2 bg-slate-800/50 rounded-xl">
            <img src={user?.avatar} className="w-10 h-10 rounded-lg border-2 border-teal-500" alt="Instructor" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Premium Tier</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-left p-3 text-rose-400 hover:bg-rose-400/10 rounded-xl text-sm font-bold transition-colors">
            <i className="fas fa-sign-out-alt mr-2"></i> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-50 relative">
        {loading && (
          <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-teal-700 font-black text-xs uppercase tracking-widest">AI analyzing mistakes...</p>
            </div>
          </div>
        )}

        {viewingSubmission ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right duration-500 pb-20">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button onClick={() => setViewingSubmission(null)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-teal-600 transition-all">
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Reviewing: {viewingSubmission.studentName}</h2>
                  <p className="text-sm text-slate-500 font-medium">Attempted on {viewingSubmission.date} • Score: {viewingSubmission.score}%</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${viewingSubmission.score >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {viewingSubmission.score >= 80 ? 'Passed' : 'Needs Review'}
              </div>
            </header>

            <div className="bg-teal-600 rounded-3xl p-6 text-white flex items-center gap-4 shadow-xl shadow-teal-100">
               <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                 <i className="fas fa-wand-magic-sparkles"></i>
               </div>
               <div>
                 <p className="text-xs font-black uppercase tracking-widest opacity-80">AI Pedagogical View</p>
                 <p className="text-sm font-medium">This student struggled with {viewingSubmission.questions.filter(q => viewingSubmission.answers[q.id] !== q.correctAnswer).length} core concepts. Below are the AI-generated explanations and resources.</p>
               </div>
            </div>

            <div className="space-y-6">
              {viewingSubmission.questions.map((q, idx) => {
                const userChoice = viewingSubmission.answers[q.id];
                const isCorrect = userChoice === q.correctAnswer;
                return (
                  <div key={q.id} className={`bg-white p-8 rounded-[2rem] border transition-all ${isCorrect ? 'border-emerald-100 bg-emerald-50/10' : 'border-rose-100 bg-rose-50/10'}`}>
                    <div className="flex justify-between items-start mb-6">
                       <h3 className="text-lg font-black text-slate-800">{idx + 1}. {q.question}</h3>
                       <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                         {isCorrect ? 'Correct' : 'Incorrect'}
                       </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Response</p>
                         <div className={`p-4 rounded-xl border font-bold text-sm ${isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-500 bg-rose-50 text-rose-700'}`}>
                            {q.options[userChoice] || 'No Answer'}
                         </div>
                       </div>
                       {!isCorrect && (
                         <div className="space-y-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correct Answer</p>
                           <div className="p-4 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-700 font-bold text-sm">
                              {q.options[q.correctAnswer]}
                           </div>
                         </div>
                       )}
                    </div>
                    <div className="mt-6 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                       <div className="flex items-center gap-2 mb-2">
                         <i className="fas fa-comment-dots text-teal-600"></i>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Mistake Analysis</p>
                       </div>
                       <p className="text-sm text-slate-600 leading-relaxed italic">{q.explanation}</p>
                       <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">Skill: {q.skillTag}</span>
                          <a href={`https://www.google.com/search?q=${encodeURIComponent(q.skillTag)}`} target="_blank" className="text-[10px] font-black text-slate-400 hover:text-teal-600 transition-colors uppercase">View Resource <i className="fas fa-external-link-alt ml-1"></i></a>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : !selectedCourseId ? (
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-slate-900">
                  {activeTab === 'analytics' && 'Platform Performance'}
                  {activeTab === 'courses' && 'Course Library'}
                  {activeTab === 'students' && 'Submission History'}
                  {activeTab === 'revenue' && 'Revenue Insights'}
                </h1>
                <p className="text-slate-500 font-medium tracking-tight">Managing global learning activity and user engagement</p>
              </div>
              <div className="flex gap-4">
                <button className="bg-white text-slate-700 px-4 py-2 rounded-xl font-bold shadow-sm border border-slate-200 text-sm">
                  <i className="fas fa-calendar-alt mr-2"></i> Last 30 Days
                </button>
              </div>
            </header>

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Total Students" value="2,090" trend="+12.5%" icon="fa-users" color="bg-indigo-500" />
                  <StatCard label="Total Revenue" value="$14,580" trend="+8.2%" icon="fa-dollar-sign" color="bg-teal-500" />
                  <StatCard label="Avg. Course Rating" value="4.7" trend="+0.1" icon="fa-star" color="bg-amber-500" />
                  <StatCard label="Quiz Pass Rate" value="78%" trend="-2%" icon="fa-vial" color="bg-rose-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black mb-6 text-slate-800">Enrollment Trends</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={enrollmentData}>
                          <defs>
                            <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <Tooltip />
                          <Area type="monotone" dataKey="enrollments" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorEnroll)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="text-lg font-black text-slate-800">Student Error Patterns</h3>
                       <button onClick={() => handleAnalyzeCourseMistakes(courses[0])} className="text-xs font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-all">
                         <i className="fas fa-wand-magic-sparkles mr-2"></i>AI ANALYSIS
                       </button>
                    </div>
                    {courseAnalysis ? (
                       <div className="h-64 overflow-y-auto pr-2 custom-scrollbar">
                         <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                           {courseAnalysis}
                         </div>
                       </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                        <i className="fas fa-chart-line text-4xl mb-4 opacity-10"></i>
                        <p className="text-xs font-black uppercase tracking-widest">Select analysis to start</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
                 <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                   <div>
                     <h3 className="text-xl font-black">Submission History</h3>
                     <p className="text-sm text-slate-400 font-medium">Review individual student performance and AI mistake analysis.</p>
                   </div>
                   <input type="text" placeholder="Search student..." className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                 </div>
                 <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <tr>
                       <th className="px-8 py-4">Student</th>
                       <th className="px-8 py-4">Quiz Bank</th>
                       <th className="px-8 py-4 text-center">Score</th>
                       <th className="px-8 py-4">Date</th>
                       <th className="px-8 py-4 text-right">Review</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {submissions.map((sub, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                               <img src={sub.studentAvatar} className="w-8 h-8 rounded-full border border-slate-200" alt="" />
                               <span className="font-bold text-slate-800">{sub.studentName}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                             <p className="text-sm font-bold text-slate-600">Exam Q-01</p>
                             <p className="text-[10px] text-slate-400 uppercase">Intermediate</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                             <span className={`text-lg font-black ${sub.score >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>{sub.score}%</span>
                          </td>
                          <td className="px-8 py-5 text-sm text-slate-400 font-medium">{sub.date}</td>
                          <td className="px-8 py-5 text-right">
                             <button onClick={() => setViewingSubmission(sub)} className="px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                               Explain Mistakes
                             </button>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map(course => (
                  <div key={course.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm group hover:shadow-xl transition-all cursor-pointer" onClick={() => setSelectedCourseId(course.id)}>
                    <div className="h-40 bg-slate-100 relative flex items-center justify-center">
                      <i className="fas fa-graduation-cap text-6xl text-slate-200 group-hover:text-teal-500 transition-colors"></i>
                    </div>
                    <div className="p-6">
                      <h3 className="font-black text-lg text-slate-800 line-clamp-1">{course.title}</h3>
                      <p className="text-sm text-slate-500 mb-6 line-clamp-2">{course.description}</p>
                      <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-teal-600 transition-all">Manage Content</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-right duration-500 pb-20">
            <header className="flex items-center gap-6">
              <button onClick={() => setSelectedCourseId(null)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-teal-600 transition-all">
                <i className="fas fa-arrow-left"></i>
              </button>
              <div>
                <h2 className="text-3xl font-black text-slate-900">{selectedCourse?.title}</h2>
                <p className="text-sm text-slate-500 font-medium">Curriculum Management & Student Insights</p>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-black text-slate-800">Course Quiz Banks</h3>
                      <button className="text-teal-600 font-black text-sm hover:underline"><i className="fas fa-plus mr-1"></i> Add New Bank</button>
                   </div>
                   <div className="space-y-4">
                     {selectedCourse?.quizBanks.map(quiz => (
                       <div key={quiz.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-teal-200 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-all">
                               <i className="fas fa-tasks"></i>
                             </div>
                             <div>
                               <p className="font-bold text-slate-800">{quiz.title}</p>
                               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{quiz.difficulty}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button className="px-4 py-2 bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200">Edit</button>
                            <button className="w-10 h-10 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><i className="fas fa-trash-alt"></i></button>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Course ROI</h4>
                   <div className="inline-block p-8 rounded-full bg-teal-50 text-teal-600 text-3xl font-black mb-4">
                     $43,400
                   </div>
                   <p className="text-sm font-medium text-slate-500">Gross revenue generated from this specific content.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const SidebarBtn: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
    active ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/10' : 'text-slate-400 hover:bg-slate-800'
  }`}>
    <i className={`fas ${icon} w-5`}></i> {label}
  </button>
);

const StatCard: React.FC<{ label: string; value: string; trend: string; icon: string; color: string }> = ({ label, value, trend, icon, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg ${color} shadow-opacity-20`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {trend}
      </span>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
  </div>
);
