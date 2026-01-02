
export type UserRole = 'USER' | 'ADMIN' | 'INSTRUCTOR';

export interface SkillStat {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  avgQuizScore: number;
  timeInvestedHours: number;
  lastTestedDate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  streak: number;
  points: number;
  lastActive: string;
  completedSkills: string[];
  learningGoal?: string;
  enrolledCourseIds: string[];
  bio?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  learningStyle?: string;
  areasOfInterest?: string[];
  secondaryGoals?: string[];
  coursesCompletedCount?: number;
  achievementsCount?: number;
  skillStats: Record<string, SkillStat>;
  quizHistory: { topic: string; score: number; date: string }[];
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface LearningPathItem {
  week: number;
  topic: string;
  description: string;
  estimatedHours: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  skillTag: string;
}

// Fix: Added missing QuizBank interface
export interface QuizBank {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questions: QuizQuestion[];
}

// Fix: Added missing QuizResult interface
export interface QuizResult {
  courseId: string;
  quizBankId: string;
  score: number;
  date: string;
}

export interface MicroLesson {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: string;
  quiz: QuizQuestion[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  instructorId: string;
  studentsCount: number;
  rating: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  materials: { type: 'video' | 'doc'; title: string; url: string }[];
  // Fix: Changed from any[] to QuizBank[]
  quizBanks: QuizBank[];
}

export interface SkillGap {
  skill: string;
  incorrectAnswers: number;
  totalQuestions: number;
  weaknessRate: number;
  recommendedCourse: {
    id: string;
    title: string;
  };
}
