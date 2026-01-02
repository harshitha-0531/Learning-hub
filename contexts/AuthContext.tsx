
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
  { id: '5', title: 'Learning Streak', description: 'Learn for 7 days in a row', points: 75, icon: 'fa-fire', isEarned: false },
  { id: '6', title: 'Early Adopter', description: 'Join the platform in its first month', points: 125, icon: 'fa-award', isEarned: false },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('eduai_active_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const getUsers = (): any[] => {
    const users = localStorage.getItem('eduai_users_db');
    return users ? JSON.parse(users) : [];
  };

  const login = async (email: string, role: UserRole) => {
    setError(null);
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const users = getUsers();
      const foundUser = users.find(u => u.email === email);
      if (!foundUser) {
        setError("Invalid email or user not found.");
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
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const users = getUsers();
      if (users.find(u => u.email === email)) {
        setError("An account with this email already exists.");
        setIsLoading(false);
        return;
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        role,
        avatar: `https://picsum.photos/seed/${email}/100`,
        streak: 1,
        points: 125, // Starting points as per visual reference
        lastActive: new Date().toISOString(),
        completedSkills: [],
        learningGoal: 'Advance my career in web development',
        enrolledCourseIds: [],
        coursesCompletedCount: 1, // Set to 1 as per visual reference
        lessonsCompletedCount: 0,
        bio: 'Passionate about continuous learning and professional development',
        skillLevel: 'Intermediate',
        learningStyle: 'Visual',
        areasOfInterest: ['Technology', 'Business', 'Creative'],
        secondaryGoals: ['Learn data science basics', 'Improve leadership skills'],
        achievements: INITIAL_ACHIEVEMENTS.map(a => 
          a.id === '6' ? { ...a, isEarned: true, earnedDate: new Date().toLocaleDateString() } : a
        ),
        skillStats: {}, // New user starts with empty skill stats
        quizHistory: []
      };
      
      const updatedUsers = [...users, newUser];
      localStorage.setItem('eduai_users_db', JSON.stringify(updatedUsers));
      setUser(newUser);
      localStorage.setItem('eduai_active_user', JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('eduai_active_user', JSON.stringify(updatedUser));
    const users = getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index > -1) {
      users[index] = updatedUser;
      localStorage.setItem('eduai_users_db', JSON.stringify(users));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eduai_active_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateUser, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
