
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { User } from '../types';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = () => {
    const db = localStorage.getItem('eduai_users_db');
    if (db) setUsers(JSON.parse(db));
  };

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteUser = (userId: string) => {
    if (userId === 'admin-root') return alert("Cannot delete root admin.");
    if (confirm("Are you sure you want to remove this user?")) {
      const updated = users.filter(u => u.id !== userId);
      localStorage.setItem('eduai_users_db', JSON.stringify(updated));
      setUsers(updated);
    }
  };

  const platformGrowth = [
    { month: 'Jan', users: users.length * 0.2, aiRequests: 4500 },
    { month: 'Feb', users: users.length * 0.4, aiRequests: 5200 },
    { month: 'Mar', users: users.length * 0.6, aiRequests: 6100 },
    { month: 'Apr', users: users.length * 0.8, aiRequests: 7800 },
    { month: 'May', users: users.length, aiRequests: 9500 },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300">
        <div className="p-8 border-b border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <i className="fas fa-shield-halved text-xl"></i>
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tighter block">EduAdmin</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Platform Root</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <AdminSidebarLink active={true} icon="fa-th-large" label="Overview" />
          <AdminSidebarLink active={false} icon="fa-users-gear" label="User Directory" />
          <AdminSidebarLink active={false} icon="fa-chart-network" label="AI Analytics" />
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-2xl">
            <img src={user?.avatar} className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10" alt="Admin" />
            <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate">{user?.name}</p>
              <p className="text-[10px] font-black text-amber-500 uppercase">System Root</p>
            </div>
          </div>
          <button onClick={logout} className="w-full py-4 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            <i className="fas fa-sign-out-alt mr-2"></i> Terminate Admin Session
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Terminal Console</h1>
            <p className="text-slate-500 font-medium">Monitoring {users.length} active platform accounts.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black border border-emerald-100 flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> SYSTEM: ONLINE
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <AdminStatCard label="Platform Users" value={users.length.toString()} growth="LIVE" icon="fa-users" color="text-indigo-600" />
          <AdminStatCard label="Instructors" value={users.filter(u => u.role === 'INSTRUCTOR').length.toString()} growth="VERIFIED" icon="fa-chalkboard-user" color="text-teal-600" />
          <AdminStatCard label="Learners" value={users.filter(u => u.role === 'USER').length.toString()} growth="ACTIVE" icon="fa-user-graduate" color="text-indigo-500" />
          <AdminStatCard label="Platform Score" value={(users.reduce((a,b) => a + (b.points || 0), 0) / (users.length || 1)).toFixed(0)} growth="AVG" icon="fa-star" color="text-amber-600" />
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-10 border-b border-slate-100">
             <h3 className="text-xl font-black text-slate-900">Platform Directory</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-10 py-6">User Identity</th>
                <th className="px-10 py-6">Role</th>
                <th className="px-10 py-6">Performance</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <img src={u.avatar} className="w-10 h-10 rounded-xl bg-slate-100 border" alt="" />
                      <div>
                        <p className="font-black text-slate-900 text-sm leading-none mb-1">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${
                      u.role === 'ADMIN' ? 'bg-amber-50 text-amber-600' : 
                      u.role === 'INSTRUCTOR' ? 'bg-teal-50 text-teal-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-xs font-bold text-slate-600">{u.points} Points / {u.streak}d Streak</td>
                  <td className="px-10 py-6 text-right">
                     {u.role !== 'ADMIN' && (
                       <button 
                         onClick={() => handleDeleteUser(u.id)}
                         className="w-10 h-10 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                       >
                         <i className="fas fa-trash-can"></i>
                       </button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

const AdminSidebarLink: React.FC<{ active: boolean; icon: string; label: string }> = ({ active, icon, label }) => (
  <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black border transition-all ${
    active ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl' : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'
  }`}>
    <i className={`fas ${icon} w-6 text-center`}></i>
    <span>{label}</span>
  </div>
);

const AdminStatCard: React.FC<{ label: string; value: string; growth: string; icon: string; color: string }> = ({ label, value, growth, icon, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start mb-6">
      <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center ${color}`}>
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      <span className="text-[9px] font-black px-2 py-1 bg-slate-50 text-slate-400 rounded-lg">{growth}</span>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
  </div>
);
