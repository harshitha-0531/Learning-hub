
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const platformGrowth = [
    { month: 'Jan', users: 120, revenue: 4500 },
    { month: 'Feb', users: 180, revenue: 5200 },
    { month: 'Mar', users: 240, revenue: 6100 },
    { month: 'Apr', users: 310, revenue: 7800 },
    { month: 'May', users: 450, revenue: 9500 },
    { month: 'Jun', users: 580, revenue: 11200 },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
            <i className="fas fa-lock"></i>
          </div>
          <span className="text-xl font-bold text-white">Admin Panel</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <AdminSidebarLink active={true} icon="fa-th-large" label="Dashboard" />
          <AdminSidebarLink active={false} icon="fa-users" label="User Directory" />
          <AdminSidebarLink active={false} icon="fa-graduation-cap" label="Courses" />
          <AdminSidebarLink active={false} icon="fa-shield-halved" label="Permissions" />
          <AdminSidebarLink active={false} icon="fa-cog" label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 p-2">
            <img src={user?.avatar} className="w-10 h-10 rounded-full bg-slate-800" alt="Admin Avatar" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-sm font-medium">
            <i className="fas fa-power-off"></i>
            Exit Admin Session
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Platform Overview</h1>
            <p className="text-slate-500">Monitoring global learning activity and user engagement</p>
          </div>
          <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-2">
            <i className="fas fa-download"></i>
            Export Report
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <AdminStatCard label="Total Learners" value="12,482" growth="+12%" icon="fa-users" color="text-indigo-600" />
          <AdminStatCard label="Course Completions" value="4,821" growth="+8%" icon="fa-certificate" color="text-emerald-600" />
          <AdminStatCard label="Avg. Daily Time" value="48m" growth="+5%" icon="fa-stopwatch" color="text-amber-600" />
          <AdminStatCard label="Monthly Revenue" value="$42.5k" growth="+18%" icon="fa-credit-card" color="text-rose-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black mb-6">User Acquisition Trends</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={platformGrowth}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black mb-6">Popular Learning Goals</h3>
            <div className="space-y-6">
              <ProgressItem label="Fullstack Developer" percentage={45} color="bg-indigo-500" />
              <ProgressItem label="Data Scientist" percentage={28} color="bg-emerald-500" />
              <ProgressItem label="Cloud Architect" percentage={18} color="bg-amber-500" />
              <ProgressItem label="Cybersecurity" percentage={9} color="bg-rose-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black">Recent Activity</h3>
            <button className="text-sm font-bold text-indigo-600 hover:underline">View All</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <TableRow user="Alex Johnson" action="Completed Quiz (92%)" time="2 mins ago" status="Success" />
              <TableRow user="Maria Garcia" action="New Subscription" time="15 mins ago" status="Success" />
              <TableRow user="Sam Chen" action="Reported Error" time="1 hour ago" status="Review" />
              <TableRow user="John Doe" action="Account Deleted" time="3 hours ago" status="Deleted" />
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

const AdminSidebarLink: React.FC<{ active: boolean; icon: string; label: string }> = ({ active, icon, label }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
    active ? 'bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500' : 'hover:bg-slate-800'
  }`}>
    <i className={`fas ${icon} w-5`}></i>
    {label}
  </div>
);

const AdminStatCard: React.FC<{ label: string; value: string; growth: string; icon: string; color: string }> = ({ label, value, growth, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${color}`}>
        <i className={`fas ${icon} text-lg`}></i>
      </div>
      <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">{growth}</span>
    </div>
    <p className="text-sm font-bold text-slate-400 uppercase mb-1">{label}</p>
    <h4 className="text-2xl font-black text-slate-900">{value}</h4>
  </div>
);

const ProgressItem: React.FC<{ label: string; percentage: number; color: string }> = ({ label, percentage, color }) => (
  <div>
    <div className="flex justify-between items-center text-sm font-bold mb-2">
      <span className="text-slate-600">{label}</span>
      <span className="text-slate-400">{percentage}%</span>
    </div>
    <div className="w-full bg-slate-100 h-2 rounded-full">
      <div className={`${color} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);

const TableRow: React.FC<{ user: string; action: string; time: string; status: string }> = ({ user, action, time, status }) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="px-6 py-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-200"></div>
      <span className="font-bold text-sm text-slate-700">{user}</span>
    </td>
    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{action}</td>
    <td className="px-6 py-4 text-sm text-slate-400">{time}</td>
    <td className="px-6 py-4">
      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
        status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 
        status === 'Review' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
      }`}>{status}</span>
    </td>
  </tr>
);
