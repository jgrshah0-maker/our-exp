export interface StudentProfile {
  name: string;
  gradeLevel: string;
  studyHours: number;
  attendanceRate: number;
  academicProfile: string;
}

export interface SubjectScore {
  id: string;
  name: string;
  marks: number;
  maxMarks: number;
}

export interface AcademicYear {
  id: string;
  yearName: string;
  overallPercentage: number;
  subjects: SubjectScore[];
}

export interface CurrentSubject {
  id: string;
  name: string;
  currentMarks: number;
  maxMarks: number;
  studyHoursPerWeek: number;
  targetMarks: number;
}

export interface SubjectPrediction {
  subjectName: string;
  predictedPercentage: number;
  currentStanding: "High" | "Moderate" | "At-Risk" | string;
  aiInsight: string;
  suggestedWeeklyHours: number;
}

export interface StrengthItem {
  subject: string;
  reason: string;
}

export interface WeaknessItem {
  subject: string;
  reason: string;
  actionPlan: string;
}

export interface StrategicPlan {
  dailyRoutine: string[];
  keyFocusAreas: string[];
  examPrepStrategy: string;
}

export interface PredictionResult {
  predictedOverallPercentage: number;
  predictedLetterGrade: string;
  confidenceScore: number;
  trendAnalysis: {
    trajectory: "improving" | "declining" | "stable" | "fluctuating" | string;
    description: string;
  };
  subjectPredictions: SubjectPrediction[];
  strengths: StrengthItem[];
  weaknesses: WeaknessItem[];
  strategicPlan: StrategicPlan;
}

export interface SavedSession {
  id: string;
  date: string;
  studentProfile: StudentProfile;
  pastYears: AcademicYear[];
  currentYear: {
    yearName: string;
    subjects: CurrentSubject[];
  };
  result: PredictionResult;
}
