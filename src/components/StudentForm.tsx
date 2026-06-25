import React, { useState } from "react";
import { StudentProfile, AcademicYear, CurrentSubject } from "../types";
import { sampleProfiles } from "../sampleData";
import {
  User,
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  Clock,
  Percent,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";

interface StudentFormProps {
  studentProfile: StudentProfile;
  setStudentProfile: React.Dispatch<React.SetStateAction<StudentProfile>>;
  pastYears: AcademicYear[];
  setPastYears: React.Dispatch<React.SetStateAction<AcademicYear[]>>;
  currentYear: {
    yearName: string;
    subjects: CurrentSubject[];
  };
  setCurrentYear: React.Dispatch<
    React.SetStateAction<{
      yearName: string;
      subjects: CurrentSubject[];
    }>
  >;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function StudentForm({
  studentProfile,
  setStudentProfile,
  pastYears,
  setPastYears,
  currentYear,
  setCurrentYear,
  onSubmit,
  isLoading,
}: StudentFormProps) {
  const [expandedYearId, setExpandedYearId] = useState<string | null>(null);

  // Helper to load sample profile
  const handleLoadSample = (sampleIndex: number) => {
    const sample = sampleProfiles[sampleIndex];
    setStudentProfile({ ...sample.studentProfile });
    setPastYears(JSON.parse(JSON.stringify(sample.pastYears)));
    setCurrentYear(JSON.parse(JSON.stringify(sample.currentYear)));
  };

  // Add a past year (requires at least 3 years, but user can add more "+" years)
  const handleAddPastYear = () => {
    const newId = `y_${Date.now()}`;
    const yearNumber = pastYears.length + 1;
    const newYear: AcademicYear = {
      id: newId,
      yearName: `Year -${yearNumber} (${new Date().getFullYear() - yearNumber})`,
      overallPercentage: 80,
      subjects: [
        { id: `s_${Date.now()}_1`, name: "Mathematics", marks: 80, maxMarks: 100 },
        { id: `s_${Date.now()}_2`, name: "Science", marks: 80, maxMarks: 100 },
        { id: `s_${Date.now()}_3`, name: "English", marks: 80, maxMarks: 100 },
      ],
    };
    setPastYears([...pastYears, newYear]);
    setExpandedYearId(newId);
  };

  const handleRemovePastYear = (id: string) => {
    if (pastYears.length <= 3) {
      alert("To predict accurately, we require at least 3 years of academic history.");
      return;
    }
    setPastYears(pastYears.filter((y) => y.id !== id));
  };

  const handlePastYearChange = (id: string, field: keyof AcademicYear, value: any) => {
    setPastYears(
      pastYears.map((y) => {
        if (y.id === id) {
          return { ...y, [field]: value };
        }
        return y;
      })
    );
  };

  // Subjects inside past years
  const handleAddPastSubject = (yearId: string) => {
    setPastYears(
      pastYears.map((y) => {
        if (y.id === yearId) {
          const updatedSubjects = [
            ...y.subjects,
            { id: `s_${Date.now()}`, name: "New Subject", marks: 80, maxMarks: 100 },
          ];
          // Auto calculate overall percentage
          const avg = Math.round(
            (updatedSubjects.reduce((sum, s) => sum + s.marks, 0) /
              updatedSubjects.reduce((sum, s) => sum + s.maxMarks, 0)) *
              100
          );
          return { ...y, subjects: updatedSubjects, overallPercentage: avg };
        }
        return y;
      })
    );
  };

  const handleRemovePastSubject = (yearId: string, subjectId: string) => {
    setPastYears(
      pastYears.map((y) => {
        if (y.id === yearId) {
          const updatedSubjects = y.subjects.filter((s) => s.id !== subjectId);
          let avg = y.overallPercentage;
          if (updatedSubjects.length > 0) {
            avg = Math.round(
              (updatedSubjects.reduce((sum, s) => sum + s.marks, 0) /
                updatedSubjects.reduce((sum, s) => sum + s.maxMarks, 0)) *
                100
            );
          }
          return { ...y, subjects: updatedSubjects, overallPercentage: avg };
        }
        return y;
      })
    );
  };

  const handlePastSubjectChange = (
    yearId: string,
    subjectId: string,
    field: "name" | "marks" | "maxMarks",
    value: any
  ) => {
    setPastYears(
      pastYears.map((y) => {
        if (y.id === yearId) {
          const updatedSubjects = y.subjects.map((s) => {
            if (s.id === subjectId) {
              const updatedVal = field === "name" ? value : parseFloat(value) || 0;
              return { ...s, [field]: updatedVal };
            }
            return s;
          });
          // Auto calculate overall percentage
          const totalMarks = updatedSubjects.reduce((sum, s) => sum + s.marks, 0);
          const totalMax = updatedSubjects.reduce((sum, s) => sum + s.maxMarks, 0);
          const avg = totalMax > 0 ? Math.round((totalMarks / totalMax) * 100) : y.overallPercentage;

          return { ...y, subjects: updatedSubjects, overallPercentage: avg };
        }
        return y;
      })
    );
  };

  // Current Year subjects
  const handleAddCurrentSubject = () => {
    const newSub: CurrentSubject = {
      id: `c_${Date.now()}`,
      name: "New Subject",
      currentMarks: 75,
      maxMarks: 100,
      studyHoursPerWeek: 3,
      targetMarks: 85,
    };
    setCurrentYear({
      ...currentYear,
      subjects: [...currentYear.subjects, newSub],
    });
  };

  const handleRemoveCurrentSubject = (id: string) => {
    if (currentYear.subjects.length <= 1) {
      alert("At least one subject is required for the target year.");
      return;
    }
    setCurrentYear({
      ...currentYear,
      subjects: currentYear.subjects.filter((s) => s.id !== id),
    });
  };

  const handleCurrentSubjectChange = (id: string, field: keyof CurrentSubject, value: any) => {
    setCurrentYear({
      ...currentYear,
      subjects: currentYear.subjects.map((s) => {
        if (s.id === id) {
          const processedVal = field === "name" ? value : parseFloat(value) || 0;
          return { ...s, [field]: processedVal };
        }
        return s;
      }),
    });
  };

  return (
    <div className="space-y-8">
      {/* Sample Loader Header */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-5 rounded-2xl border border-teal-100 dark:border-teal-900/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-teal-500 text-white rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              Instant Setup (Best UX Preset)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Load an academic template instantly to skip form-filling and test the predictive AI right away!
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sampleProfiles.map((p, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleLoadSample(index)}
              className="flex flex-col text-left p-3 rounded-xl border border-teal-200/50 bg-white dark:bg-gray-900 hover:border-teal-500 transition-all shadow-sm hover:shadow group cursor-pointer"
            >
              <span className="font-medium text-xs text-teal-600 dark:text-teal-400 group-hover:text-teal-700">
                {p.label}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                {p.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: General Profile & Current Enrollment */}
        <div className="lg:col-span-7 space-y-8">
          {/* General Profile Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <User className="w-5 h-5 text-teal-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Student Profile</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={studentProfile.name}
                  onChange={(e) => setStudentProfile({ ...studentProfile, name: e.target.value })}
                  placeholder="e.g. Liam Smith"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-850 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none text-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Education Level / Grade
                </label>
                <input
                  type="text"
                  value={studentProfile.gradeLevel}
                  onChange={(e) => setStudentProfile({ ...studentProfile, gradeLevel: e.target.value })}
                  placeholder="e.g. University Year 3, Grade 11"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-850 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none text-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Study Hours (Per Week)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={studentProfile.studyHours || ""}
                    onChange={(e) =>
                      setStudentProfile({ ...studentProfile, studyHours: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="e.g. 15"
                    min="0"
                    max="168"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-850 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none text-gray-800 dark:text-gray-200"
                  />
                  <Clock className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Attendance Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={studentProfile.attendanceRate || ""}
                    onChange={(e) =>
                      setStudentProfile({
                        ...studentProfile,
                        attendanceRate: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                      })
                    }
                    placeholder="e.g. 95"
                    min="0"
                    max="100"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-850 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none text-gray-800 dark:text-gray-200"
                  />
                  <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Extracurriculars, Focus Areas & Goals
              </label>
              <textarea
                value={studentProfile.academicProfile}
                onChange={(e) => setStudentProfile({ ...studentProfile, academicProfile: e.target.value })}
                placeholder="Describe your student profile, hobbies, sports, target university, or specific challenges..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-850 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none min-h-[60px] text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Current Target Year Subjects */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-teal-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Target Year Subjects ({currentYear.yearName || "Current"})
                  </h3>
                  <p className="text-[11px] text-gray-400">Add current grades to compare vs targets.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddCurrentSubject}
                className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 text-xs font-medium rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subject
              </button>
            </div>

            <div className="space-y-3">
              {currentYear.subjects.map((sub, idx) => (
                <div
                  key={sub.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20 hover:border-teal-200 dark:hover:border-teal-900/30 transition-all relative group"
                >
                  <div className="md:col-span-4">
                    <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={sub.name}
                      onChange={(e) => handleCurrentSubjectChange(sub.id, "name", e.target.value)}
                      placeholder="e.g. Physics"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none text-gray-800 dark:text-gray-200 font-medium"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">
                      Current Marks
                    </label>
                    <input
                      type="number"
                      value={sub.currentMarks || ""}
                      onChange={(e) => handleCurrentSubjectChange(sub.id, "currentMarks", e.target.value)}
                      placeholder="75"
                      min="0"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none text-gray-800 dark:text-gray-200"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">
                      Max Marks
                    </label>
                    <input
                      type="number"
                      value={sub.maxMarks || ""}
                      onChange={(e) => handleCurrentSubjectChange(sub.id, "maxMarks", e.target.value)}
                      placeholder="100"
                      min="1"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none text-gray-800 dark:text-gray-200"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">
                      Target (%)
                    </label>
                    <input
                      type="number"
                      value={sub.targetMarks || ""}
                      onChange={(e) => handleCurrentSubjectChange(sub.id, "targetMarks", e.target.value)}
                      placeholder="90"
                      min="0"
                      max="100"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none text-gray-800 dark:text-gray-200"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end justify-between gap-2">
                    <div className="w-full">
                      <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">
                        Hours/Wk
                      </label>
                      <input
                        type="number"
                        value={sub.studyHoursPerWeek || ""}
                        onChange={(e) => handleCurrentSubjectChange(sub.id, "studyHoursPerWeek", e.target.value)}
                        placeholder="3"
                        min="0"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none text-gray-800 dark:text-gray-200"
                      />
                    </div>
                    {currentYear.subjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCurrentSubject(sub.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all cursor-pointer mb-0.5"
                        title="Remove Subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Historical Records (Past 3+ Years) */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-teal-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Academic History
                  </h3>
                  <p className="text-[11px] text-gray-400">Past 3 years required; add more if available.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddPastYear}
                className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 text-xs font-medium rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Year
              </button>
            </div>

            {/* Past Years List */}
            <div className="space-y-4">
              {pastYears.map((year, yearIdx) => (
                <div
                  key={year.id}
                  className={`border rounded-2xl overflow-hidden transition-all ${
                    expandedYearId === year.id
                      ? "border-teal-500 dark:border-teal-900 bg-teal-50/10 dark:bg-teal-950/5"
                      : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
                  }`}
                >
                  {/* Year Accordion Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer select-none"
                    onClick={() => setExpandedYearId(expandedYearId === year.id ? null : year.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-7 h-7 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-lg font-bold text-xs">
                        {yearIdx + 1}
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                          {year.yearName}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-gray-400">
                            {year.subjects.length} subjects
                          </span>
                          <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-1.5 py-0.5 rounded">
                            Overall: {year.overallPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pastYears.length > 3 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePastYear(year.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {expandedYearId === year.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Year Expanded Content */}
                  {expandedYearId === year.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800/80 pt-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">
                            Academic Year Label
                          </label>
                          <input
                            type="text"
                            value={year.yearName}
                            onChange={(e) => handlePastYearChange(year.id, "yearName", e.target.value)}
                            placeholder="e.g. Grade 10"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none text-gray-800 dark:text-gray-200 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">
                            Overall Percentage (%)
                          </label>
                          <input
                            type="number"
                            value={year.overallPercentage}
                            onChange={(e) =>
                              handlePastYearChange(year.id, "overallPercentage", parseFloat(e.target.value) || 0)
                            }
                            placeholder="85"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none text-gray-800 dark:text-gray-200 font-medium"
                          />
                        </div>
                      </div>

                      {/* Subjects in this past year */}
                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Subject-wise Details
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddPastSubject(year.id)}
                            className="flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 font-medium hover:underline cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Subject
                          </button>
                        </div>

                        {year.subjects.map((sub) => (
                          <div key={sub.id} className="flex gap-2 items-center bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <input
                              type="text"
                              value={sub.name}
                              onChange={(e) =>
                                handlePastSubjectChange(year.id, sub.id, "name", e.target.value)
                              }
                              placeholder="Subject Name"
                              className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-950 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-800 dark:text-gray-200 font-medium"
                            />
                            <input
                              type="number"
                              value={sub.marks || ""}
                              onChange={(e) =>
                                handlePastSubjectChange(year.id, sub.id, "marks", e.target.value)
                              }
                              placeholder="Score"
                              className="w-14 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-950 text-xs text-center focus:outline-none text-gray-800 dark:text-gray-200"
                            />
                            <span className="text-gray-400 text-xs">/</span>
                            <input
                              type="number"
                              value={sub.maxMarks || ""}
                              onChange={(e) =>
                                handlePastSubjectChange(year.id, sub.id, "maxMarks", e.target.value)
                              }
                              placeholder="Max"
                              className="w-14 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-950 text-xs text-center focus:outline-none text-gray-800 dark:text-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePastSubject(year.id, sub.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Call to Submit */}
      <div className="flex items-center justify-center pt-4">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="flex items-center gap-3 px-8 py-4 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-400 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-base disabled:cursor-not-allowed group"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Analyzing historical tracks & predicting...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-teal-200 group-hover:animate-pulse" />
              <span>Predict Academic Grades with AI</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
