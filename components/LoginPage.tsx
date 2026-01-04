
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
      // In a real app, login checks the DB for role. 
      // For this prototype, we'll try to find the user in our local storage DB.
      await login(email, 'USER'); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden p-4">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/20 blur-[120px] rounded-full"></div>

      <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 md:p-12 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-teal-400 rounded-3xl mb-6 shadow-xl shadow-indigo-500/20 rotate-3">
            <i className="fas fa-graduation-cap text-4xl text-white"></i>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">EduAI</h1>
          <p className="text-slate-400 font-medium">Your learning management gateway.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold animate-in slide-in-from-top-2">
            <i className="fas fa-circle-exclamation"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div className="space-y-2 group">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400">
                  <i className="fas fa-user"></i>
                </span>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-2 group">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400">
                <i className="fas fa-envelope"></i>
              </span>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400">
                <i className="fas fa-lock"></i>
              </span>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {isRegistering && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Account Role</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button" 
                  onClick={() => setRole('USER')}
                  className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                    role === 'USER' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  Learner
                </button>
                <button 
                  type="button" 
                  onClick={() => setRole('INSTRUCTOR')}
                  className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                    role === 'INSTRUCTOR' ? 'bg-teal-600 text-white border-teal-500 shadow-lg' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  Instructor
                </button>
                <button 
                  type="button" 
                  onClick={() => setRole('ADMIN')}
                  className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                    role === 'ADMIN' ? 'bg-amber-600 text-white border-amber-500 shadow-lg' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <i className="fas fa-circle-notch animate-spin"></i>
            ) : (
              <>
                {isRegistering ? 'Create Account' : 'Sign In'}
                <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button" 
            onClick={() => { setIsRegistering(!isRegistering); setEmail(''); setPassword(''); setName(''); }}
            className="text-sm font-bold text-slate-400 hover:text-indigo-400 transition-colors"
          >
            {isRegistering ? (
              <>Already have an account? <span className="text-indigo-400">Log in</span></>
            ) : (
              <>New to EduAI? <span className="text-indigo-400">Sign up now</span></>
            )}
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
        Admin & Instructor Access Enabled
      </div>
    </div>
  );
};
