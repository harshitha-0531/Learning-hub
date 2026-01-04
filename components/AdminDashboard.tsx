
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { User } from '../types';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const db = localStorage.getItem('eduai_users_db');
    if (db) setUsers(JSON.parse(db));
  }, []);

  const platformGrowth = [
    { month: 'Jan', users: 120, aiRequests: 4500 },
    { month: 'Feb', users: 180, aiRequests: 5200 },
    { month: 'Mar', users: 240, aiRequests: 6100 },
    { month: 'Apr', users: 310, aiRequests: 7800 },
    { month: 'May', users: 450, aiRequests: 9500 },
    { month: 'Jun', users: 580, aiRequests: 11200 },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300">
        <div className="p-8 border-b border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg">
            <i className="fas fa-shield-check text-xl"></i>
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tighter block">EduAdmin</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">System Control</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <AdminSidebarLink active={true} icon="fa-th-large" label="Overview" />
          <AdminSidebarLink active={false} icon="fa-users-gear" label="Manage Users" />
          <AdminSidebarLink active={false} icon="fa-server" label="System Health" />
          <AdminSidebarLink active={false} icon="fa-microchip-ai" label="AI Tokens Usage" />
          <AdminSidebarLink active={false} icon="fa-flag" label="Moderation" />
          <AdminSidebarLink active={false} icon="fa-file-invoice-dollar" label="Billing & Plans" />
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-2xl">
            <img src={user?.avatar} className="w-10 h-10 rounded-xl bg-slate-800 object-cover" alt="Admin Avatar" />
            <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate">{user?.name}</p>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Root Admin</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-3 py-3 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-all text-xs font-black uppercase tracking-widest">
            <i className="fas fa-power-off"></i>
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Terminal</h1>
            <p className="text-slate-500 font-medium">Global platform state and intelligence metrics.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border border-emerald-100">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               AI API: OPERATIONAL
            </div>
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3">
              <i className="fas fa-plus"></i>
              System Broadcast
            </button>
          </div>
        </header>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <AdminStatCard label="Total Learners" value={users.length.toLocaleString()} growth="+14%" icon="fa-users" color="text-indigo-600" />
          <AdminStatCard label="AI Tokens (24h)" value="1.2M" growth="+22%" icon="fa-bolt" color="text-amber-600" />
          <AdminStatCard label="Server Latency" value="142ms" growth="-4%" icon="fa-microchip" color="text-emerald-600" />
          <AdminStatCard label="Monthly MRR" value="$52.8k" growth="+12%" icon="fa-chart-line-up" color="text-rose-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
          {/* Charts */}
          <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-slate-900">Platform Traffic vs AI Usage</h3>
              <select className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none">
                <option>Last 30 Days</option>
                <option>Last Quarter</option>
              </select>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={platformGrowth}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="aiRequests" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRequests)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions / Alerts */}
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10"><i className="fas fa-triangle-exclamation text-8xl"></i></div>
            <h3 className="text-xl font-black mb-8 relative z-10">Security Alerts</h3>
            <div className="space-y-6 relative z-10">
              <AlertItem type="critical" label="Brute Force Attempt" time="2m ago" />
              <AlertItem type="warning" label="High API Latency (US-East)" time="14m ago" />
              <AlertItem type="info" label="New Instructor Pending" time="1h ago" />
              <AlertItem type="info" label="Database Backup Success" time="4h ago" />
            </div>
            <button className="w-full mt-12 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
              Open Security Log
            </button>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-10 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900">User Management</h3>
              <p className="text-sm text-slate-400 font-medium mt-1">Found {users.length} active directory entries.</p>
            </div>
            <div className="flex gap-4">
               <div className="relative">
                 <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                 <input type="text" placeholder="Search accounts..." className="pl-10 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none w-64" />
               </div>
               <button className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all">
                  <i className="fas fa-filter"></i>
               </button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-10 py-6">Identity</th>
                <th className="px-10 py-6">Access Level</th>
                <th className="px-10 py-6">Engagement</th>
                <th className="px-10 py-6">Registration</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <img src={u.avatar} className="w-10 h-10 rounded-xl bg-slate-100 object-cover" alt="" />
                      <div>
                        <p className="font-black text-slate-900 text-sm leading-none mb-1">{u.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border shadow-sm ${
                      u.role === 'ADMIN' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      u.role === 'INSTRUCTOR' ? 'bg-teal-50 text-teal-600 border-teal-100' : 
                      'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-black text-slate-700">{u.points} pts</span>
                       <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                       <span className="text-xs font-bold text-slate-400">{u.streak}d streak</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-xs text-slate-400 font-bold">
                    {new Date(u.lastActive).toLocaleDateString()}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition-all"><i className="fas fa-pen-to-square"></i></button>
                       <button className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-rose-600 hover:border-rose-600 transition-all"><i className="fas fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center">
               <i className="fas fa-folder-open text-6xl text-slate-100 mb-6"></i>
               <p className="text-slate-300 font-black uppercase tracking-widest text-xs">No records found in local database</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const AdminSidebarLink: React.FC<{ active: boolean; icon: string; label: string }> = ({ active, icon, label }) => (
  <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all cursor-pointer border ${
    active ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-600/20' : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
  }`}>
    <i className={`fas ${icon} w-6 text-center`}></i>
    <span className="tracking-tight">{label}</span>
  </div>
);

const AdminStatCard: React.FC<{ label: string; value: string; growth: string; icon: string; color: string }> = ({ label, value, growth, icon, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
    <div className="flex justify-between items-start mb-6">
      <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center ${color} shadow-inner`}>
        <i className={`fas ${icon} text-2xl`}></i>
      </div>
      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${growth.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {growth}
      </span>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
    <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h4>
  </div>
);

const AlertItem: React.FC<{ type: 'critical' | 'warning' | 'info'; label: string; time: string }> = ({ type, label, time }) => (
  <div className="flex items-center gap-4 group cursor-pointer">
    <div className={`w-2 h-2 rounded-full shrink-0 ${
      type === 'critical' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 
      type === 'warning' ? 'bg-amber-500' : 'bg-indigo-400'
    }`}></div>
    <div className="flex-1">
      <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{label}</p>
      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{time}</p>
    </div>
    <i className="fas fa-chevron-right text-[10px] text-slate-700 group-hover:text-slate-500 group-hover:translate-x-1 transition-all"></i>
  </div>
);
