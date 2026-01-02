
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, UserRole } from '../types';

interface AuthContextExtended extends AuthContextType {
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  updateUser: (updatedUser: User) => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextExtended | undefined>(undefined);

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
    setIsLoading(false);
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    setError(null);
    setIsLoading(true);
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
      points: 125, // Start with 125 points as seen in visual
      lastActive: new Date().toISOString(),
      completedSkills: [],
      learningGoal: 'Advance my career in web development',
      enrolledCourseIds: [],
      bio: 'Passionate about continuous learning and professional development',
      skillLevel: 'Intermediate',
      learningStyle: 'Visual',
      areasOfInterest: ['Technology', 'Business', 'Creative'],
      secondaryGoals: ['Learn data science basics', 'Improve leadership skills'],
      coursesCompletedCount: 1,
      achievementsCount: 3,
      skillStats: {}, // Starts empty for 0% proficiency
      quizHistory: []
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('eduai_users_db', JSON.stringify(updatedUsers));
    setUser(newUser);
    localStorage.setItem('eduai_active_user', JSON.stringify(newUser));
    setIsLoading(false);
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
