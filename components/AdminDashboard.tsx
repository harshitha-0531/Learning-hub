
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { User } from '../types';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = useCallback(() => {
    const db = localStorage.getItem('eduai_users_db');
    if (db) {
      const parsedUsers: User[] = JSON.parse(db);
      setUsers(parsedUsers);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 3000);
    return () => clearInterval(interval);
  }, [loadUsers]);

  const handleDeleteUser = (userId: string) => {
    if (userId === 'admin-root') return alert("CRITICAL: Root administrator cannot be removed.");
    if (confirm("DANGER: This will permanently purge the user's learning data. Proceed?")) {
      const currentDb = localStorage.getItem('eduai_users_db');
      if (currentDb) {
        const parsed: User[] = JSON.parse(currentDb);
        const updated = parsed.filter(u => u.id !== userId);
        localStorage.setItem('eduai_users_db', JSON.stringify(updated));
        setUsers(updated);
      }
    }
  };

  const totalUsers = users.length;
  const instructors = users.filter(u => u.role === 'INSTRUCTOR').length;
  const learners = users.filter(u => u.role === 'USER').length;
  const totalPoints = users.reduce((acc, u) => acc + (u.points || 0), 0);
  const avgScore = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <aside className="w-72 bg-slate-950 border-r border-white/5 flex flex-col text-slate-300">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <i className="fas fa-shield-halved text-xl"></i>
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tighter block">EduAdmin</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">System Control</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <AdminSidebarLink active={true} icon="fa-layer-group" label="Global Overview" />
          <AdminSidebarLink active={false} icon="fa-users-gear" label="Management" />
          <AdminSidebarLink active={false} icon="fa-terminal" label="Log Terminal" />
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6 p-4 bg-white/5 rounded-2xl border border-white/5">
            <img src={user?.avatar} className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10" alt="Admin" />
            <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate">{user?.name}</p>
              <p className="text-[10px] font-black text-amber-500 uppercase">Super User</p>
            </div>
          </div>
          <button onClick={logout} className="w-full py-4 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            <i className="fas fa-power-off mr-2"></i> Terminate Admin Session
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Platform Console</h1>
            <p className="text-slate-500 font-medium">Monitoring real-time activity across {totalUsers} accounts.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-2xl text-[10px] font-black border border-emerald-100 flex items-center gap-3 shadow-sm">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> DB SYNC: CONNECTED
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <AdminStatCard label="Total Reach" value={totalUsers.toString()} tag="Users" icon="fa-users" color="text-indigo-600" />
          <AdminStatCard label="Instructors" value={instructors.toString()} tag="Staff" icon="fa-chalkboard-user" color="text-teal-600" />
          <AdminStatCard label="Total XP" value={totalPoints.toLocaleString()} tag="Growth" icon="fa-bolt" color="text-amber-500" />
          <AdminStatCard label="Avg Score" value={avgScore + "%"} tag="Performance" icon="fa-chart-simple" color="text-rose-600" />
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
             <div>
               <h3 className="text-xl font-black text-slate-900">User Identity Matrix</h3>
               <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Live Record Set</p>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-10 py-6">User Context</th>
                  <th className="px-10 py-6">Credentials</th>
                  <th className="px-10 py-6">Analytics</th>
                  <th className="px-10 py-6 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <img src={u.avatar} className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-100" alt="" />
                        <div>
                          <p className="font-black text-slate-900 text-sm mb-1">{u.name}</p>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${u.role === 'ADMIN' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{u.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-xs font-bold text-slate-500">{u.email}</p>
                      <p className="text-[10px] text-slate-400 font-medium">ID: {u.id.toUpperCase()}</p>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-xs font-black text-slate-700">{u.points} XP Earned</p>
                      <p className="text-[9px] font-black text-slate-400">{u.streak}d Streak</p>
                    </td>
                    <td className="px-10 py-6 text-right">
                      {u.role !== 'ADMIN' && (
                        <button onClick={() => handleDeleteUser(u.id)} className="w-10 h-10 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all flex items-center justify-center ml-auto">
                          <i className="fas fa-trash-can"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

const AdminSidebarLink: React.FC<{ active: boolean; icon: string; label: string }> = ({ active, icon, label }) => (
  <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black border transition-all cursor-pointer ${
    active ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-600/20' : 'text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'
  }`}>
    <i className={`fas ${icon} w-6 text-center`}></i>
    <span>{label}</span>
  </div>
);

const AdminStatCard: React.FC<{ label: string; value: string; tag: string; icon: string; color: string }> = ({ label, value, tag, icon, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
    <div className="flex justify-between items-start mb-6">
      <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center ${color} shadow-inner`}>
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      <span className="text-[9px] font-black px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg">{tag}</span>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
    <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
  </div>
);
