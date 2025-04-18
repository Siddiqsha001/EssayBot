export interface UserProfile {
  // Basic Info
  name: string;
  email: string;
  dob: string;
  academicLevel: string;
  writingStyle: string;
  targetExam: string;
  
  // Additional Fields
  favoriteTopics: string[];
  writingGoals: string[];
  practiceFrequency: 'daily' | 'weekly' | 'monthly';
  location: string;
  profilePicture?: string;
  lastEssayDate?: string;
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  
  // Smart Features
  preferredFeedbackType: 'quick' | 'detailed' | 'grade';
  typingSpeed?: number;
  nativeLanguage: string;
  
  // Metadata
  createdAt: string;
  lastUpdated: string;
}

export type UserProfileUpdate = Partial<UserProfile>;
