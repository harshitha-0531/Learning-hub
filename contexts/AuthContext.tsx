
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, UserRole, Achievement } from '../types';

interface AuthContextExtended extends AuthContextType {
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextExtended | undefined>(undefined);

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: '1', title: 'First Steps', description: 'Complete your first lesson', points: 10, icon: 'fa-walking', isEarned: false },
  { id: '2', title: 'Course Completer', description: 'Complete your first course', points: 100, icon: 'fa-graduation-cap', isEarned: false },
  { id: '3', title: 'Knowledge Seeker', description: 'Complete 5 lessons in a row', points: 25, icon: 'fa-microscope', isEarned: false },
  { id: '4', title: 'Perfect Score', description: 'Get 100% on a quiz', points: 50, icon: 'fa-check-double', isEarned: false },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const seedPlatform = () => {
      const usersStr = localStorage.getItem('eduai_users_db');
      let users = usersStr ? JSON.parse(usersStr) : [];
      
      const adminExists = users.find((u: any) => u.role === 'ADMIN');
      if (!adminExists) {
        const systemAdmin: User = {
          id: 'admin-root',
          name: 'Global Administrator',
          email: 'admin@eduai.com',
          role: 'ADMIN',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
          streak: 0,
          points: 0,
          lastActive: new Date().toISOString(),
          completedSkills: [],
          enrolledCourseIds: [],
          coursesCompletedCount: 0,
          lessonsCompletedCount: 0,
          achievements: [],
          skillStats: {},
          quizHistory: []
        };
        users.push(systemAdmin);
        localStorage.setItem('eduai_users_db', JSON.stringify(users));
      }
    };

    seedPlatform();
    const storedUser = localStorage.getItem('eduai_active_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, []);

  const login = async (email: string, role: UserRole) => {
    setError(null);
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const usersStr = localStorage.getItem('eduai_users_db');
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
      
      if (!foundUser) {
        setError("Account not found for this role. Check your email or role selection.");
        setIsLoading(false);
        return;
      }
      
      setUser(foundUser);
      localStorage.setItem('eduai_active_user', JSON.stringify(foundUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    setError(null);
    if (role === 'ADMIN') {
      setError("Unauthorized role request.");
      return;
    }

    setIsLoading(true);
    try {
      const usersStr = localStorage.getItem('eduai_users_db');
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        setError("Email already registered.");
        setIsLoading(false);
        return;
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        streak: 0,
        points: 0,
        lastActive: new Date().toISOString(),
        completedSkills: [],
        learningGoal: 'Self Improvement',
        enrolledCourseIds: [],
        coursesCompletedCount: 0,
        lessonsCompletedCount: 0,
        achievements: INITIAL_ACHIEVEMENTS,
        skillStats: {},
        quizHistory: []
      };
      
      localStorage.setItem('eduai_users_db', JSON.stringify([...users, newUser]));
      setUser(newUser);
      localStorage.setItem('eduai_active_user', JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eduai_active_user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('eduai_active_user', JSON.stringify(updatedUser));
    const usersStr = localStorage.getItem('eduai_users_db');
    if (usersStr) {
      const users: User[] = JSON.parse(usersStr);
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index > -1) {
        users[index] = updatedUser;
        localStorage.setItem('eduai_users_db', JSON.stringify(users));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateUser, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};