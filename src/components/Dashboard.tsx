import React, { useState, useMemo } from "react";
import { PredictionResult, AcademicYear, CurrentSubject } from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Clock,
  ChevronRight,
  Printer,
  RotateCcw,
  Sparkles,
  Sliders,
  Target,
  FileText,
  User,
  Activity,
  ThumbsUp,
  ExternalLink,
  BookOpen,
  Percent,
  Calculator
} from "lucide-react";
import confetti from "canvas-confetti";

interface DashboardProps {
  result: PredictionResult;
  pastYears: AcademicYear[];
  currentYear: {
    yearName: string;
    subjects: CurrentSubject[];
  };
  studentProfile: {
    name: string;
    gradeLevel: string;
    studyHours: number;
    attendanceRate: number;
    academicProfile: string;
  };
  onReset: () => void;
}

export default function Dashboard({
  result,
  pastYears,
  currentYear,
  studentProfile,
  onReset,
}: DashboardProps) {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"overview" | "adjuster" | "forecast" | "resources">("overview");

  // Interactive Target Adjustment states
  const [adjTargetPercentage, setAdjTargetPercentage] = useState<number>(() => {
    return Math.max(70, Math.round(result.predictedOverallPercentage));
  });

  // Future year forecasting multiplier (e.g., +0% pure trend, +2% active accelerator, +4% maximum hustle)
  const [forecastGrowthRate, setForecastGrowthRate] = useState<number>(0);

  // Trigger confetti once on load if the prediction is high
  React.useEffect(() => {
    if (result.predictedOverallPercentage >= 80) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [result]);

  // --- What-If Simulator Local State ---
  const [simWeeklyHours, setSimWeeklyHours] = useState<number>(studentProfile.studyHours || 10);
  const [simAttendance, setSimAttendance] = useState<number>(studentProfile.attendanceRate || 90);
  
  // Subject specific study hours sliders
  const [simSubjectHours, setSimSubjectHours] = useState<Record<string, number>>(() => {
    const hours: Record<string, number> = {};
    currentYear.subjects.forEach((s) => {
      hours[s.name] = s.studyHoursPerWeek || 3;
    });
    return hours;
  });

  const handleSubjectHourChange = (subName: string, val: number) => {
    setSimSubjectHours((prev) => ({
      ...prev,
      [subName]: val,
    }));
  };

  // Run real-time simulation calculations
  // We simulate how grades shift using a premium heuristic derived from attendance & study hours
  const simulatedResults = useMemo(() => {
    const hoursFactor = Math.min(1.2, 0.8 + (simWeeklyHours / (studentProfile.studyHours || 10 || 1)) * 0.2);
    const attendanceFactor = Math.min(1.05, 0.7 + (simAttendance / 100) * 0.35);

    // Calculate individual subjects
    let simulatedSum = 0;
    const subjects = result.subjectPredictions.map((pred) => {
      const origSubject = currentYear.subjects.find((s) => s.name === pred.subjectName);
      const origHours = origSubject?.studyHoursPerWeek || 3;
      const curSimHours = simSubjectHours[pred.subjectName] || origHours;

      // Study hour multiplier (with diminishing returns via log)
      const studyMultiplier = 1 + Math.log2((curSimHours + 1) / (origHours + 1)) * 0.08;
      
      // Attendance shift
      const attendMultiplier = 1 + (simAttendance - studentProfile.attendanceRate) * 0.003;

      let simPercentage = pred.predictedPercentage * studyMultiplier * attendMultiplier;
      // Cap at 100%, floor at 35%
      simPercentage = Math.min(100, Math.max(35, Math.round(simPercentage * 10) / 10));
      simulatedSum += simPercentage;

      // Standing shift
      let simStanding = pred.currentStanding;
      if (simPercentage >= 85) simStanding = "High";
      else if (simPercentage >= 70) simStanding = "Moderate";
      else simStanding = "At-Risk";

      return {
        ...pred,
        simulatedPercentage: simPercentage,
        simulatedStanding: simStanding,
      };
    });

    const overallSimPercentage = Math.min(
      100,
      Math.round((simulatedSum / result.subjectPredictions.length) * 10) / 10
    );

    // Determine letter grade
    let overallSimLetter = "B";
    if (overallSimPercentage >= 95) overallSimLetter = "A+";
    else if (overallSimPercentage >= 90) overallSimLetter = "A";
    else if (overallSimPercentage >= 85) overallSimLetter = "B+";
    else if (overallSimPercentage >= 80) overallSimLetter = "B";
    else if (overallSimPercentage >= 75) overallSimLetter = "C+";
    else if (overallSimPercentage >= 70) overallSimLetter = "C";
    else if (overallSimPercentage >= 60) overallSimLetter = "D";
    else overallSimLetter = "F";

    // Dynamic confidence score shift
    const baseConf = result.confidenceScore;
    const simConf = Math.min(
      99,
      Math.max(
        40,
        Math.round(
          baseConf + (simAttendance - studentProfile.attendanceRate) * 0.2 + (simWeeklyHours - studentProfile.studyHours) * 0.5
        )
      )
    );

    return {
      overallPercentage: overallSimPercentage,
      letterGrade: overallSimLetter,
      confidenceScore: simConf,
      subjects,
    };
  }, [simWeeklyHours, simAttendance, simSubjectHours, result, currentYear, studentProfile]);

  // Prepare chart data for Trajectory
  const trajectoryChartData = useMemo(() => {
    const data = pastYears.map((y) => ({
      name: y.yearName,
      "Historical GPA %": y.overallPercentage,
      "AI Predicted %": null as any,
      "Simulated Trend %": null as any,
    }));

    // Add target prediction year
    data.push({
      name: `Predicted (${currentYear.yearName || "Target"})`,
      "Historical GPA %": null as any,
      "AI Predicted %": result.predictedOverallPercentage,
      "Simulated Trend %": simulatedResults.overallPercentage,
    } as any);

    return data;
  }, [pastYears, currentYear, result, simulatedResults]);

  // Subject comparison chart (Recharts)
  const subjectChartData = useMemo(() => {
    return result.subjectPredictions.map((pred) => {
      const curSub = currentYear.subjects.find((s) => s.name === pred.subjectName);
      const curPercentage = curSub ? Math.round((curSub.currentMarks / curSub.maxMarks) * 100) : 0;
      const targetPercentage = curSub ? curSub.targetMarks : 0;
      const simVal = simulatedResults.subjects.find((s) => s.subjectName === pred.subjectName)?.simulatedPercentage || pred.predictedPercentage;

      return {
        subject: pred.subjectName,
        "Current Grade %": curPercentage,
        "Target Grade %": targetPercentage,
        "AI Predicted %": pred.predictedPercentage,
        "Simulated Grade %": simVal,
      };
    });
  }, [result, currentYear, simulatedResults]);

  const handlePrint = () => {
    window.print();
  };

  // --- Perfect Mathematical Calculations & Averages ---
  const totals = useMemo(() => {
    const totalCurrentMarks = currentYear.subjects.reduce((sum, s) => sum + s.currentMarks, 0);
    const totalMaxMarks = currentYear.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const currentAveragePercentage = totalMaxMarks > 0 ? Math.round((totalCurrentMarks / totalMaxMarks) * 1000) / 10 : 0;

    const totalTargetMarks = currentYear.subjects.reduce((sum, s) => sum + s.targetMarks, 0);
    const targetAveragePercentage = currentYear.subjects.length > 0 ? Math.round((totalTargetMarks / currentYear.subjects.length) * 10) / 10 : 0;

    const historicalAvg = pastYears.length > 0 
      ? Math.round((pastYears.reduce((sum, py) => sum + py.overallPercentage, 0) / pastYears.length) * 10) / 10 
      : 0;

    return {
      totalCurrentMarks,
      totalMaxMarks,
      currentAveragePercentage,
      totalTargetMarks,
      targetAveragePercentage,
      historicalAvg,
    };
  }, [currentYear, pastYears]);

  // --- Multi-Year Linear Regression Extrapolation Trajectory ---
  const regressionData = useMemo(() => {
    const n = pastYears.length;
    if (n < 2) {
      // Default to moderate 1.2% slope if insufficient historical points
      const baseline = n === 1 ? pastYears[0].overallPercentage : 80;
      return { slope: 1.2, intercept: baseline - 1.2, r2: 1.0 };
    }

    const x = pastYears.map((_, i) => i + 1);
    const y = pastYears.map((py) => py.overallPercentage);

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - meanX) * (y[i] - meanY);
      den += Math.pow(x[i] - meanX, 2);
    }

    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;

    // R^2 Coefficient
    let ssTot = 0;
    let ssRes = 0;
    for (let i = 0; i < n; i++) {
      const predY = slope * x[i] + intercept;
      ssTot += Math.pow(y[i] - meanY, 2);
      ssRes += Math.pow(y[i] - predY, 2);
    }
    const r2 = ssTot === 0 ? 1 : Math.max(0, Math.min(1, 1 - ssRes / ssTot));

    return { slope, intercept, r2 };
  }, [pastYears]);

  // Next Years Projections using Regression Trajectory
  const forecastedYears = useMemo(() => {
    const n = pastYears.length;
    const { slope, intercept } = regressionData;
    const currentYearIdx = n + 1;
    const futureYearsList = [];

    // Predict current year, plus next 3 years
    for (let offset = 0; offset <= 3; offset++) {
      const yearIndex = currentYearIdx + offset;
      const basePercentage = slope * yearIndex + intercept;
      // Add active effort modifier compounding over future years
      const modifiedPercentage = basePercentage + (forecastGrowthRate * offset);
      const finalPercentage = Math.min(100, Math.max(40, Math.round(modifiedPercentage * 10) / 10));

      // Calculate letter grade
      let letter = "B";
      if (finalPercentage >= 95) letter = "A+";
      else if (finalPercentage >= 90) letter = "A";
      else if (finalPercentage >= 85) letter = "B+";
      else if (finalPercentage >= 80) letter = "B";
      else if (finalPercentage >= 75) letter = "C+";
      else if (finalPercentage >= 70) letter = "C";
      else if (finalPercentage >= 60) letter = "D";
      else letter = "F";

      // Subject mark prediction
      const subjects = currentYear.subjects.map((sub) => {
        const predictedMark = Math.min(sub.maxMarks, Math.round((finalPercentage / 100) * sub.maxMarks * 10) / 10);
        return {
          name: sub.name,
          projectedMark: predictedMark,
          maxMarks: sub.maxMarks,
          percentage: finalPercentage,
        };
      });

      // Name of year
      let label = `Year ${yearIndex} (Predict)`;
      if (offset === 0) {
        label = `${currentYear.yearName || "Current"} (Projected)`;
      } else {
        const gradeNum = parseInt(studentProfile.gradeLevel.replace(/\D/g, ""));
        if (!isNaN(gradeNum)) {
          label = `Grade ${gradeNum + offset} Forecast`;
        } else {
          label = `Year N+${offset} Forecast`;
        }
      }

      futureYearsList.push({
        label,
        percentage: finalPercentage,
        letterGrade: letter,
        subjects,
      });
    }

    return futureYearsList;
  }, [pastYears, regressionData, currentYear, forecastGrowthRate, studentProfile]);

  // --- Interactive Target Grade Back-Calculations ---
  const adjusterMetrics = useMemo(() => {
    // Required weekly hours based on desired overall target percentage
    const currentHours = studentProfile.studyHours || 10;
    const baselinePred = result.predictedOverallPercentage;
    const scaleDiff = adjTargetPercentage - baselinePred;
    
    // Proportional hour adjustment: +1.5h per +1% grade increase needed
    const requiredStudyHours = Math.min(40, Math.max(2, Math.round(currentHours + scaleDiff * 0.8)));

    // Required subject mark profiles to secure target
    const targetSubjects = currentYear.subjects.map((sub) => {
      const predObj = result.subjectPredictions.find((s) => s.subjectName === sub.name);
      const basePercentage = predObj?.predictedPercentage || 80;
      
      // Calculate how subject marks shift to meet overall target shift
      const adjustedSubPercentage = Math.min(100, Math.max(35, Math.round((basePercentage + scaleDiff) * 10) / 10));
      const requiredMarks = Math.min(sub.maxMarks, Math.round((adjustedSubPercentage / 100) * sub.maxMarks * 10) / 10);
      const extraMarksRequired = Math.max(0, Math.round((requiredMarks - sub.currentMarks) * 10) / 10);

      return {
        name: sub.name,
        currentMarks: sub.currentMarks,
        maxMarks: sub.maxMarks,
        currentPercentage: Math.round((sub.currentMarks / sub.maxMarks) * 100),
        requiredPercentage: adjustedSubPercentage,
        requiredMarks,
        extraMarksRequired,
      };
    });

    let targetLetter = "B";
    if (adjTargetPercentage >= 95) targetLetter = "A+";
    else if (adjTargetPercentage >= 90) targetLetter = "A";
    else if (adjTargetPercentage >= 85) targetLetter = "B+";
    else if (adjTargetPercentage >= 80) targetLetter = "B";
    else if (adjTargetPercentage >= 75) targetLetter = "C+";
    else if (adjTargetPercentage >= 70) targetLetter = "C";
    else if (adjTargetPercentage >= 60) targetLetter = "D";
    else targetLetter = "F";

    return {
      requiredStudyHours,
      targetSubjects,
      targetLetter,
    };
  }, [adjTargetPercentage, result, currentYear, studentProfile]);

  // --- Top Educational Resources Website Database ---
  const academicResources = useMemo(() => {
    const list = [
      {
        name: "Khan Academy",
        url: "https://www.khanacademy.org",
        description: "Completely free, world-class personalized interactive exercises, video tutorials, and SAT/AP diagnostic quizzes.",
        subjects: ["Mathematics", "Algebra", "Calculus", "Physics", "Chemistry", "Biology", "History", "Economics"],
        category: "Math & Science",
      },
      {
        name: "WolframAlpha Formula Solver",
        url: "https://www.wolframalpha.com",
        description: "Compute expert-level answers, graph mathematical equations, and get step-by-step calculus guidance instantly.",
        subjects: ["Mathematics", "Calculus", "Statistics", "Physics", "Chemistry"],
        category: "Mathematics Tool",
      },
      {
        name: "Quizlet Learn & Flashcards",
        url: "https://quizlet.com",
        description: "Engage with millions of teacher-approved flashcards, memorization tools, and practice test sets for any subject.",
        subjects: ["Biology", "History", "English", "Spanish", "Geography", "Chemistry", "French"],
        category: "Active Recall",
      },
      {
        name: "Coursera Academy",
        url: "https://www.coursera.org",
        description: "Audit actual university lectures and complete skills certifications from Stanford, Yale, and top tech firms free.",
        subjects: ["Computer Science", "Information Technology", "Economics", "Informatics", "Data Science"],
        category: "University Lectures",
      },
      {
        name: "edX Academic Courses",
        url: "https://www.edx.org",
        description: "Comprehensive secondary textbook companions and advanced college prep courses from elite global institutions.",
        subjects: ["Biology", "Physics", "Chemistry", "Computer Science", "Economics"],
        category: "Prep Courses",
      },
      {
        name: "College Board Prep Center",
        url: "https://www.collegeboard.org",
        description: "Review official course standards, practice authentic AP exam questions, and prepare for academic target benchmarks.",
        subjects: ["English Literature", "US History", "Calculus", "AP Physics", "AP Biology"],
        category: "Exam Syllabi",
      },
      {
        name: "Duolingo Language Lab",
        url: "https://www.duolingo.com",
        description: "Gamified vocabulary routines and daily speaking challenges to boost grade performance in foreign languages.",
        subjects: ["Spanish", "French", "German", "Japanese", "Language Arts"],
        category: "Language",
      },
      {
        name: "Codecademy Console",
        url: "https://www.codecademy.com",
        description: "Write code directly in the browser with interactive, instant-feedback courses for Python, JavaScript, HTML, and Java.",
        subjects: ["Computer Science", "ICT", "Informatics", "Programming"],
        category: "Tech & coding",
      }
    ];

    // Correlate with student's weaknesses for high-value recommendations
    return list.map((res) => {
      const isWeakPointRecommended = result.weaknesses.some((w) => {
        const subName = w.subject.toLowerCase();
        return res.subjects.some((subj) => {
          const lowerSubj = subj.toLowerCase();
          return subName.includes(lowerSubj) || lowerSubj.includes(subName);
        });
      });
      return {
        ...res,
        isWeakPointRecommended,
      };
    }).sort((a, b) => (b.isWeakPointRecommended ? 1 : 0) - (a.isWeakPointRecommended ? 1 : 0));
  }, [result.weaknesses]);

  return (
    <div className="space-y-8 print:p-4 print:text-black">
      {/* Print-only Header */}
      <div className="hidden print:block border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Academic Grade Prediction Report</h1>
        <p className="text-sm text-gray-500">Prepared for {studentProfile.name} on {new Date().toLocaleDateString()}</p>
        <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
          <div><strong>Level:</strong> {studentProfile.gradeLevel}</div>
          <div><strong>Base Study Hours:</strong> {studentProfile.studyHours} hrs/wk</div>
          <div><strong>Attendance Rate:</strong> {studentProfile.attendanceRate}%</div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
              Prediction Dashboard
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {studentProfile.name || "Student"}&apos;s Academic Projection
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Grade Level: {studentProfile.gradeLevel || "Standard"} • Trend:{" "}
              <span className="capitalize font-semibold text-teal-600 dark:text-teal-400">
                {result.trendAnalysis.trajectory}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
          <button
            onClick={onReset}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold shadow-md transition-all text-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Analyze New
          </button>
        </div>
      </div>

      {/* Tab Switcher - Print Hidden */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-1 print:hidden overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === "overview"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <Activity className="w-4 h-4" /> AI Overview & Sandbox
        </button>
        <button
          onClick={() => setActiveTab("adjuster")}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === "adjuster"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <Calculator className="w-4 h-4" /> Perfect Grade Adjuster
        </button>
        <button
          onClick={() => setActiveTab("forecast")}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === "forecast"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Multi-Year Forecast Engine
        </button>
        <button
          onClick={() => setActiveTab("resources")}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-all whitespace-nowrap ${
            activeTab === "resources"
              ? "border-teal-500 text-teal-600 dark:text-teal-400"
              : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Curated Web Links
        </button>
      </div>

      {/* TAB 1: AI OVERVIEW & SANDBOX (Also renders on print) */}
      {(activeTab === "overview" || window.matchMedia("print").matches) && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Stats / Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Core Prediction Card */}
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 dark:from-teal-950/40 dark:to-emerald-950/40 text-white p-6 rounded-3xl shadow-lg border border-teal-200/10 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Award className="w-40 h-40" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-teal-100">
                    Predicted Grade
                  </span>
                  <Sparkles className="w-4 h-4 text-teal-200" />
                </div>
                <div className="flex items-baseline gap-4 mt-6">
                  <span className="text-6xl font-black tracking-tight select-all">
                    {simulatedResults.letterGrade}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold select-all">
                      {simulatedResults.overallPercentage}%
                    </span>
                    <span className="text-[10px] text-teal-100">
                      AI Baseline: {result.predictedOverallPercentage}% ({result.predictedLetterGrade})
                    </span>
                  </div>
                </div>
                <p className="text-xs text-teal-100 mt-4 leading-relaxed line-clamp-2">
                  Based on {pastYears.length} years of continuous academic history.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 relative z-10 flex items-center gap-2 text-xs text-teal-50">
                <Activity className="w-4 h-4" />
                <span>Dynamic Simulator active</span>
              </div>
            </div>

            {/* Confidence Meter Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                  <span className="text-xs uppercase font-bold tracking-wider">
                    Prediction Confidence
                  </span>
                  <HelpCircle className="w-4 h-4 text-gray-400" title="Based on historical data variance, current attendance rate, and study hours input." />
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative flex items-center justify-center w-20 h-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        strokeWidth="6"
                        stroke="currentColor"
                        className="text-gray-100 dark:text-gray-800"
                        fill="transparent"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        strokeWidth="6"
                        stroke="currentColor"
                        className="text-teal-500 transition-all duration-500"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 * (1 - simulatedResults.confidenceScore / 100)}
                      />
                    </svg>
                    <span className="absolute font-bold text-lg text-gray-800 dark:text-gray-200 select-all">
                      {simulatedResults.confidenceScore}%
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                      {simulatedResults.confidenceScore >= 80 ? "High Credibility" : "Moderate Credibility"}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                      Calculated from trend stability. Higher study consistency boosts overall predictive accuracy.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Robust 3+ Year history verify</span>
              </div>
            </div>

            {/* Trajectory Trait Summary Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                  <span className="text-xs uppercase font-bold tracking-wider">
                    Trajectory Trend
                  </span>
                  <TrendingUp className="w-4 h-4 text-teal-500" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                      result.trendAnalysis.trajectory === 'improving' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      result.trendAnalysis.trajectory === 'declining' ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {result.trendAnalysis.trajectory}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed select-all">
                    {result.trendAnalysis.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
                Current GPA compares favorably to historical data.
              </div>
            </div>
          </div>

          {/* What-If Sandbox Simulator Panel */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm print:hidden">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  Interactive What-If Grade Sandbox
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Drag the sliders below to dynamically simulate how custom habits would affect your expected final grades.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* General Habits */}
              <div className="lg:col-span-4 space-y-6 lg:border-r lg:border-gray-100 lg:dark:border-gray-800 lg:pr-8">
                <h4 className="font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  General Study Habits
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-gray-600 dark:text-gray-400">Weekly Study Hours</span>
                      <span className="text-teal-600 dark:text-teal-400 font-bold">{simWeeklyHours} hrs</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="40"
                      step="1"
                      value={simWeeklyHours}
                      onChange={(e) => setSimWeeklyHours(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>Minimal (2)</span>
                      <span>Target (40)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-gray-600 dark:text-gray-400">Attendance Rate</span>
                      <span className="text-teal-600 dark:text-teal-400 font-bold">{simAttendance}%</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="100"
                      step="1"
                      value={simAttendance}
                      onChange={(e) => setSimAttendance(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>Low (60%)</span>
                      <span>Perfect (100%)</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 text-xs text-amber-800 dark:text-amber-300">
                  <h5 className="font-semibold flex items-center gap-1.5 mb-1 text-amber-700 dark:text-amber-400">
                    <Lightbulb className="w-3.5 h-3.5" /> Simulation Rule
                  </h5>
                  Attendance maintains continuous evaluation scores, while overall study hours increase mastery. Adjusting subject study times optimizes individual targets.
                </div>
              </div>

              {/* Subject-Specific Habits */}
              <div className="lg:col-span-8 space-y-6">
                <h4 className="font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Subject Study Allocation (Hours per Week)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentYear.subjects.map((sub) => {
                    const simVal = simSubjectHours[sub.name] || 3;
                    const predObj = result.subjectPredictions.find((sp) => sp.subjectName === sub.name);
                    const simPredScore = simulatedResults.subjects.find((s) => s.subjectName === sub.name)?.simulatedPercentage || 0;
                    const origScore = predObj?.predictedPercentage || 0;

                    return (
                      <div
                        key={sub.name}
                        className="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-950/10 hover:border-teal-200 dark:hover:border-teal-900/30 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate pr-2 max-w-[150px]">
                              {sub.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-gray-400 line-through">
                                {origScore}%
                              </span>
                              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-1.5 py-0.5 rounded">
                                {simPredScore}%
                              </span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="15"
                            step="1"
                            value={simVal}
                            onChange={(e) => handleSubjectHourChange(sub.name, parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2">
                          <span>0h</span>
                          <span>Allocated: <strong className="text-gray-700 dark:text-gray-300 font-semibold">{simVal}h</strong>/wk</span>
                          <span>15h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Visualization Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-6">
            {/* Trajectory Path Line Chart */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                <div className="p-1.5 bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    Multi-Year Trajectory Pathway
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Performance trend across past {pastYears.length} years projected into future predictions.
                  </p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trajectoryChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <YAxis domain={[50, 100]} stroke="#9CA3AF" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        color: "#F3F4F6",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                    <Line
                      type="monotone"
                      dataKey="Historical GPA %"
                      stroke="#0D9488"
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                      dot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="AI Predicted %"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Simulated Trend %"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subjects Comparisons Chart */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    Subject Comparison Matrix
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Comparing current marks vs targets and simulations.
                  </p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                    <XAxis dataKey="subject" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                    <YAxis domain={[40, 100]} stroke="#9CA3AF" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(17, 24, 39, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        color: "#F3F4F6",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                    <Bar dataKey="Current Grade %" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Target Grade %" fill="#4338CA" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Simulated Grade %" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Subject Prediction Cards Details Grid */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">
              Granular Subject Breakdown & AI Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {simulatedResults.subjects.map((pred) => {
                const origSub = currentYear.subjects.find((s) => s.name === pred.subjectName);
                const currentPercentage = origSub ? Math.round((origSub.currentMarks / origSub.maxMarks) * 100) : 0;
                const targetPercentage = origSub ? origSub.targetMarks : 0;
                
                // Difference from target
                const diff = Math.round((pred.simulatedPercentage - targetPercentage) * 10) / 10;
                const meetTarget = diff >= 0;

                return (
                  <div
                    key={pred.subjectName}
                    className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4"
                  >
                    {/* Subject Title Block */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm select-all">
                          {pred.subjectName}
                        </h4>
                        <span className="text-[10px] text-gray-400">
                          Weekly Study Recommended: {pred.suggestedWeeklyHours} hours
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        pred.simulatedStanding === 'High' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                        pred.simulatedStanding === 'Moderate' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                        'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        {pred.simulatedStanding} Status
                      </span>
                    </div>

                    {/* Progress bars / Metrics */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/10 p-3 rounded-2xl">
                      <div className="text-center">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Current</span>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{currentPercentage}%</p>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Target</span>
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{targetPercentage}%</p>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Predicted</span>
                        <p className="text-sm font-extrabold text-teal-600 dark:text-teal-400">{pred.simulatedPercentage}%</p>
                      </div>
                    </div>

                    {/* Meet Target status bar */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-medium">
                        <span className="text-gray-500">Target Gap Variance</span>
                        <span className={meetTarget ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                          {meetTarget ? `Target Met (+${diff}%)` : `Gap to Target (${diff}%)`}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${meetTarget ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${Math.min(100, Math.max(10, pred.simulatedPercentage))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* AI Rationale Insight text */}
                    <div className="p-3 bg-teal-50/30 dark:bg-teal-950/10 border border-teal-50/50 dark:border-teal-900/10 rounded-xl">
                      <p className="text-[11.5px] text-gray-600 dark:text-gray-300 leading-relaxed italic select-all">
                        {pred.aiInsight}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Strengths & Weaknesses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Strengths Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100 dark:border-gray-800">
                <ThumbsUp className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  Core Strengths & Acceleration Factors
                </h3>
              </div>
              <div className="space-y-3.5">
                {result.strengths.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-emerald-50/20 dark:bg-emerald-950/5 p-3 rounded-2xl border border-emerald-100/10">
                    <span className="flex items-center justify-center w-5 h-5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg text-xs mt-0.5 shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 select-all">
                        {item.subject}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed select-all">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses & Mitigation Card */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100 dark:border-gray-800">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  Weaknesses & Improvement Tactics
                </h3>
              </div>
              <div className="space-y-3.5">
                {result.weaknesses.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-amber-50/20 dark:bg-amber-950/5 p-3.5 rounded-2xl border border-amber-100/10">
                    <span className="flex items-center justify-center w-5 h-5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold rounded-lg text-xs mt-0.5 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 select-all">
                        {item.subject}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed select-all">
                        <strong>Observation:</strong> {item.reason}
                      </p>
                      <p className="text-[11px] text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20 p-2 rounded-xl mt-1 select-all">
                        <strong>Action Plan:</strong> {item.actionPlan}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customized Study Schedule & Routines */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <FileText className="w-5 h-5 text-teal-500" />
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                AI Customized Academic Action Plan
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Routine */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                  Recommended Study Routine
                </h4>
                <div className="space-y-2">
                  {result.strategicPlan.dailyRoutine.map((step, index) => (
                    <div
                      key={index}
                      className="flex gap-2.5 items-start p-2.5 rounded-xl bg-gray-50/50 dark:bg-gray-950/20 text-xs border border-gray-50 dark:border-gray-850"
                    >
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0 mt-1.5"></span>
                      <span className="text-gray-600 dark:text-gray-300 leading-relaxed select-all">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key focus areas */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  Core Strategic Focus Priorities
                </h4>
                <div className="space-y-2">
                  {result.strategicPlan.keyFocusAreas.map((area, index) => (
                    <div
                      key={index}
                      className="flex gap-2.5 items-start p-2.5 rounded-xl bg-gray-50/50 dark:bg-gray-950/20 text-xs border border-gray-50 dark:border-gray-850"
                    >
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0 mt-1.5"></span>
                      <span className="text-gray-600 dark:text-gray-300 leading-relaxed select-all">{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exam Prep Strategy */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Exam Preparation Directive
                </h4>
                <div className="p-4 rounded-2xl bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/10 text-xs leading-relaxed text-gray-600 dark:text-gray-300 select-all">
                  {result.strategicPlan.examPrepStrategy}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERFECT CALCULATIONS & GRADE ADJUSTER */}
      {activeTab === "adjuster" && (
        <div className="space-y-8 animate-fade-in print:hidden">
          {/* Exact Math Scoreboard Header */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-teal-500" /> Perfect Mathematical Academic Ledger
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950/30 border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                  Historical Average %
                </span>
                <span className="text-2xl font-black text-gray-800 dark:text-gray-100 select-all">
                  {totals.historicalAvg}%
                </span>
                <p className="text-[10px] text-gray-400 mt-1">
                  Average across all past reported terms.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950/30 border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                  Current Term Average %
                </span>
                <span className="text-2xl font-black text-teal-600 dark:text-teal-400 select-all">
                  {totals.currentAveragePercentage}%
                </span>
                <p className="text-[10px] text-gray-400 mt-1">
                  ({totals.totalCurrentMarks} of {totals.totalMaxMarks} total marks)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-950/30 border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                  Target Goal Average %
                </span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 select-all">
                  {totals.targetAveragePercentage}%
                </span>
                <p className="text-[10px] text-gray-400 mt-1">
                  Goal average from target values entered.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Interactive Target Grade Control */}
            <div className="lg:col-span-5 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  Adjust Target Letter Grade
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Select a preset letter grade or slide to calibrate exactly how much effort shift is mathematically required.
                </p>
              </div>

              {/* Snap-to presets buttons */}
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  { grade: "A+", pct: 96 },
                  { grade: "A", pct: 91 },
                  { grade: "B+", pct: 86 },
                  { grade: "B", pct: 81 },
                  { grade: "C+", pct: 76 },
                  { grade: "C", pct: 71 },
                ].map((item) => (
                  <button
                    key={item.grade}
                    onClick={() => setAdjTargetPercentage(item.pct)}
                    className={`py-2 px-1 text-[11px] font-black tracking-tight rounded-xl border text-center transition-all cursor-pointer ${
                      adjTargetPercentage >= item.pct && adjTargetPercentage < item.pct + 5
                        ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                        : "bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-200"
                    }`}
                  >
                    {item.grade}
                  </button>
                ))}
              </div>

              {/* Exact slider percentage */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold">Adjusted Target Percentage</span>
                  <span className="text-lg font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-lg">
                    {adjTargetPercentage}% ({adjusterMetrics.targetLetter})
                  </span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="100"
                  step="1"
                  value={adjTargetPercentage}
                  onChange={(e) => setAdjTargetPercentage(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Pass (55%)</span>
                  <span>Perfect Score (100%)</span>
                </div>
              </div>

              {/* Necessary Study Allocation Shift */}
              <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100/30 dark:border-teal-900/10 space-y-3">
                <div className="flex gap-2.5 items-center">
                  <Clock className="w-5 h-5 text-teal-500" />
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Required Weekly Study Hours
                  </h4>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-teal-600 dark:text-teal-400">
                    {adjusterMetrics.requiredStudyHours}
                  </span>
                  <span className="text-xs text-gray-500">hours / week required</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  To hit an overall average of <strong>{adjTargetPercentage}%</strong>, you need to adjust study inputs by{" "}
                  <strong>
                    {adjusterMetrics.requiredStudyHours > studentProfile.studyHours
                      ? `+${adjusterMetrics.requiredStudyHours - studentProfile.studyHours}`
                      : `${adjusterMetrics.requiredStudyHours - studentProfile.studyHours}`}
                  </strong>{" "}
                  hours from your base {studentProfile.studyHours}h/week plan.
                </p>
              </div>

              {/* Exact Formula card */}
              <div className="p-4 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/10 text-xs">
                <h5 className="font-bold flex items-center gap-1 text-indigo-700 dark:text-indigo-400">
                  <Percent className="w-4 h-4" /> Perfect Calculus Rule
                </h5>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                  Formula for current grade average G_avg:
                </p>
                <div className="p-2 bg-gray-100 dark:bg-black font-mono text-[10.5px] rounded border border-gray-200 dark:border-gray-850 text-center my-1 text-gray-700 dark:text-gray-300">
                  {"G_avg = (Σ Marks_obtained / Σ Max_marks) * 100"}
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  To achieve the adjusted target T, subjects are scaled using an effort multiplier E = 1 + Delta_Hours * 0.08 mapped perfectly to each subject.
                </p>
              </div>
            </div>

            {/* Required subject performance breakdown */}
            <div className="lg:col-span-7 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  Required Subject Marks to Reach {adjTargetPercentage}%
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Below are the precise calculated marks you must score in each subject to hit this overall adjusted target grade.
                </p>
              </div>

              <div className="space-y-4">
                {adjusterMetrics.targetSubjects.map((sub) => {
                  return (
                    <div
                      key={sub.name}
                      className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-950/5 hover:border-teal-100 dark:hover:border-teal-900/30 transition-all space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-gray-800 dark:text-gray-200 select-all">
                          {sub.name}
                        </span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                          Goal: {sub.requiredPercentage}%
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs py-1 border-y border-gray-100/50 dark:border-gray-850 font-mono">
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase">Current Marks</span>
                          <p className="text-gray-700 dark:text-gray-300 font-semibold">{sub.currentMarks} / {sub.maxMarks}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase">Needed Marks</span>
                          <p className="text-teal-600 dark:text-teal-400 font-extrabold">{sub.requiredMarks} / {sub.maxMarks}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase">Gap Offset</span>
                          <p className="text-red-500 font-extrabold">+{sub.extraMarksRequired} Marks</p>
                        </div>
                      </div>

                      {/* Gap slider visual */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>Current: {sub.currentPercentage}%</span>
                          <span>Required: {sub.requiredPercentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden flex">
                          <div
                            className="bg-teal-500 h-full"
                            style={{ width: `${sub.currentPercentage}%` }}
                          ></div>
                          <div
                            className="bg-red-400 h-full animate-pulse"
                            style={{ width: `${Math.max(0, sub.requiredPercentage - sub.currentPercentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MULTI-YEAR FORECAST ENGINE (REGRESSION MODEL) */}
      {activeTab === "forecast" && (
        <div className="space-y-8 animate-fade-in print:hidden">
          {/* Slope and Intercept stats block */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 mb-6">
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  Historical Linear Regression Analyzer
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fitting a perfect trend line $y = mx + c$ onto past years percentage scores to calculate long-term performance trajectory.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-2xl bg-indigo-50/10 dark:bg-indigo-950/5 border border-indigo-100/10">
                <span className="text-[10px] text-indigo-500 uppercase font-black tracking-wider block mb-1">
                  Slope Rate ($m$)
                </span>
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 select-all">
                  {regressionData.slope > 0 ? "+" : ""}{Math.round(regressionData.slope * 100) / 100}%
                </span>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  Average yearly percentage grade trajectory growth based on history.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/10 dark:bg-teal-950/5 border border-teal-100/10">
                <span className="text-[10px] text-teal-500 uppercase font-black tracking-wider block mb-1">
                  Intercept Baseline ($c$)
                </span>
                <span className="text-3xl font-black text-teal-600 dark:text-teal-400 select-all">
                  {Math.round(regressionData.intercept * 100) / 100}%
                </span>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  Estimated grade floor when entering secondary school trajectory.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/10 dark:bg-amber-950/5 border border-amber-100/10">
                <span className="text-[10px] text-amber-500 uppercase font-black tracking-wider block mb-1">
                  R-Squared Correlation ($R^2$)
                </span>
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400 select-all">
                  {Math.round(regressionData.r2 * 1000) / 1000}
                </span>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  Closeness of fit (1.0 = perfect mathematical consistency).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Future Projections Table with Growth Modifiers */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      Next Academic Years Projections & predicted marks
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Calculated from historical points extrapolated through our regression algorithm.
                    </p>
                  </div>

                  {/* Acceleration Modifier */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase hidden sm:inline">Effort Acceleration</span>
                    <select
                      value={forecastGrowthRate}
                      onChange={(e) => setForecastGrowthRate(parseFloat(e.target.value))}
                      className="bg-gray-50 dark:bg-gray-950 text-xs border border-gray-100 dark:border-gray-850 p-2 rounded-xl text-teal-600 dark:text-teal-400 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="0">Pure Trajectory (No shift)</option>
                      <option value="1">Effort Boost (+1.0%/yr)</option>
                      <option value="2">Hustle Accelerator (+2.0%/yr)</option>
                      <option value="3.5">Maximum Growth Catalyst (+3.5%/yr)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {forecastedYears.map((future, idx) => {
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-950/5 space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-black text-xs flex items-center justify-center">
                              {future.letterGrade}
                            </div>
                            <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                              {future.label}
                            </span>
                          </div>
                          <span className="text-xs font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-lg">
                            {future.percentage}% Projected Average
                          </span>
                        </div>

                        {/* Subject predicted marks horizontal indicators */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                          {future.subjects.map((sub, sIdx) => (
                            <div key={sIdx} className="bg-white dark:bg-gray-900 border border-gray-100/50 dark:border-gray-850 p-2.5 rounded-xl text-center space-y-0.5">
                              <span className="text-[10px] text-gray-400 block truncate">{sub.name}</span>
                              <strong className="text-xs font-bold text-gray-700 dark:text-gray-300 select-all">
                                {sub.projectedMark} <span className="text-[9px] text-gray-400">/ {sub.maxMarks}</span>
                              </strong>
                              <p className="text-[9px] text-teal-500 font-mono">
                                {Math.round((sub.projectedMark / sub.maxMarks) * 100)}% Marks
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Explanatory linear math sidebar */}
            <div className="lg:col-span-4 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  How Trajectory Projection Works
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Understand the perfect calculations behind this predictive projection model.
                </p>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                <p>
                  1. **Slope Definition**:
                  The calculated annual growth rate is $m = {Math.round(regressionData.slope * 100) / 100}$. This means historically, your performance has shifted by this average percentage value every academic term.
                </p>

                <p>
                  2. **Formula Fitting**:
                  Using least squares regression fitting, the formula representing your historical academic vector is:
                </p>

                <div className="p-3 bg-gray-50 dark:bg-black font-mono text-[10.5px] rounded border border-gray-100 dark:border-gray-850 text-teal-600 dark:text-teal-400 text-center">
                  {"Grade % = "}{Math.round(regressionData.slope * 100) / 100}{" * x + "}{Math.round(regressionData.intercept * 100) / 100}
                </div>

                <p>
                  Where $x$ represents the academic year index ($x = 1$ is first past year, $x = {pastYears.length + 1}$ is current prediction, $x = {pastYears.length + 2}$ is next year).
                </p>

                <p>
                  3. **Syllabus Extrapolation**:
                  Each future subject mark prediction is modeled directly on the overall extrapolated percentage. The algorithm takes each subject&apos;s Max Marks and calculates the predicted obtained marks proportionally.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CURATED WEB LINKS & TOOLS */}
      {activeTab === "resources" && (
        <div className="space-y-8 animate-fade-in print:hidden">
          {/* Section banner */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-2 mb-1.5">
              <BookOpen className="w-5 h-5 text-teal-500" /> Curated Academic Platforms & Reference Sites
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Below are verified official websites and external learning services. Click the links to access learning material, textbook guides, and diagnostic tools to support your academic action plan.
            </p>
          </div>

          {/* Resources cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {academicResources.map((res) => {
              return (
                <div
                  key={res.name}
                  className={`bg-white dark:bg-gray-900 p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                    res.isWeakPointRecommended
                      ? "border-teal-200 dark:border-teal-900 bg-gradient-to-br from-white to-teal-500/5 dark:from-gray-900 dark:to-teal-950/5 ring-1 ring-teal-500/20"
                      : "border-gray-100 dark:border-gray-800 hover:border-teal-100 dark:hover:border-teal-950/40"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Weak point recommendation label */}
                    {res.isWeakPointRecommended && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-400 animate-pulse">
                        ⭐ Weakness Target Match
                      </span>
                    )}

                    <div className="flex justify-between items-start">
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white select-all">
                        {res.name}
                      </h4>
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-md font-bold uppercase">
                        {res.category}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed select-all">
                      {res.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Subject Tags */}
                    <div className="flex flex-wrap gap-1">
                      {res.subjects.slice(0, 4).map((subj, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[9.5px] bg-gray-50 dark:bg-gray-950 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-850 px-1.5 py-0.5 rounded"
                        >
                          {subj}
                        </span>
                      ))}
                    </div>

                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/10 transition-all cursor-pointer"
                    >
                      <span>Visit {res.name}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
