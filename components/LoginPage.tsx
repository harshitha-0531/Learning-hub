
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, register, isLoading, error } = useAuth() as any;
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('USER');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      await register(name, email, password, role);
    } else {
      await login(email, role); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e293b,0%,#020617_100%)]"></div>
      
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] shadow-2xl w-full max-w-lg p-10 md:p-14 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-teal-400 rounded-3xl mb-6 shadow-2xl shadow-indigo-500/20 rotate-6 group hover:rotate-0 transition-transform duration-500">
            <i className="fas fa-graduation-cap text-4xl text-white"></i>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">EduAI</h1>
          <p className="text-slate-400 font-medium">Infinite learning, powered by intelligence.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-xs font-bold animate-bounce-short">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Role</label>
            <div className={`grid ${isRegistering ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
              <RoleBtn active={role === 'USER'} onClick={() => setRole('USER')} label="Learner" color="indigo" />
              <RoleBtn active={role === 'INSTRUCTOR'} onClick={() => setRole('INSTRUCTOR')} label="Instructor" color="teal" />
              {!isRegistering && <RoleBtn active={role === 'ADMIN'} onClick={() => setRole('ADMIN')} label="Admin" color="amber" />}
            </div>
          </div>

          <button 
            type="submit" disabled={isLoading} 
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : (isRegistering ? 'Create Account' : 'Secure Login')}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button 
            type="button" 
            /* Fix: removed setError(null) as it is internal to the AuthProvider. Changing mode usually triggers a refresh or is handled by context state resets. */
            onClick={() => { setIsRegistering(!isRegistering); setRole('USER'); }}
            className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'New to EduAI? Create account'}
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.5em] text-slate-700">
        System Root: admin@eduai.com
      </div>
    </div>
  );
};

const RoleBtn: React.FC<{active: boolean, onClick: () => void, label: string, color: string}> = ({active, onClick, label, color}) => (
  <button 
    type="button" onClick={onClick}
    className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all ${
      active 
        ? `bg-${color}-600 border-${color}-500 text-white shadow-lg` 
        : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'
    }`}
  >
    {label}
  </button>
);