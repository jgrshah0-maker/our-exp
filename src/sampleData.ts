import { SavedSession, StudentProfile, AcademicYear, CurrentSubject } from "./types";

export interface SampleProfile {
  label: string;
  description: string;
  studentProfile: StudentProfile;
  pastYears: AcademicYear[];
  currentYear: {
    yearName: string;
    subjects: CurrentSubject[];
  };
}

export const sampleProfiles: SampleProfile[] = [
  {
    label: "High School Science Track (Improving)",
    description: "A student showing consistent positive growth over the last 3 years.",
    studentProfile: {
      name: "Alex Rivera",
      gradeLevel: "Grade 12 (Senior)",
      studyHours: 12,
      attendanceRate: 95,
      academicProfile: "Enjoys biology and environmental science. Part of the robotics club.",
    },
    pastYears: [
      {
        id: "y1",
        yearName: "Grade 9 (Freshman)",
        overallPercentage: 74,
        subjects: [
          { id: "s1_1", name: "Mathematics", marks: 71, maxMarks: 100 },
          { id: "s1_2", name: "Physics & Chemistry", marks: 73, maxMarks: 100 },
          { id: "s1_3", name: "Biology", marks: 78, maxMarks: 100 },
          { id: "s1_4", name: "English Lit", marks: 75, maxMarks: 100 },
          { id: "s1_5", name: "History", marks: 73, maxMarks: 100 },
        ],
      },
      {
        id: "y2",
        yearName: "Grade 10 (Sophomore)",
        overallPercentage: 81,
        subjects: [
          { id: "s2_1", name: "Mathematics", marks: 78, maxMarks: 100 },
          { id: "s2_2", name: "Physics & Chemistry", marks: 80, maxMarks: 100 },
          { id: "s2_3", name: "Biology", marks: 86, maxMarks: 100 },
          { id: "s2_4", name: "English Lit", marks: 82, maxMarks: 100 },
          { id: "s2_5", name: "History", marks: 79, maxMarks: 100 },
        ],
      },
      {
        id: "y3",
        yearName: "Grade 11 (Junior)",
        overallPercentage: 86,
        subjects: [
          { id: "s3_1", name: "Mathematics", marks: 82, maxMarks: 100 },
          { id: "s3_2", name: "Physics & Chemistry", marks: 85, maxMarks: 100 },
          { id: "s3_3", name: "Biology", marks: 91, maxMarks: 100 },
          { id: "s3_4", name: "English Lit", marks: 88, maxMarks: 100 },
          { id: "s3_5", name: "History", marks: 84, maxMarks: 100 },
        ],
      },
    ],
    currentYear: {
      yearName: "Grade 12 (Senior)",
      subjects: [
        { id: "c1", name: "Advanced Calculus", currentMarks: 83, maxMarks: 100, studyHoursPerWeek: 3, targetMarks: 88 },
        { id: "c2", name: "AP Physics", currentMarks: 86, maxMarks: 100, studyHoursPerWeek: 4, targetMarks: 90 },
        { id: "c3", name: "AP Biology", currentMarks: 92, maxMarks: 100, studyHoursPerWeek: 4, targetMarks: 95 },
        { id: "c4", name: "English Lit & Comp", currentMarks: 89, maxMarks: 100, studyHoursPerWeek: 2, targetMarks: 90 },
      ],
    },
  },
  {
    label: "Undergrad Computer Science (Fluctuating Math)",
    description: "Excels in programming but struggles with higher math theory.",
    studentProfile: {
      name: "Jordan Chen",
      gradeLevel: "University Year 4",
      studyHours: 15,
      attendanceRate: 88,
      academicProfile: "Highly skilled in web development and systems coding. Struggles with exam anxiety in mathematics.",
    },
    pastYears: [
      {
        id: "col_y1",
        yearName: "Freshman Year",
        overallPercentage: 82,
        subjects: [
          { id: "col_1_1", name: "Intro to Programming", marks: 94, maxMarks: 100 },
          { id: "col_1_2", name: "Calculus I", marks: 68, maxMarks: 100 },
          { id: "col_1_3", name: "Discrete Structures", marks: 72, maxMarks: 100 },
          { id: "col_1_4", name: "Technical Writing", marks: 88, maxMarks: 100 },
          { id: "col_1_5", name: "Physics for Engineers", marks: 88, maxMarks: 100 },
        ],
      },
      {
        id: "col_y2",
        yearName: "Sophomore Year",
        overallPercentage: 79,
        subjects: [
          { id: "col_2_1", name: "Data Structures", marks: 91, maxMarks: 100 },
          { id: "col_2_2", name: "Linear Algebra", marks: 64, maxMarks: 100 },
          { id: "col_2_3", name: "Computer Architecture", marks: 83, maxMarks: 100 },
          { id: "col_2_4", name: "Database Systems", marks: 85, maxMarks: 100 },
          { id: "col_2_5", name: "Stats & Probability", marks: 72, maxMarks: 100 },
        ],
      },
      {
        id: "col_y3",
        yearName: "Junior Year",
        overallPercentage: 84,
        subjects: [
          { id: "col_3_1", name: "Algorithms Analysis", marks: 86, maxMarks: 100 },
          { id: "col_3_2", name: "Theory of Computation", marks: 74, maxMarks: 100 },
          { id: "col_3_3", name: "Operating Systems", marks: 89, maxMarks: 100 },
          { id: "col_3_4", name: "Software Engineering", marks: 95, maxMarks: 100 },
          { id: "col_3_5", name: "Numerical Methods", marks: 76, maxMarks: 100 },
        ],
      },
    ],
    currentYear: {
      yearName: "Senior Year",
      subjects: [
        { id: "col_c1", name: "Machine Learning", currentMarks: 88, maxMarks: 100, studyHoursPerWeek: 5, targetMarks: 92 },
        { id: "col_c2", name: "Cryptography & Math", currentMarks: 73, maxMarks: 100, studyHoursPerWeek: 5, targetMarks: 80 },
        { id: "col_c3", name: "Distributed Systems", currentMarks: 91, maxMarks: 100, studyHoursPerWeek: 4, targetMarks: 93 },
        { id: "col_c4", name: "Senior Capstone Project", currentMarks: 96, maxMarks: 100, studyHoursPerWeek: 6, targetMarks: 98 },
      ],
    },
  },
  {
    label: "Undergrad Pre-Med Track (High Achiever)",
    description: "Maintaining outstanding scores but facing rigorous senior workload.",
    studentProfile: {
      name: "Maya Patel",
      gradeLevel: "University Year 3 (Junior)",
      studyHours: 20,
      attendanceRate: 98,
      academicProfile: "Excellent laboratory skills. Volunteers at a local clinic. Targets top-tier medical school.",
    },
    pastYears: [
      {
        id: "pm_y1",
        yearName: "Year 1 (Freshman)",
        overallPercentage: 91,
        subjects: [
          { id: "pm_1_1", name: "General Chemistry", marks: 92, maxMarks: 100 },
          { id: "pm_1_2", name: "Introductory Biology", marks: 94, maxMarks: 100 },
          { id: "pm_1_3", name: "Calculus for Life Sciences", marks: 86, maxMarks: 100 },
          { id: "pm_1_4", name: "English Composition", marks: 92, maxMarks: 100 },
        ],
      },
      {
        id: "pm_y2",
        yearName: "Year 2 (Sophomore)",
        overallPercentage: 93,
        subjects: [
          { id: "pm_2_1", name: "Organic Chemistry I & II", marks: 91, maxMarks: 100 },
          { id: "pm_2_2", name: "Cell Biology", marks: 95, maxMarks: 100 },
          { id: "pm_2_3", name: "Physics for Biologists", marks: 92, maxMarks: 100 },
          { id: "pm_2_4", name: "Psychology 101", marks: 94, maxMarks: 100 },
        ],
      },
      {
        id: "pm_y3",
        yearName: "Year 3 (Junior)",
        overallPercentage: 95,
        subjects: [
          { id: "pm_3_1", name: "Biochemistry", marks: 94, maxMarks: 100 },
          { id: "pm_3_2", name: "Genetics", marks: 96, maxMarks: 100 },
          { id: "pm_3_3", name: "Organic Chemistry Lab", marks: 97, maxMarks: 100 },
          { id: "pm_3_4", name: "Sociology & Health", marks: 93, maxMarks: 100 },
        ],
      },
    ],
    currentYear: {
      yearName: "Year 4 (Senior)",
      subjects: [
        { id: "pm_c1", name: "Molecular Genetics", currentMarks: 94, maxMarks: 100, studyHoursPerWeek: 6, targetMarks: 97 },
        { id: "pm_c2", name: "Human Anatomy & Phys", currentMarks: 96, maxMarks: 100, studyHoursPerWeek: 7, targetMarks: 98 },
        { id: "pm_c3", name: "Physical Chemistry", currentMarks: 89, maxMarks: 100, studyHoursPerWeek: 5, targetMarks: 92 },
        { id: "pm_c4", name: "Bioethics Seminar", currentMarks: 95, maxMarks: 100, studyHoursPerWeek: 4, targetMarks: 96 },
      ],
    },
  },
];
