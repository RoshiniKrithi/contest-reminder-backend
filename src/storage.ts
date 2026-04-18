import {
  type User,
  type InsertUser,
  type Contest,
  type InsertContest,
  type Problem,
  type InsertProblem,
  type Submission,
  type InsertSubmission,
  type Course,
  type InsertCourse,
  type Lesson,
  type InsertLesson,
  type Enrollment,
  type InsertEnrollment,
  type LessonProgress,
  type InsertLessonProgress,
  users,
  contests,
  problems,
  submissions,
  courses,
  lessons,
  enrollments,
  lessonProgress,
  userActivity,
  type UserActivity,
  type InsertUserActivity,
  typingChallenges,
  typingScores,
  quizQuestions,
  quizAttempts,
  brainTeasers,
  teaserAttempts,
  bookmarks,
  type Bookmark,
  type InsertBookmark,
  type User as SelectUser
} from "./shared/schema.js";
import { randomUUID } from "crypto";
import { typingChallenges as typingSeed, quizQuestions as quizSeed, brainTeasers as teaserSeed } from "./challenge-seed-data.js";
import session from "express-session";
import createMemoryStore from "memorystore";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";

const MemoryStore = (createMemoryStore as any)(session);

import { db, pool } from "./db.js";


export interface IStorage {
  sessionStore: session.Store;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser & { googleId?: string }): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStreak(userId: string, streak: number): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Activity Report operations
  getUserActivity(userId: string): Promise<UserActivity[]>;
  trackUserActivity(userId: string, minutes: number, questions: number): Promise<void>;

  // Contest operations
  createContest(contest: InsertContest): Promise<Contest>;
  getContest(id: string): Promise<Contest | undefined>;
  getAllContests(): Promise<Contest[]>;
  updateContestStatus(id: string, status: string): Promise<Contest | undefined>;
  updateContestParticipants(id: string, participants: number): Promise<Contest | undefined>;

  // Bookmark operations
  getBookmarks(userId: string): Promise<Bookmark[]>;
  createBookmark(userId: string, contestId: string): Promise<Bookmark>;
  deleteBookmark(userId: string, contestId: string): Promise<void>;

  // Problem operations
  createProblem(problem: InsertProblem): Promise<Problem>;
  getProblemsByContest(contestId: string): Promise<Problem[]>;
  getProblem(id: string): Promise<Problem | undefined>;

  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissionsByUser(userId: string, contestId?: string): Promise<Submission[]>;
  getSubmissionsByProblem(problemId: string): Promise<Submission[]>;
  updateSubmissionStatus(id: string, status: string, score?: number): Promise<Submission | undefined>;


  // Course operations
  createCourse(course: InsertCourse): Promise<Course>;
  getAllCourses(): Promise<Course[]>;
  getCoursesByLevel(level: string): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;

  // Lesson operations
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  getLessonsByCourse(courseId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  updateLesson(id: string, updates: Partial<InsertLesson>): Promise<Lesson | undefined>;

  // Enrollment operations
  enrollInCourse(userId: string, courseId: string): Promise<Enrollment>;
  getUserEnrollments(userId: string): Promise<Enrollment[]>;
  getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined>;
  updateEnrollmentProgress(userId: string, courseId: string, progress: number, timeSpent?: number): Promise<Enrollment | undefined>;
  completeEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined>;

  // Lesson Progress operations
  updateLessonProgress(enrollmentId: string, lessonId: string, userId: string, completed: boolean, timeSpent?: number): Promise<LessonProgress>;
  getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | undefined>;
  getEnrollmentLessonProgress(enrollmentId: string): Promise<LessonProgress[]>;

  // Challenge operations
  getChallengeStats(userId: string): Promise<any>;
  getRandomTypingChallenge(difficulty: string, language: string, seed?: number): Promise<any>;
  submitTypingScore(data: any): Promise<any>;
  getTypingLeaderboard(): Promise<any[]>;
  getQuizQuestions(topic: string, difficulty: string, count: number): Promise<any[]>;
  submitQuizAttempt(data: any): Promise<any>;
  getQuizStats(userId: string): Promise<any>;
  getDailyBrainTeaser(): Promise<any>;
  getTeaserAttempt(userId: string, teaserId: string): Promise<any>;
  submitTeaserAnswer(userId: string, teaserId: string, answer: string): Promise<any>;
  recordHintUsed(userId: string, teaserId: string): Promise<void>;
  getTeaserCalendar(userId: string): Promise<any[]>;
  getBrainTeaserStats(userId: string): Promise<any>;

}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: Map<string, User>;
  private contests: Map<string, Contest>;
  private problems: Map<string, Problem>;
  private submissions: Map<string, Submission>;
  private courses: Map<string, Course>;
  private lessons: Map<string, Lesson>;
  private enrollments: Map<string, Enrollment>;
  private lessonProgress: Map<string, LessonProgress>;
  private userActivity: Map<string, UserActivity>;
  private typingChallenges: Map<string, any>;
  private typingScores: Map<string, any>;
  private quizQuestions: Map<string, any>;
  private quizAttempts: Map<string, any>;
  private brainTeasers: Map<string, any>;
  private brainTeaserSolutions: Map<string, any>;
  private bookmarks: Map<string, Bookmark>;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.users = new Map();
    this.contests = new Map();
    this.problems = new Map();
    this.submissions = new Map();
    this.courses = new Map();
    this.lessons = new Map();
    this.enrollments = new Map();
    this.lessonProgress = new Map();
    this.userActivity = new Map();
    this.typingChallenges = new Map();
    this.typingScores = new Map();
    this.quizQuestions = new Map();
    this.quizAttempts = new Map();
    this.brainTeasers = new Map();
    this.brainTeaserSolutions = new Map();
    this.bookmarks = new Map();
    this.initializeSampleCourses();
    this.initializeSampleLessons();
    this.initializeSampleContests();
    this.initializeAdminUser();
    this.seedChallenges();
  }

  private seedChallenges() {
    typingSeed.forEach(c => this.typingChallenges.set(c.id, c));
    quizSeed.forEach(q => this.quizQuestions.set(q.id, q));
    teaserSeed.forEach(t => this.brainTeasers.set(t.id, t));
  }

  private async initializeSampleContests() {
    // Create a sample contest
    const contestId = randomUUID();
    const startTime = new Date();
    const endTime = new Date(Date.now() + 86400000 * 365); // 1 year duration
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const contest: Contest = {
      id: contestId,
      title: "Daily Coding Challenge",
      description: "Daily algorithmic challenges to test your skills.",
      platform: "System",
      url: null,
      startTime,
      endTime,
      duration,
      status: "live",
      externalId: null,
      participants: 0,
      createdBy: "system",
      lastUpdated: new Date(),
      notified: false
    };
    this.contests.set(contestId, contest);

    // Create sample problems
    const sampleProblems = [
      {
        title: "Two Sum",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
        difficulty: "easy",
        points: 100,
        timeLimit: 2000,
        memoryLimit: 256,
        testCases: [
          { input: "[2,7,11,15], 9", output: "[0,1]" },
          { input: "[3,2,4], 6", output: "[1,2]" }
        ]
      },
      {
        title: "Reverse String",
        description: "Write a function that reverses a string. The input string is given as an array of characters s.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
        difficulty: "medium",
        points: 200,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: '["h","e","l","l","o"]', output: '["o","l","l","e","h"]' }
        ]
      },
      {
        title: "Valid Anagram",
        description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
        difficulty: "easy",
        points: 100,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: 's = "anagram", t = "nagaram"', output: "true" },
          { input: 's = "rat", t = "car"', output: "false" }
        ]
      },
      {
        title: "Binary Search",
        description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.",
        difficulty: "easy",
        points: 100,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
          { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" }
        ]
      },
      {
        title: "Contains Duplicate",
        description: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
        difficulty: "easy",
        points: 100,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: "[1,2,3,1]", output: "true" },
          { input: "[1,2,3,4]", output: "false" }
        ]
      },
      {
        title: "Linked List Cycle",
        description: "Given head, the head of a linked list, determine if the linked list has a cycle in it.",
        difficulty: "medium",
        points: 150,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: "head = [3,2,0,-4], pos = 1", output: "true" },
          { input: "head = [1,2], pos = -1", output: "false" }
        ]
      },
      {
        title: "Merge Two Sorted Lists",
        description: "Merge two sorted linked lists and return it as a sorted list. The list should be made by splicing together the nodes of the first two lists.",
        difficulty: "easy",
        points: 100,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: "l1 = [1,2,4], l2 = [1,3,4]", output: "[1,1,2,3,4,4]" }
        ]
      },
      {
        title: "Climbing Stairs",
        description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
        difficulty: "easy",
        points: 100,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: "n = 2", output: "2" },
          { input: "n = 3", output: "3" }
        ]
      },
      {
        title: "Maximum Subarray",
        description: "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
        difficulty: "medium",
        points: 200,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: "[-2,1,-3,4,-1,2,1,-5,4]", output: "6" }
        ]
      },
      {
        title: "Lowest Common Ancestor of a BST",
        description: "Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.",
        difficulty: "easy",
        points: 100,
        timeLimit: 1000,
        memoryLimit: 128,
        testCases: [
          { input: "root = [6,2,8,0,4,7,9,3,5], p = 2, q = 8", output: "6" }
        ]
      }
    ];

    for (const p of sampleProblems) {
      const pId = randomUUID();
      this.problems.set(pId, {
        id: pId,
        contestId,
        ...p
      });
    }
  }

  private async initializeAdminUser() {
    // Check if admin user already exists
    const existingAdmin = await this.getUserByUsername("admin");
    if (existingAdmin) {
      return; // Admin already exists, skip initialization
    }

    // Import crypto functions for password hashing (same as auth.ts)
    const { scrypt, randomBytes } = await import("crypto");
    const { promisify } = await import("util");
    const scryptAsync = promisify(scrypt);

    // Hash the password "admin123" using the same method as auth.ts
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;

    // Create the admin user
    const id = randomUUID();
    const adminUser: User = {
      id,
      username: "admin",
      password: hashedPassword,
      role: "admin",
      streak: 0,
      googleId: null,
      lastDailySolve: null
    };

    this.users.set(id, adminUser);
    console.log("✅ Default admin user created (username: admin, password: admin123)");
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.googleId === googleId);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserActivity(userId: string): Promise<UserActivity[]> {
    return Array.from(this.userActivity.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async trackUserActivity(userId: string, minutes: number, questions: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find existing activity for today
    const existing = Array.from(this.userActivity.values()).find(
      a => a.userId === userId && new Date(a.date).getTime() === today.getTime()
    );

    if (existing) {
      const updated = {
        ...existing,
        minutesActive: (existing.minutesActive || 0) + minutes,
        questionsSolved: (existing.questionsSolved || 0) + questions
      };
      this.userActivity.set(existing.id, updated);
    } else {
      const id = randomUUID();
      const activity: UserActivity = {
        id,
        userId,
        date: today,
        minutesActive: minutes,
        questionsSolved: questions
      };
      this.userActivity.set(id, activity);
    }
  }

  async createUser(insertUser: InsertUser & { googleId?: string }): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...(insertUser as any),
      id,
      role: (insertUser as any).username === "admin" ? "admin" : ((insertUser as any).role || "user"),
      streak: 0,
      googleId: (insertUser as any).googleId || null,
      lastDailySolve: null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStreak(userId: string, streak: number): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    const updated = { ...user, streak, lastDailySolve: new Date() };
    this.users.set(userId, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  // Contest operations
  async createContest(insertContest: InsertContest): Promise<Contest> {
    const id = randomUUID();
    const startTime = new Date(insertContest.startTime);
    const endTime = new Date(insertContest.endTime);
    const computedDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const contest: Contest = {
      id,
      title: insertContest.title,
      description: insertContest.description ?? null,
      platform: insertContest.platform ?? "System",
      url: insertContest.url ?? null,
      startTime,
      endTime,
      duration: insertContest.duration || computedDuration,
      status: insertContest.status || "upcoming",
      externalId: insertContest.externalId ?? null,
      participants: 0,
      createdBy: "system",
      lastUpdated: new Date(),
      notified: insertContest.notified ?? false
    };
    this.contests.set(id, contest);
    return contest;
  }

  async getBookmarks(userId: string): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).filter(b => b.userId === userId);
  }

  async createBookmark(userId: string, contestId: string): Promise<Bookmark> {
    const id = randomUUID();
    const bookmark: Bookmark = {
      id,
      userId,
      contestId,
      createdAt: new Date()
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async deleteBookmark(userId: string, contestId: string): Promise<void> {
    const bookmark = Array.from(this.bookmarks.values()).find(
      b => b.userId === userId && b.contestId === contestId
    );
    if (bookmark) {
      this.bookmarks.delete(bookmark.id);
    }
  }

  async getContest(id: string): Promise<Contest | undefined> {
    return this.contests.get(id);
  }

  async getAllContests(): Promise<Contest[]> {
    return Array.from(this.contests.values()).sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  async updateContestStatus(id: string, status: string): Promise<Contest | undefined> {
    const contest = this.contests.get(id);
    if (contest) {
      const updated = { ...contest, status };
      this.contests.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async updateContestParticipants(id: string, participants: number): Promise<Contest | undefined> {
    const contest = this.contests.get(id);
    if (contest) {
      const updated = { ...contest, participants };
      this.contests.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Problem operations
  async createProblem(insertProblem: InsertProblem): Promise<Problem> {
    const id = randomUUID();
    const problem: Problem = {
      ...(insertProblem as any),
      id,
      points: (insertProblem as any).points || 100,
      timeLimit: (insertProblem as any).timeLimit || null,
      memoryLimit: (insertProblem as any).memoryLimit || null
    };
    this.problems.set(id, problem);
    return problem;
  }

  async getProblemsByContest(contestId: string): Promise<Problem[]> {
    return Array.from(this.problems.values()).filter(p => p.contestId === contestId);
  }

  async getProblem(id: string): Promise<Problem | undefined> {
    return this.problems.get(id);
  }

  // Submission operations
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = randomUUID();
    const submission: Submission = {
      ...(insertSubmission as any),
      id,
      submittedAt: new Date(),
      score: 0,
      status: "pending"
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async getSubmissionsByUser(userId: string, contestId?: string): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(s =>
      s.userId === userId && (!contestId || s.contestId === contestId)
    );
  }

  async getSubmissionsByProblem(problemId: string): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(s => s.problemId === problemId);
  }

  async updateSubmissionStatus(id: string, status: string, score?: number): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (submission) {
      const updated = { ...submission, status, ...(score !== undefined && { score }) };
      this.submissions.set(id, updated);
      return updated;
    }
    return undefined;
  }


  // Course operations
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = randomUUID();
    const course: Course = {
      ...(insertCourse as any),
      id,
      students: 0,
      createdAt: new Date(),
      isActive: (insertCourse as any).isActive || true,
      thumbnail: (insertCourse as any).thumbnail || null,
      prerequisites: (insertCourse as any).prerequisites || null,
      rating: (insertCourse as any).rating || null
    } as any;

    this.courses.set(id, course);
    return course;
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values())
      .filter(c => c.isActive)
      .sort((a, b) => {
        const levelOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        return (levelOrder[a.level as keyof typeof levelOrder] || 999) -
          (levelOrder[b.level as keyof typeof levelOrder] || 999);
      });
  }

  async getCoursesByLevel(level: string): Promise<Course[]> {
    return Array.from(this.courses.values())
      .filter(c => c.isActive && c.level === level)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  // Lesson operations
  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const id = randomUUID();
    const lesson: Lesson = {
      ...(insertLesson as any),
      id,
      createdAt: new Date(),
      description: (insertLesson as any).description || null,
      isActive: (insertLesson as any).isActive || true,
      duration: (insertLesson as any).duration || null,
      videoUrl: (insertLesson as any).videoUrl || null,
      quizData: (insertLesson as any).quizData || null,
      type: (insertLesson as any).type || "theory"
    };
    this.lessons.set(id, lesson);
    return lesson;
  }

  async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    return Array.from(this.lessons.values())
      .filter(l => l.courseId === courseId && l.isActive)
      .sort((a, b) => a.order - b.order);
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async updateLesson(id: string, updates: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const lesson = this.lessons.get(id);
    if (lesson) {
      const updated = { ...lesson, ...updates };
      this.lessons.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Enrollment operations
  async enrollInCourse(userId: string, courseId: string): Promise<Enrollment> {
    const existing = Array.from(this.enrollments.values()).find(
      e => e.userId === userId && e.courseId === courseId
    );

    if (existing) {
      return existing;
    }

    const id = randomUUID();
    const enrollment: Enrollment = {
      id,
      userId,
      courseId,
      enrolledAt: new Date(),
      completedAt: null,
      progress: 0,
      timeSpent: 0,
      status: "active",
      lastAccessedAt: new Date()
    };
    this.enrollments.set(id, enrollment);

    // Update course student count
    const course = this.courses.get(courseId);
    if (course) {
      const updated = { ...course, students: (course.students || 0) + 1 };
      this.courses.set(courseId, updated);
    }

    return enrollment;
  }

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values())
      .filter(e => e.userId === userId)
      .sort((a, b) => new Date(b.lastAccessedAt || new Date()).getTime() - new Date(a.lastAccessedAt || new Date()).getTime());
  }

  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    return Array.from(this.enrollments.values()).find(
      e => e.userId === userId && e.courseId === courseId
    );
  }

  async updateEnrollmentProgress(userId: string, courseId: string, progress: number, timeSpent?: number): Promise<Enrollment | undefined> {
    const enrollment = Array.from(this.enrollments.values()).find(
      e => e.userId === userId && e.courseId === courseId
    );

    if (enrollment) {
      const updated = {
        ...enrollment,
        progress: Math.min(100, Math.max(0, progress)),
        ...(timeSpent !== undefined && { timeSpent: (enrollment.timeSpent || 0) + timeSpent }),
        lastAccessedAt: new Date()
      };
      this.enrollments.set(enrollment.id, updated);
      return updated;
    }
    return undefined;
  }

  async completeEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    const enrollment = Array.from(this.enrollments.values()).find(
      e => e.userId === userId && e.courseId === courseId
    );

    if (enrollment) {
      const updated = {
        ...enrollment,
        progress: 100,
        status: "completed",
        completedAt: new Date(),
        lastAccessedAt: new Date()
      };
      this.enrollments.set(enrollment.id, updated);
      return updated;
    }
    return undefined;
  }

  // Lesson Progress operations
  async updateLessonProgress(enrollmentId: string, lessonId: string, userId: string, completed: boolean, timeSpent?: number): Promise<LessonProgress> {
    const existing = Array.from(this.lessonProgress.values()).find(
      p => p.enrollmentId === enrollmentId && p.lessonId === lessonId && p.userId === userId
    );

    if (existing) {
      const updated = {
        ...existing,
        completed,
        ...(timeSpent !== undefined && { timeSpent: (existing.timeSpent || 0) + timeSpent }),
        ...(completed && !existing.completed && { completedAt: new Date() }),
        lastAccessedAt: new Date()
      };
      this.lessonProgress.set(existing.id, updated);
      return updated;
    } else {
      const id = randomUUID();
      const progress: LessonProgress = {
        id,
        enrollmentId,
        lessonId,
        userId,
        completed,
        timeSpent: timeSpent || 0,
        completedAt: completed ? new Date() : null,
        lastAccessedAt: new Date()
      };
      this.lessonProgress.set(id, progress);
      return progress;
    }
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | undefined> {
    return Array.from(this.lessonProgress.values()).find(
      p => p.userId === userId && p.lessonId === lessonId
    );
  }

  async getEnrollmentLessonProgress(enrollmentId: string): Promise<LessonProgress[]> {
    return Array.from(this.lessonProgress.values())
      .filter(p => p.enrollmentId === enrollmentId)
      .sort((a, b) => new Date(b.lastAccessedAt || new Date()).getTime() - new Date(a.lastAccessedAt || new Date()).getTime());
  }

  // Challenge operations
  async getChallengeStats(userId: string): Promise<any> {
    const typing = Array.from(this.typingScores.values()).filter(s => s.userId === userId);
    const quizzes = Array.from(this.quizAttempts.values()).filter(a => a.userId === userId);
    const teasers = Array.from(this.brainTeaserSolutions.values()).filter(s => s.userId === userId && s.solved);
    const user = this.users.get(userId);

    const totalWeight = quizzes.reduce((acc, curr) => acc + (curr.totalQuestions || 1), 0);
    const totalScore = quizzes.reduce((acc, curr) => acc + (curr.score || 0), 0);
    const avgScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

    return {
      typing: {
        completed: typing.length,
        bestWPM: typing.length ? Math.max(...typing.map(t => t.wpm)) : 0,
      },
      quiz: {
        completed: quizzes.length,
        averageScore: avgScore,
      },
      brainTeaser: {
        streak: user?.streak || 0,
        totalSolved: teasers.length,
      }
    };
  }

  async getRandomTypingChallenge(difficulty: string, language: string, seed?: number): Promise<any> {
    const filtered = Array.from(this.typingChallenges.values()).filter(
      c => c.difficulty === difficulty && c.language === language
    );
    if (!filtered.length) return null;

    // Use seed for deterministic selection if provided, otherwise random
    const index = seed !== undefined
      ? seed % filtered.length
      : Math.floor(Math.random() * filtered.length);

    return filtered[index];
  }

  async submitTypingScore(data: any): Promise<any> {
    const id = randomUUID();
    const score = { ...data, id, completedAt: new Date() };
    this.typingScores.set(id, score);
    return score;
  }

  async getTypingLeaderboard(): Promise<any[]> {
    return Array.from(this.typingScores.values())
      .sort((a, b) => b.wpm - a.wpm)
      .slice(0, 10)
      .map(s => {
        const user = Array.from(this.users.values()).find(u => u.id === s.userId);
        return { ...s, username: user?.username || "Unknown" };
      });
  }

  async getQuizQuestions(topic: string, difficulty: string, count: number): Promise<any[]> {
    let filtered = Array.from(this.quizQuestions.values()).filter(
      q => q.topic === topic && q.difficulty === difficulty
    );

    // If not enough questions of selected difficulty, add questions of other difficulties for the same topic
    if (filtered.length < count) {
      const others = Array.from(this.quizQuestions.values()).filter(
        q => q.topic === topic && q.difficulty !== difficulty
      );
      filtered = [...filtered, ...others];
    }

    return filtered.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  async submitQuizAttempt(data: any): Promise<any> {
    const id = randomUUID();
    const attempt = { ...data, id, completedAt: new Date() };
    this.quizAttempts.set(id, attempt);
    return attempt;
  }

  async getQuizStats(userId: string): Promise<any> {
    const userAttempts = Array.from(this.quizAttempts.values()).filter(a => a.userId === userId);
    return {
      totalAttempts: userAttempts.length,
      avgScore: userAttempts.length ? Math.round(userAttempts.reduce((acc, curr) => acc + curr.score, 0) / userAttempts.length) : 0,
      bestScore: userAttempts.length ? Math.max(...userAttempts.map(a => a.score)) : 0,
    };
  }

  async getDailyBrainTeaser(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(this.brainTeasers.values()).find(t => t.date.startsWith(today)) || null;
  }

  async getTeaserAttempt(userId: string, teaserId: string): Promise<any> {
    return Array.from(this.brainTeaserSolutions.values()).find(
      s => s.userId === userId && s.teaserId === teaserId
    ) || null;
  }

  async submitTeaserAnswer(userId: string, teaserId: string, answer: string): Promise<any> {
    const teaser = Array.from(this.brainTeasers.values()).find(t => t.id === teaserId);
    if (!teaser) throw new Error("Teaser not found");

    const correct = answer.toLowerCase().trim() === teaser.solution.toLowerCase().trim();
    const existing = await this.getTeaserAttempt(userId, teaserId);

    if (existing) {
      existing.attempts += 1;
      existing.solved = existing.solved || correct;
      existing.userAnswer = answer;
      if (correct && !existing.solvedAt) existing.solvedAt = new Date();
      return { correct, attempt: existing };
    } else {
      const id = randomUUID();
      const attempt = {
        id,
        userId,
        teaserId,
        solved: correct,
        hintsUsed: 0,
        attempts: 1,
        userAnswer: answer,
        attemptedAt: new Date(),
        solvedAt: correct ? new Date() : null
      };
      this.brainTeaserSolutions.set(id, attempt);
      return { correct, attempt };
    }
  }

  async recordHintUsed(userId: string, teaserId: string): Promise<void> {
    const existing = await this.getTeaserAttempt(userId, teaserId);
    if (existing) {
      existing.hintsUsed = (existing.hintsUsed || 0) + 1;
    } else {
      const id = randomUUID();
      const attempt = {
        id,
        userId,
        teaserId,
        solved: false,
        hintsUsed: 1,
        attempts: 0,
        attemptedAt: new Date(),
        solvedAt: null
      };
      this.brainTeaserSolutions.set(id, attempt);
    }
  }

  async getTeaserCalendar(userId: string): Promise<any[]> {
    return Array.from(this.brainTeaserSolutions.values())
      .filter(s => s.userId === userId)
      .map(a => ({ date: a.attemptedAt, solved: a.solved }));
  }

  async getBrainTeaserStats(userId: string): Promise<any> {
    const userSolutions = Array.from(this.brainTeaserSolutions.values()).filter(s => s.userId === userId);
    return {
      totalAttempts: userSolutions.length,
      solved: userSolutions.filter(s => s.solved).length,
    };
  }

  private initializeSampleCourses(): void {
    const sampleCourses = [
      {
        title: "Programming Fundamentals",
        description: "Learn the basics of programming with hands-on exercises covering variables, loops, functions, and problem-solving techniques.",
        level: "beginner",
        duration: "6 weeks",
        difficulty: "easy",
        topics: ["Variables", "Control Flow", "Functions", "Basic Data Structures"],
        prerequisites: "No prior programming experience required",
        instructor: "Dr. Sarah Chen",
        rating: 5,
        students: 1250,
        price: "Free",
        thumbnail: null,
        isActive: true
      },
      {
        title: "Data Structures Essentials",
        description: "Master fundamental data structures including arrays, linked lists, stacks, queues, trees, and hash tables with practical implementation.",
        level: "beginner",
        duration: "8 weeks",
        difficulty: "medium",
        topics: ["Arrays", "Linked Lists", "Stacks & Queues", "Trees", "Hash Tables"],
        prerequisites: "Basic programming knowledge in any language",
        instructor: "Prof. Michael Rodriguez",
        rating: 5,
        students: 980,
        price: "Free",
        thumbnail: null,
        isActive: true
      },
      {
        title: "Algorithms Design & Analysis",
        description: "Comprehensive course covering sorting, searching, graph algorithms, dynamic programming, and algorithm complexity analysis.",
        level: "intermediate",
        duration: "10 weeks",
        difficulty: "medium",
        topics: ["Sorting Algorithms", "Graph Algorithms", "Dynamic Programming", "Greedy Algorithms", "Complexity Analysis"],
        prerequisites: "Knowledge of basic data structures",
        instructor: "Dr. Elena Vasquez",
        rating: 5,
        students: 750,
        price: "$49",
        thumbnail: null,
        isActive: true
      },
      {
        title: "Advanced Problem Solving",
        description: "Tackle complex competitive programming problems with advanced techniques, optimization strategies, and mathematical concepts.",
        level: "intermediate",
        duration: "12 weeks",
        difficulty: "hard",
        topics: ["Advanced Graph Theory", "Number Theory", "String Algorithms", "Computational Geometry"],
        prerequisites: "Strong foundation in algorithms and data structures",
        instructor: "Alex Thompson",
        rating: 5,
        students: 420,
        price: "$99",
        thumbnail: null,
        isActive: true
      },
      {
        title: "Competitive Programming Mastery",
        description: "Elite-level training for international programming contests with advanced optimization, mathematical concepts, and contest strategies.",
        level: "advanced",
        duration: "16 weeks",
        difficulty: "hard",
        topics: ["Advanced Mathematics", "Complex Optimization", "Contest Strategy", "Advanced Data Structures"],
        prerequisites: "Extensive competitive programming experience",
        instructor: "International Grandmaster Chen Liu",
        rating: 5,
        students: 180,
        price: "$199",
        thumbnail: null,
        isActive: true
      },
      {
        title: "System Design for Coding Interviews",
        description: "Learn to design scalable systems with real-world case studies, distributed systems concepts, and interview preparation.",
        level: "advanced",
        duration: "8 weeks",
        difficulty: "hard",
        topics: ["Scalability", "Database Design", "Microservices", "Caching", "Load Balancing"],
        prerequisites: "Experience with software development and algorithms",
        instructor: "Senior Engineer Maria Santos",
        rating: 5,
        students: 320,
        price: "$149",
        thumbnail: null,
        isActive: true
      },
      // ── NEW DSA COURSES ──────────────────────────────────────
      {
        title: "Two Pointers & Sliding Window",
        description: "Learn the two-pointer and sliding window techniques to solve array and string problems in optimal O(n) time — a must-know pattern for coding interviews.",
        level: "beginner",
        duration: "4 weeks",
        difficulty: "medium",
        topics: ["Two Pointer Pattern", "Sliding Window", "Array Problems", "String Manipulation", "Interview Prep"],
        prerequisites: "Basic array knowledge in any programming language",
        instructor: "Dr. Priya Nair",
        rating: 4.9,
        students: 870,
        price: "Free",
        thumbnail: null,
        isActive: true
      },
      {
        title: "Recursion & Backtracking Masterclass",
        description: "Build deep intuition for recursive thinking and backtracking strategies. Covers permutations, combinations, N-Queens, Sudoku, and more.",
        level: "intermediate",
        duration: "6 weeks",
        difficulty: "medium",
        topics: ["Recursion Basics", "Call Stack", "Backtracking", "Permutations & Combinations", "Pruning Strategies"],
        prerequisites: "Comfortable with loops and functions in any language",
        instructor: "Prof. Arjun Sharma",
        rating: 4.8,
        students: 610,
        price: "Free",
        thumbnail: null,
        isActive: true
      },
      {
        title: "Dynamic Programming Patterns",
        description: "Crack DP once and for all! Master the 7 core patterns — 1D DP, 2D DP, Knapsack, Longest Subsequences, Matrix DP, Intervals, and Digit DP — with worked examples.",
        level: "intermediate",
        duration: "8 weeks",
        difficulty: "hard",
        topics: ["1D & 2D DP", "Knapsack Problem", "LCS & LIS", "Matrix DP", "Interval DP"],
        prerequisites: "Knowledge of recursion and arrays",
        instructor: "Dr. Elena Vasquez",
        rating: 4.9,
        students: 520,
        price: "$49",
        thumbnail: null,
        isActive: true
      },
      {
        title: "Trees & Binary Search Trees",
        description: "Thorough course on trees — from representation to traversals, BST operations, AVL balancing, and common interview problem patterns on tree structures.",
        level: "beginner",
        duration: "5 weeks",
        difficulty: "medium",
        topics: ["Tree Representation", "DFS & BFS Traversals", "BST Insert/Delete/Search", "Balanced Trees", "LCA & Tree DP"],
        prerequisites: "Basic recursion and linked list understanding",
        instructor: "Prof. Michael Rodriguez",
        rating: 4.9,
        students: 740,
        price: "Free",
        thumbnail: null,
        isActive: true
      }
    ];

    sampleCourses.forEach(courseData => {
      const id = randomUUID();
      const course: Course = {
        ...courseData,
        id,
        createdAt: new Date()
      };
      this.courses.set(id, course);
    });
  }

  private initializeSampleLessons(): void {
    const courseIds = Array.from(this.courses.keys());

    courseIds.forEach(courseId => {
      const course = this.courses.get(courseId);
      if (!course) return;

      let lessons: Array<Omit<Lesson, 'id' | 'createdAt'>> = [];

      if (course.title.includes("Programming Fundamentals")) {
        lessons = [
          {
            courseId,
            title: "The Briefing: C++ Foundations",
            description: "Master the syntax and logic of C++ programming.",
            content: "Welcome to the front lines of software development. In this briefing, you'll learn the core syntax of C++, including headers, namespaces, and the main entry point of every tactical application.",
            order: 1,
            duration: 31,
            videoUrl: "https://www.youtube.com/embed/vLnPwxZdW4Y",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What is the correct syntax to output 'Hello World' in C++?",
                options: ["system.out.println(\"Hello World\");", "console.log(\"Hello World\");", "cout << \"Hello World\";", "print(\"Hello World\");"],
                correctAnswerIndex: 2
              },
              {
                question: "Which directive is used to include the input-output stream library?",
                options: ["#include <iostream>", "#import <stream>", "using namespace std;", "void main()"],
                correctAnswerIndex: 0
              }
            ]
          },
          {
            courseId,
            title: "Mission: Data Types & Variables",
            description: "Learn how to store and manipulate mission-critical data.",
            content: "Variables are the storage containers of your code. In this segment, we explore integers, strings, and booleans, and how to allocate memory for your tactical operations.",
            order: 2,
            duration: 15,
            videoUrl: null,
            type: "theory",
            isActive: true,
            quizData: [
              {
                question: "Which data type is specifically used to store text sequences?",
                options: ["int", "char", "string", "double"],
                correctAnswerIndex: 2
              },
              {
                question: "What is the result of '5 / 2' in integer division in C++?",
                options: ["2.5", "2", "3", "Error"],
                correctAnswerIndex: 1
              }
            ]
          }
        ];
      } else if (course.title.includes("Data Structures Essentials")) {
        lessons = [
          {
            courseId,
            title: "Introduction to Data Structures",
            description: "Visualize how data is organized in physical memory.",
            content: "Data structures are the backbone of efficient software. We'll start with an overview of how computers store information and the basic categories of data organization.",
            order: 1,
            duration: 45,
            videoUrl: "https://www.youtube.com/embed/8hly31xKli0",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What is the time complexity to insert an element at the beginning of an array?",
                options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
                correctAnswerIndex: 2
              },
              {
                question: "Which data structure is best for LIFO (Last-In-First-Out) operations?",
                options: ["Queue", "Stack", "Linked List", "Hash Table"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "Arrays and Lists",
            description: "Deep dive into contiguous memory and dynamic sizing.",
            content: "Arrays are the most fundamental data structure. We explore how they are indexed and how dynamic arrays (like vectors) handle resizing.",
            order: 2,
            duration: 30,
            videoUrl: "https://www.youtube.com/embed/Zv7vS_3K4h8",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What is the main advantage of an array over a linked list?",
                options: ["Constant time access by index", "Infinite dynamic scaling", "Efficient insertion at the beginning", "Zero memory overhead"],
                correctAnswerIndex: 0
              },
              {
                question: "Which operation is O(1) in a static array?",
                options: ["Searching for a value", "Deleting an element", "Inserting at index 0", "Accessing a specific index"],
                correctAnswerIndex: 3
              }
            ]
          },
          {
            courseId,
            title: "Linked Lists",
            description: "Node-based data organization.",
            content: "Linked lists offer flexible memory management. We'll compare them to arrays and understand pointers.",
            order: 3,
            duration: 25,
            videoUrl: "https://www.youtube.com/embed/Hj_rUuM8Y_0",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "In a singly linked list, what does each node store besides the data?",
                options: ["The index of the node", "A pointer to the next node", "The size of the list", "A pointer to the previous node"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "Stacks and Queues",
            description: "LIFO and FIFO tactical data structures.",
            content: "Master the stack (Last-In-First-Out) and queue (First-In-First-Out) protocols.",
            order: 4,
            duration: 20,
            videoUrl: "https://www.youtube.com/embed/A3ZNCqZ0NoM",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "Which principle determines the behavior of a Stack?",
                options: ["FIFO (First-In-First-Out)", "LIFO (Last-In-First-Out)", "Priority-based", "Random Access"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "Assessment: Data Structures Mastery",
            description: "Final evaluation of your data structure knowledge.",
            content: "Prove your knowledge of arrays, lists, stacks, and queues. This assessment will test your ability to choose the right tool for the tactical situation.",
            order: 5,
            duration: 15,
            videoUrl: null,
            type: "quiz",
            isActive: true,
            quizData: [
              {
                question: "Which data structure provides the fastest access to an element if you know its position?",
                options: ["Stack", "Queue", "Array", "Linked List"],
                correctAnswerIndex: 2
              },
              {
                question: "In what situation would a Linked List be preferred over an Array?",
                options: ["Frequent random access", "When memory is tight and fixed", "High frequency of insertions/deletions at the beginning", "When sorting is the primary goal"],
                correctAnswerIndex: 2
              }
            ]
          }
        ];
      }
      else if (course.title.includes("Algorithms Design & Analysis")) {
        lessons = [
          {
            courseId,
            title: "Strategy: Big O & Sorting",
            description: "Analyze the efficiency of your tactical maneuvers.",
            content: "In competitive programming, speed is everything. We use Big O notation to measure the time and space complexity of our algorithms. Today, we optimize our sorting strategies.",
            order: 1,
            duration: 52,
            videoUrl: "https://www.youtube.com/embed/RBSGKlAvoiM",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What is the worst-case time complexity of Merge Sort?",
                options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
                correctAnswerIndex: 1
              },
              {
                question: "Big O notation describes what aspect of an algorithm?",
                options: ["Readability", "Memory usage only", "Upper bound of execution time", "The number of lines of code"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Mission: Search & Conquer",
            description: "Master efficient searching algorithms.",
            content: "Finding data quickly is a core skill. We'll explore Binary Search and how it drastically improves lookup performance compared to linear search.",
            order: 2,
            duration: 25,
            videoUrl: "https://www.youtube.com/embed/P3YID7liBug",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What is the time complexity of Binary Search on a sorted array?",
                options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Assessment: Algorithmic Efficiency",
            description: "Final evaluation of algorithm and complexity knowledge.",
            content: "Synthesize your understanding of Big O, sorting, and searching. Accuracy under pressure is key to algorithmic mastery.",
            order: 3,
            duration: 20,
            videoUrl: null,
            type: "quiz",
            isActive: true,
            quizData: [
              {
                question: "Compare O(n) and O(log n). Which grows faster as n becomes very large?",
                options: ["O(log n)", "O(n)", "They grow at the same rate", "It depends on the constant factors"],
                correctAnswerIndex: 1
              }
            ]
          }
        ];
      }
      else if (course.title.includes("Advanced Problem Solving")) {
        lessons = [
          {
            courseId,
            title: "Course Briefing: Advanced Tactics",
            description: "Introduction to high-level competitive programming.",
            content: "Welcome to Sector 7. This course covers the advanced mathematics and algorithms required for elite-level programming contests. Today, we begin with the tactical landscape of Graph Theory.",
            order: 1,
            duration: 15,
            videoUrl: "https://www.youtube.com/embed/8hly31xKli0",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What is the primary focus of this advanced module?",
                options: ["Basic Syntax", "Advanced Algorithms & Optimization", "Web Development", "Database Management"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "Advanced Tactics: Graph Theory",
            description: "Master complex graph algorithms and structures.",
            content: "Graphs are everywhere. In this module, we dive into Dijkstra, Bellman-Ford, and Minimum Spanning Trees to solve the most difficult navigational problems.",
            order: 2,
            duration: 45,
            videoUrl: "https://www.youtube.com/embed/zMtI_n27dTM",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "Which algorithm is best for finding the shortest path in a graph WITH negative edge weights?",
                options: ["BFS", "Dijkstra", "Bellman-Ford", "Floyd-Warshall"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Mathematical Warfare: Number Theory",
            description: "Harness the power of primes and modular arithmetic.",
            content: "Primes, GCD, and modular inverses are the building blocks of cryptography and complex logic puzzles.",
            order: 3,
            duration: 40,
            videoUrl: "https://www.youtube.com/embed/U_h7pbeTntk",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What is the complexity of the Euclidean algorithm for GCD?",
                options: ["O(n)", "O(log n)", "O(1)", "O(n^2)"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "Tactical Strings: Suffix Structures",
            description: "Optimize operations on large-scale text data.",
            content: "Pattern matching at scale requires advanced structures like Suffix Arrays and Automata.",
            order: 4,
            duration: 35,
            videoUrl: "https://www.youtube.com/embed/V59ax7InSio",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "Which structure is most efficient for multiple pattern matching in a single text?",
                options: ["Aho-Corasick", "Binary Search Tree", "Linked List", "Stack"],
                correctAnswerIndex: 0
              }
            ]
          },
          {
            courseId,
            title: "Assessment: Advanced Tactics",
            description: "Final evaluation of your advanced problem-solving capabilities.",
            content: "The extraction protocol is active. Prove your mastery of graphs, numbers, and strings.",
            order: 5,
            duration: 30,
            videoUrl: null,
            type: "quiz",
            isActive: true,
            quizData: [
              {
                question: "What is the primary goal of competitive programming optimization?",
                options: ["Code length", "Time and space complexity", "Variable naming", "Comments"],
                correctAnswerIndex: 1
              }
            ]
          }
        ];
      }
      else if (course.title.includes("Competitive Programming Mastery")) {
        lessons = [
          {
            courseId,
            title: "Combat Readiness: Starting Your CP Journey",
            description: "Set up your environment and solve your first problem.",
            content: "The road to Grandmaster starts here. Learn how to parse input, use the STL (Standard Template Library), and manage your time during intensive coding contests.",
            order: 1,
            duration: 25,
            videoUrl: "https://www.youtube.com/embed/09_LlHjoEiY",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What does STL stand for in C++?",
                options: ["Standard Transmission Language", "Simple Teaching Level", "Standard Template Library", "Single Threaded Link"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Advanced Combat: Dynamic Programming",
            description: "Master the art of solving subproblems.",
            content: "Optimization is often about recognizing overlapping subproblems. We'll explore the core patterns of DP to tackle high-level contest challenges.",
            order: 2,
            duration: 40,
            videoUrl: "https://www.youtube.com/embed/oBt53YbR9Kk",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What is the key characteristic of problems that can be solved with DP?",
                options: ["They must be linear", "They have overlapping subproblems", "They require sorting first", "They must use Recursion ONLY"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "Assessment: Grandmaster Trial",
            description: "Final evaluation for top-tier competitive programmers.",
            content: "Your final mission. Combine STL mastery with DP optimization to solve these elite-level logic puzzles.",
            order: 3,
            duration: 30,
            videoUrl: null,
            type: "quiz",
            isActive: true,
            quizData: [
              {
                question: "Which data structure is typically used to implement a priority queue in the STL?",
                options: ["Vector", "List", "Heap", "Stack"],
                correctAnswerIndex: 2
              }
            ]
          }
        ];
      } else if (course.title.includes("System Design")) {
        lessons = [
          {
            courseId,
            title: "Architecture: Scalable Systems",
            description: "Design systems that can handle millions of tactical requests.",
            content: "Building for scale requires understanding Load Balancers, Caching, and Database Sharding. We'll design a system from the ground up to handle high-traffic operations.",
            order: 1,
            duration: 40,
            videoUrl: "https://www.youtube.com/embed/m8Icp_Cid5o",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "Which component is used to distribute incoming traffic across multiple servers?",
                options: ["Database", "Cache", "Load Balancer", "Firewall"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "System Design: Database Sharding",
            description: "Learn how to partition large datasets.",
            content: "When a single database can't handle the load, we must shard. We'll explore horizontal partitioning and how it affects system complexity.",
            order: 2,
            duration: 35,
            videoUrl: "https://www.youtube.com/embed/u6O62Wv-mD8",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What is 'Horizontal Partitioning' also known as?",
                options: ["Replication", "Sharding", "Normalization", "Indexing"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "Assessment: System Architecture",
            description: "Evaluate your system design capabilities.",
            content: "Design for scale, reliability, and performance. This assessment checks your understanding of high-availability architectures.",
            order: 3,
            duration: 25,
            videoUrl: null,
            type: "quiz",
            isActive: true,
            quizData: [
              {
                question: "What is the primary reason to use Database Sharding?",
                options: ["To backup data", "To improve security", "To distribute data and load across multiple servers", "To normalize the schema"],
                correctAnswerIndex: 2
              }
            ]
          }
        ];
      }

      // ── NEW COURSE LESSONS ────────────────────────────────────
      else if (course.title.includes("Two Pointers & Sliding Window")) {
        lessons = [
          {
            courseId,
            title: "Intro to Two Pointers Pattern",
            description: "Understand when and why to use the two-pointer approach.",
            content: "The two-pointer technique uses two indices that move through an array simultaneously to reduce time complexity from O(n²) to O(n). It works best on sorted arrays and problems involving pairs.",
            order: 1,
            duration: 20,
            videoUrl: "https://www.youtube.com/embed/On3r4I1p4G0",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "Which precondition often makes the two-pointer approach most effective?",
                options: ["The array must be unsorted", "The array must be sorted", "The array must have duplicates", "The array must be circular"],
                correctAnswerIndex: 1
              },
              {
                question: "What is the time complexity of finding a pair with a target sum using two pointers on a sorted array?",
                options: ["O(n²)", "O(n log n)", "O(n)", "O(1)"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Sliding Window Fundamentals",
            description: "Learn fixed and variable-size sliding window techniques.",
            content: "The sliding window pattern maintains a contiguous subarray of elements and slides it across the input. Used to find max/min subarrays, longest substrings with constraints, and more.",
            order: 2,
            duration: 25,
            videoUrl: "https://www.youtube.com/embed/p-ss2JNynmw",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What is the time complexity of the sliding window approach for 'Maximum Sum Subarray of Size K'?",
                options: ["O(n²)", "O(n log n)", "O(n)", "O(k)"],
                correctAnswerIndex: 2
              },
              {
                question: "Sliding window is most useful when the problem involves:",
                options: ["Entire array at once", "Non-contiguous elements", "A contiguous subarray or substring", "Sorting elements"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Classic Problems: Longest Substrings",
            description: "Solve 'Longest Substring Without Repeating Characters' and similar problems.",
            content: "Using a HashMap with a sliding window, we track character frequencies and shrink the window when a constraint is violated. This pattern solves some of the most frequent interview problems.",
            order: 3,
            duration: 30,
            videoUrl: "https://www.youtube.com/embed/wiGpQwVHdE0",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "In the 'Longest Substring Without Repeating Characters' problem, which data structure tracks seen characters?",
                options: ["Stack", "Queue", "HashMap / Set", "Array sorted by character"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Two Pointer: Container With Most Water",
            description: "Solve the classic container problem using shrinking window.",
            content: "We start with two pointers at both ends and move the shorter side inward to maximize area. This greedy insight, combined with two pointers, gives us an elegant O(n) solution.",
            order: 4,
            duration: 22,
            videoUrl: "https://www.youtube.com/embed/UuiTKBwPgAo",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "In 'Container With Most Water', why do we move the pointer pointing to the shorter line?",
                options: ["Because it causes overflow", "Because the taller side can never limit area more", "Random choice", "To avoid revisiting elements"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "Assessment: Two Pointers & Sliding Window",
            description: "Final quiz to validate your mastery of both techniques.",
            content: "Apply your knowledge of two pointers and sliding window patterns. Choose the most efficient technique for each scenario.",
            order: 5,
            duration: 15,
            videoUrl: null,
            type: "quiz",
            isActive: true,
            quizData: [
              {
                question: "Which pattern is best for 'Find all subarrays with product less than K'?",
                options: ["Brute Force O(n²)", "Sorting", "Sliding Window with two pointers", "Binary Search"],
                correctAnswerIndex: 2
              },
              {
                question: "What is the key difference between a fixed-size and variable-size sliding window?",
                options: ["Fixed size never shrinks; variable size expands/shrinks based on a condition", "Fixed size is always faster", "Variable size always uses a stack", "There is no difference"],
                correctAnswerIndex: 0
              }
            ]
          }
        ];
      }

      else if (course.title.includes("Recursion & Backtracking")) {
        lessons = [
          {
            courseId,
            title: "Recursion Fundamentals & the Call Stack",
            description: "Build a mental model of recursive function calls.",
            content: "Every recursive function has two parts: a base case (stopping condition) and a recursive call that simplifies the problem. The call stack stores each function frame until the base case is reached.",
            order: 1,
            duration: 28,
            videoUrl: "https://www.youtube.com/embed/IJDJ0kBx2LM",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What causes a 'Stack Overflow' error in a recursive function?",
                options: ["Using too many variables", "Missing or incorrect base case causing infinite recursion", "Returning a wrong value", "Using recursion for sorting"],
                correctAnswerIndex: 1
              },
              {
                question: "The base case in recursion is responsible for:",
                options: ["Making recursive calls", "Stopping the recursion", "Initializing variables", "Increasing the call stack depth"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "Generating Permutations & Combinations",
            description: "Use recursion to generate all possible arrangements.",
            content: "Permutations and combinations are foundational backtracking problems. We build candidates incrementally and abandon candidates (backtrack) as soon as they violate constraints.",
            order: 2,
            duration: 35,
            videoUrl: "https://www.youtube.com/embed/s7AvT7cGdSo",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "How many permutations exist for the string 'ABC'?",
                options: ["3", "6", "9", "8"],
                correctAnswerIndex: 1
              },
              {
                question: "In backtracking, 'pruning' means:",
                options: ["Sorting the input", "Skipping branches that cannot lead to a valid solution", "Adding more recursive calls", "Removing base cases"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "N-Queens & Sudoku Solver",
            description: "Solve constraint satisfaction problems with backtracking.",
            content: "Place N queens on an N×N chessboard such that no two queens attack each other. We use row-by-row placement with column, diagonal, and anti-diagonal checks to prune invalid states early.",
            order: 3,
            duration: 40,
            videoUrl: "https://www.youtube.com/embed/Ph95IHmRp5M",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "In the N-Queens problem, what constraint must hold for any two queens?",
                options: ["Same row", "Same column", "No two queens attack each other (row, col, diagonal)", "All must be in corners"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Subset Sum & Word Search",
            description: "Apply backtracking to find subsets and paths.",
            content: "Subset sum asks: 'Can we find a subset that adds up to a target?' We try including or excluding each element. Word Search on a grid uses DFS + backtracking with visited tracking.",
            order: 4,
            duration: 32,
            videoUrl: "https://www.youtube.com/embed/pfiQ_PS1g8E",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "In the Subset Sum problem using backtracking, what is the maximum number of subsets you might explore?",
                options: ["O(n)", "O(n²)", "O(2^n)", "O(n!)"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Assessment: Recursion & Backtracking",
            description: "Validate your recursive and backtracking problem-solving skills.",
            content: "Synthesize your understanding of recursion, backtracking, and constraint satisfaction. Choose the optimal approach for each problem type.",
            order: 5,
            duration: 20,
            videoUrl: null,
            type: "quiz",
            isActive: true,
            quizData: [
              {
                question: "Which problem is best solved using Backtracking?",
                options: ["Finding max in an array", "Binary search", "Generating all valid parentheses", "Computing prefix sum"],
                correctAnswerIndex: 2
              },
              {
                question: "What is the time complexity of generating all permutations of an n-element set?",
                options: ["O(n)", "O(n²)", "O(n log n)", "O(n!)"],
                correctAnswerIndex: 3
              }
            ]
          }
        ];
      }

      else if (course.title.includes("Dynamic Programming Patterns")) {
        lessons = [
          {
            courseId,
            title: "DP Fundamentals: Memoization vs Tabulation",
            description: "Understand top-down and bottom-up DP approaches.",
            content: "Memoization (top-down) uses recursion with a cache. Tabulation (bottom-up) fills a table iteratively. Both eliminate redundant sub-computations. We compare them on Fibonacci and Climbing Stairs.",
            order: 1,
            duration: 35,
            videoUrl: "https://www.youtube.com/embed/oBt53YbR9Kk",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "Which DP technique fills a table from the smallest subproblems up?",
                options: ["Memoization (top-down)", "Tabulation (bottom-up)", "Divide & Conquer", "Greedy"],
                correctAnswerIndex: 1
              },
              {
                question: "Dynamic Programming is applicable when a problem has:",
                options: ["Only one solution", "Overlapping subproblems and optimal substructure", "Random input", "Sorted data always"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "Knapsack Problem (0/1 & Unbounded)",
            description: "Master item selection under weight constraints.",
            content: "The 0/1 Knapsack asks: given items with weights and values, maximize value without exceeding capacity. We build a 2D DP table where dp[i][w] = max value using first i items and capacity w.",
            order: 2,
            duration: 40,
            videoUrl: "https://www.youtube.com/embed/nLmhmB6NzcM",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "In 0/1 Knapsack DP, what does dp[i][w] represent?",
                options: ["Max items fitted in weight w", "Max value using first i items with capacity w", "Remaining capacity after i items", "Index of selected item i"],
                correctAnswerIndex: 1
              },
              {
                question: "What is the time complexity of the standard 0/1 Knapsack DP solution (n items, W capacity)?",
                options: ["O(n)", "O(n + W)", "O(n × W)", "O(2^n)"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Longest Common Subsequence (LCS) & LIS",
            description: "Solve classic subsequence DP problems.",
            content: "LCS finds the longest sequence common to two strings. LIS (Longest Increasing Subsequence) finds the longest strictly increasing subsequence in an array. Both use 2D and 1D DP tables respectively.",
            order: 3,
            duration: 38,
            videoUrl: "https://www.youtube.com/embed/NnD96abizww",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What is the time complexity of the standard LCS DP algorithm for strings of length m and n?",
                options: ["O(m + n)", "O(m × n)", "O((m + n) log n)", "O(2^n)"],
                correctAnswerIndex: 1
              },
              {
                question: "The LIS problem can be solved in O(n log n) using:",
                options: ["Simple 1D DP only", "Sorting + DP", "Binary Search + Patience Sorting", "BFS"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Matrix DP & Coin Change",
            description: "Apply DP on grids and unbounded item selection.",
            content: "Matrix DP problems like 'Unique Paths' and 'Minimum Path Sum' fill a grid based on adjacent cells. Coin Change is an unbounded knapsack variant — we can reuse coins with no restriction.",
            order: 4,
            duration: 33,
            videoUrl: "https://www.youtube.com/embed/H9bfqozjoqs",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "In 'Coin Change' (minimum coins for amount), what base case initializes the DP array?",
                options: ["dp[0] = 1", "dp[0] = 0", "dp[0] = infinity", "dp[amount] = 0"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "Assessment: DP Patterns Mastery",
            description: "Final test on all core dynamic programming patterns.",
            content: "Prove mastery over memoization, knapsack, LCS, LIS, and matrix DP. Identify the correct pattern for each problem scenario.",
            order: 5,
            duration: 20,
            videoUrl: null,
            type: "quiz",
            isActive: true,
            quizData: [
              {
                question: "Which DP pattern applies to 'Edit Distance' (Levenshtein distance)?",
                options: ["1D DP", "2D DP (LCS-style)", "Knapsack", "Matrix path DP"],
                correctAnswerIndex: 1
              },
              {
                question: "If a DP problem requires choosing multiple items with repetition, it is classified as:",
                options: ["0/1 Knapsack", "Unbounded Knapsack", "LCS Problem", "Matrix DP"],
                correctAnswerIndex: 1
              }
            ]
          }
        ];
      }

      else if (course.title.includes("Trees & Binary Search Trees")) {
        lessons = [
          {
            courseId,
            title: "Tree Representation & Terminology",
            description: "Understand nodes, edges, height, depth, and tree types.",
            content: "A tree is a hierarchical data structure with a root node and child subtrees. Key terms: root, leaf, height (longest path to leaf), depth (path from root). A Binary Tree has at most 2 children per node.",
            order: 1,
            duration: 25,
            videoUrl: "https://www.youtube.com/embed/oSWTXtMglKE",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "What is the height of a tree with only a root node?",
                options: ["0", "1", "-1", "Undefined"],
                correctAnswerIndex: 0
              },
              {
                question: "A leaf node in a tree is a node that has:",
                options: ["No parent", "No children", "Exactly one child", "Two children"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "DFS Traversals: Inorder, Preorder, Postorder",
            description: "Master all three depth-first traversal orders.",
            content: "Inorder (Left-Root-Right) gives sorted output for a BST. Preorder (Root-Left-Right) is used for copying/serializing trees. Postorder (Left-Right-Root) is used for deletion and expression evaluation.",
            order: 2,
            duration: 30,
            videoUrl: "https://www.youtube.com/embed/WLvU5EQVZqY",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "Inorder traversal of a Binary Search Tree gives elements in:",
                options: ["Random order", "Descending order", "Ascending (sorted) order", "Level-order"],
                correctAnswerIndex: 2
              },
              {
                question: "Which traversal visits the root BEFORE its children?",
                options: ["Inorder", "Postorder", "Preorder", "Level-order"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "BFS Level-Order Traversal",
            description: "Traverse trees level by level using a queue.",
            content: "Level-order traversal visits all nodes at the same depth before going deeper. It uses a Queue: enqueue root, then for each dequeued node enqueue its children. Used for zigzag traversal, right-side view, etc.",
            order: 3,
            duration: 22,
            videoUrl: "https://www.youtube.com/embed/86g8jAQug04",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "Which data structure is used to implement BFS (level-order) traversal of a tree?",
                options: ["Stack", "Queue", "HashMap", "Array"],
                correctAnswerIndex: 1
              }
            ]
          },
          {
            courseId,
            title: "Binary Search Tree: Insert, Delete, Search",
            description: "Implement and analyze all core BST operations.",
            content: "A BST maintains the property: all left descendants < node < all right descendants. Search, Insert are O(h). Delete has 3 cases: no child, one child, two children (replace with inorder successor).",
            order: 4,
            duration: 35,
            videoUrl: "https://www.youtube.com/embed/gcULXE7ViZw",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "When deleting a node with TWO children from a BST, which node replaces it?",
                options: ["The root", "The leftmost node", "The inorder successor (smallest in right subtree)", "A random node"],
                correctAnswerIndex: 2
              },
              {
                question: "What is the average time complexity of Search in a balanced BST?",
                options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Common Tree Interview Problems",
            description: "Solve LCA, diameter, max depth, and path sum.",
            content: "Key interview problems: Maximum Depth (DFS returning height), Diameter (max of left+right height per node), Lowest Common Ancestor (LCA), Path Sum (DFS subtracting target). All use DFS recursion.",
            order: 5,
            duration: 40,
            videoUrl: "https://www.youtube.com/embed/4r_A2fmasZo",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "The diameter of a binary tree is defined as:",
                options: ["The height of the tree", "The number of nodes", "The longest path between any two nodes", "The width at the widest level"],
                correctAnswerIndex: 2
              }
            ]
          },
          {
            courseId,
            title: "Assessment: Trees & BST Mastery",
            description: "Final evaluation covering all tree concepts and operations.",
            content: "Demonstrate your mastery of tree traversals, BST operations, and common tree problem patterns.",
            order: 6,
            duration: 20,
            videoUrl: null,
            type: "quiz",
            isActive: true,
            quizData: [
              {
                question: "To check if a Binary Tree is a valid BST, which traversal should produce a sorted sequence?",
                options: ["Preorder", "Postorder", "Inorder", "Level-order"],
                correctAnswerIndex: 2
              },
              {
                question: "The worst-case time complexity of BST operations on an unbalanced BST is:",
                options: ["O(log n)", "O(1)", "O(n)", "O(n log n)"],
                correctAnswerIndex: 2
              }
            ]
          }
        ];
      }
      else {
        lessons = [
          {
            courseId,
            title: "Course Briefing",
            description: "Initial intel on the course objectives",
            content: "Standard operational procedure for this tactical module. Review the briefing carefully before proceeding to the extraction protocol.",
            order: 1,
            duration: 10,
            videoUrl: "https://www.youtube.com/embed/vLnPwxZdW4Y",
            type: "video",
            isActive: true,
            quizData: [
              {
                question: "Are you ready to begin the mission?",
                options: ["Affirmative", "Negative"],
                correctAnswerIndex: 0
              }
            ]
          }
        ];
      }

      lessons.forEach(lessonData => {
        const id = randomUUID();
        const lesson: Lesson = {
          ...lessonData,
          id,
          createdAt: new Date(),
          quizData: lessonData.quizData || null,
          type: (lessonData.type as string | null) || "video"
        };
        this.lessons.set(id, lesson);
      });
    });
  }

}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  private db: any;

  constructor(dbInstance: any) {
    this.db = dbInstance;

    const PgStore = connectPgSimple(session);
    this.sessionStore = new PgStore({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true
    });
    this.autoPatchDatabase().catch(err => console.error("Auto-patch failed:", err));
    this.initializeAdminUser().catch(err => console.error("Admin initialization failed:", err));
    this.seedChallengeData().catch(err => console.error("Challenge seeding failed:", err));
  }

  async seedChallengeData() {
    try {
      // Seed Typing Challenges
      const existingTyping = await this.db.select().from(typingChallenges);
      if (existingTyping.length === 0) {
        console.log("🌱 Seeding Typing Challenges...");
        await this.db.insert(typingChallenges).values(typingSeed);
      }

      // Seed Quiz Questions
      const existingQuiz = await this.db.select().from(quizQuestions);
      if (existingQuiz.length === 0) {
        console.log("🌱 Seeding Quiz Questions...");
        await this.db.insert(quizQuestions).values(quizSeed);
      }

      // Seed Brain Teasers
      const existingTeasers = await this.db.select().from(brainTeasers);
      if (existingTeasers.length === 0) {
        console.log("🌱 Seeding Brain Teasers...");
        await this.db.insert(brainTeasers).values(teaserSeed);
      }
    } catch (err) {
      console.error("Error seeding challenge data:", err);
    }
  }

  private async initializeAdminUser() {
    try {
      const [existingAdmin] = await this.db.select().from(users).where(eq(users.username, "admin"));
      if (existingAdmin) return;

      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);

      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync("admin123", salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      await this.db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        role: "admin",
      });
      console.log("✅ Default admin user created (admin / admin123)");
    } catch (err) {
      console.error("Error creating admin user:", err);
    }
  }

  async autoPatchDatabase() {
    try {
      console.log("📡 Intelligence Sync: Initializing...");
      // Small delay to ensure DB connection is stable
      await new Promise(resolve => setTimeout(resolve, 3000));

      const existingLessons = await this.db.select().from(lessons);
      console.log(`📡 Intelligence Sync: Found ${existingLessons.length} records.`);

      const patches = [
        {
          title: "Introduction to Data Structures",
          updates: {
            videoUrl: "https://www.youtube.com/embed/8hly31xKli0",
            type: "video",
            content: "Data structures are the backbone of efficient software. We'll start with an overview of how computers store information and the basic categories of data organization.",
            quizData: [
              {
                question: "What is the time complexity to insert an element at the beginning of an array?",
                options: ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
                correctAnswerIndex: 2
              },
              {
                question: "Which data structure is best for LIFO (Last-In-First-Out) operations?",
                options: ["Queue", "Stack", "Linked List", "Hash Table"],
                correctAnswerIndex: 1
              }
            ]
          }
        },
        {
          title: "Arrays and Lists",
          updates: {
            videoUrl: "https://www.youtube.com/embed/Zv7vS_3K4h8",
            type: "video",
            content: "Arrays are the most fundamental data structure. We explore how they are indexed and how dynamic arrays (like vectors) handle resizing.",
            quizData: [
              {
                question: "What is the main advantage of an array over a linked list?",
                options: ["Constant time access by index", "Infinite dynamic scaling", "Efficient insertion at the beginning", "Zero memory overhead"],
                correctAnswerIndex: 0
              },
              {
                question: "Which operation is O(1) in a static array?",
                options: ["Searching for a value", "Deleting an element", "Inserting at index 0", "Accessing a specific index"],
                correctAnswerIndex: 3
              }
            ]
          }
        },
        {
          title: "Linked Lists",
          updates: {
            videoUrl: "https://www.youtube.com/embed/Hj_rUuM8Y_0",
            type: "video",
            content: "Linked lists offer flexible memory management. We'll compare them to arrays and understand pointers.",
            quizData: [
              {
                question: "In a singly linked list, what does each node store besides the data?",
                options: ["The index of the node", "A pointer to the next node", "The size of the list", "A pointer to the previous node"],
                correctAnswerIndex: 1
              }
            ]
          }
        },
        {
          title: "Stacks and Queues",
          updates: {
            videoUrl: "https://www.youtube.com/embed/A3ZNCqZ0NoM",
            type: "video",
            content: "Master the stack (Last-In-First-Out) and queue (First-In-First-Out) protocols.",
            quizData: [
              {
                question: "Which principle determines the behavior of a Stack?",
                options: ["FIFO (First-In-First-Out)", "LIFO (Last-In-First-Out)", "Priority-based", "Random Access"],
                correctAnswerIndex: 1
              }
            ]
          }
        },
        {
          title: "Course Briefing",
          courseTitle: "Advanced Problem Solving",
          updates: {
            videoUrl: "https://www.youtube.com/embed/zMtI_n27dTM",
            duration: 15,
            content: "Advanced Graph Theory is the core of sophisticated problem solving. This briefing introduces the advanced tactical landscape of this course."
          }
        },
        {
          title: "Course Briefing",
          courseTitle: "Programming Fundamentals",
          updates: {
            videoUrl: "https://www.youtube.com/embed/vLnPwxZdW4Y",
            duration: 15,
            content: "Welcome to the mission. This briefing covers the fundamental objectives and technical landscape we will be operating in. Watch the tactical overview to prepare for the challenges ahead."
          }
        },
        {
          title: "Course Briefing",
          courseTitle: "Data Structures Essentials",
          updates: {
            videoUrl: "https://www.youtube.com/embed/Zv7vS_3K4h8",
            duration: 15,
            content: "Data structures are the backbone of efficient software. This briefing outlines the critical organization methods we'll master."
          }
        },
        {
          title: "Course Briefing",
          courseTitle: "Algorithms Design & Analysis",
          updates: {
            videoUrl: "https://www.youtube.com/embed/RBSGKlAvoiM",
            duration: 15,
            content: "Speed is the ultimate advantage. This briefing introduces Big O notation and the strategic importance of algorithm analysis."
          }
        },
        {
          title: "Course Briefing",
          courseTitle: "Competitive Programming Mastery",
          updates: {
            videoUrl: "https://www.youtube.com/embed/8hly31xKli0",
            duration: 15,
            content: "Elite training for the world stage. This briefing prepares you for the high-intensity world of competitive programming contests."
          }
        },
        {
          title: "Course Briefing",
          courseTitle: "System Design",
          updates: {
            videoUrl: "https://www.youtube.com/embed/m8Icp_Cid5o",
            duration: 15,
            content: "Architecture at scale. This briefing introduces the principles of designing high-availability, distributed systems."
          }
        },
        {
          title: "Advanced Tactics: Graph Theory",
          isCritical: true,
          courseTitle: "Advanced Problem Solving",
          order: 2,
          updates: {
            videoUrl: "https://www.youtube.com/embed/zMtI_n27dTM",
            description: "Master complex graph algorithms and structures.",
            content: "Graphs are everywhere. In this module, we dive into Dijkstra, Bellman-Ford, and Minimum Spanning Trees to solve the most difficult navigational problems.",
            duration: 45,
            quizData: [
              {
                question: "Which algorithm is best for finding the shortest path in a graph WITH negative edge weights?",
                options: ["BFS", "Dijkstra", "Bellman-Ford", "Floyd-Warshall"],
                correctAnswerIndex: 2
              }
            ]
          }
        },
        {
          title: "Mathematical Warfare: Number Theory",
          isCritical: true,
          courseTitle: "Advanced Problem Solving",
          order: 3,
          updates: {
            videoUrl: "https://www.youtube.com/embed/U_h7pbeTntk",
            duration: 40,
            content: "Primes, GCD, and modular inverses are the building blocks of cryptography and complex logic puzzles.",
            quizData: [
              {
                question: "What is the complexity of the Euclidean algorithm for GCD?",
                options: ["O(n)", "O(log n)", "O(1)", "O(n^2)"],
                correctAnswerIndex: 1
              }
            ]
          }
        },
        {
          title: "Tactical Strings: Suffix Structures",
          isCritical: true,
          courseTitle: "Advanced Problem Solving",
          order: 4,
          updates: {
            videoUrl: "https://www.youtube.com/embed/V59ax7InSio",
            duration: 35,
            content: "Pattern matching at scale requires advanced structures like Suffix Arrays and Automata.",
            quizData: [
              {
                question: "Which structure is most efficient for multiple pattern matching in a single text?",
                options: ["Aho-Corasick", "Binary Search Tree", "Linked List", "Stack"],
                correctAnswerIndex: 0
              }
            ]
          }
        },
        {
          title: "The Briefing: C++ Foundations",
          courseTitle: "Programming Fundamentals",
          updates: {
            videoUrl: "https://www.youtube.com/embed/vLnPwxZdW4Y",
            type: "video",
            quizData: [
              {
                question: "What is the correct syntax to output 'Hello World' in C++?",
                options: ["system.out.println(\"Hello World\");", "console.log(\"Hello World\");", "cout << \"Hello World\";", "print(\"Hello World\");"],
                correctAnswerIndex: 2
              },
              {
                question: "Which directive is used to include the input-output stream library?",
                options: ["#include <iostream>", "#import <stream>", "using namespace std;", "void main()"],
                correctAnswerIndex: 0
              }
            ]
          }
        },
        {
          title: "Mission: Data Types & Variables",
          isCritical: true,
          courseTitle: "Programming Fundamentals",
          order: 2,
          updates: {
            type: "theory",
            quizData: [
              {
                question: "Which data type is specifically used to store text sequences?",
                options: ["int", "char", "string", "double"],
                correctAnswerIndex: 2
              },
              {
                question: "What is the result of '5 / 2' in integer division in C++?",
                options: ["2.5", "2", "3", "Error"],
                correctAnswerIndex: 1
              }
            ]
          }
        },
        {
          title: "Assessment: Data Structures Mastery",
          isCritical: true,
          courseTitle: "Data Structures Essentials",
          order: 5,
          updates: {
            quizData: [
              {
                question: "Which data structure provides the fastest access to an element if you know its position?",
                options: ["Stack", "Queue", "Array", "Linked List"],
                correctAnswerIndex: 2
              },
              {
                question: "In what situation would a Linked List be preferred over an Array?",
                options: ["Frequent random access", "When memory is tight and fixed", "High frequency of insertions/deletions at the beginning", "When sorting is the primary goal"],
                correctAnswerIndex: 2
              }
            ]
          }
        },
        {
          title: "Assessment: Algorithmic Efficiency",
          isCritical: true,
          courseTitle: "Algorithms Design & Analysis",
          order: 3,
          updates: {
            quizData: [
              {
                question: "Compare O(n) and O(log n). Which grows faster as n becomes very large?",
                options: ["O(log n)", "O(n)", "They grow at the same rate", "It depends on the constant factors"],
                correctAnswerIndex: 1
              }
            ]
          }
        },
        {
          title: "Assessment: Advanced Tactics",
          isCritical: true,
          courseTitle: "Advanced Problem Solving",
          order: 5,
          updates: {
            description: "Final evaluation of your advanced problem-solving capabilities.",
            content: "The extraction protocol is active. Prove your mastery of graphs, numbers, and strings.",
            quizData: [
              {
                question: "What is the primary constraint for using Dijkstra's algorithm?",
                options: ["Graph must be acyclic", "Edges must have non-negative weights", "Must be a complete graph", "Max 100 nodes"],
                correctAnswerIndex: 1
              }
            ]
          }
        },
        {
          title: "Assessment: Grandmaster Trial",
          isCritical: true,
          courseTitle: "Competitive Programming Mastery",
          order: 3,
          updates: {
            quizData: [
              {
                question: "Which data structure is typically used to implement a priority queue in the STL?",
                options: ["Vector", "List", "Heap", "Stack"],
                correctAnswerIndex: 2
              }
            ]
          }
        },
        {
          title: "Assessment: System Architecture",
          isCritical: true,
          courseTitle: "System Design",
          order: 3,
          updates: {
            quizData: [
              {
                question: "What is the primary reason to use Database Sharding?",
                options: ["To backup data", "To improve security", "To distribute data and load across multiple servers", "To normalize the schema"],
                correctAnswerIndex: 2
              }
            ]
          }
        }
      ];

      const allCourses = await this.db.select().from(courses);

      for (const patch of patches) {
        let matchingLesson;
        if (patch.courseTitle) {
          const course = allCourses.find((c: any) => c.title.toLowerCase().includes(patch.courseTitle.toLowerCase()));
          if (course) {
            matchingLesson = existingLessons.find((l: any) =>
              l.title.trim() === patch.title.trim() &&
              l.courseId === course.id
            );
          }
        } else {
          matchingLesson = existingLessons.find((l: any) => l.title.trim() === patch.title.trim());
        }

        if (matchingLesson) {
          console.log(`📡 Intelligence Sync: Updating mission -> ${patch.title}`);
          await this.db.update(lessons)
            .set(patch.updates)
            .where(eq(lessons.id, matchingLesson.id));
        } else if (patch.isCritical) {
          console.log(`📡 Intelligence Sync: Deploying critical mission -> ${patch.title}`);
          const course = allCourses.find((c: any) => c.title.includes(patch.courseTitle || ""));

          if (course) {
            await this.db.insert(lessons).values({
              courseId: course.id,
              title: patch.title,
              description: (patch.updates as any).description || "Module Assessment",
              content: (patch.updates as any).content || "Quiz content",
              order: patch.order || 5,
              duration: (patch.updates as any).duration || 15,
              videoUrl: (patch.updates as any).videoUrl || null,
              type: (patch.updates as any).type || "video",
              quizData: patch.updates.quizData,
              isActive: true
            } as any); // Added 'as any' here
          }
        } else {
          console.log(`📡 Intelligence Sync: Mission not found -> ${patch.title}`);
        }
      }
      console.log("📡 Intelligence Sync: Complete.");
      await this.seedChallenges();
    } catch (error) {
      console.warn("Intelligence sync deferred: ", error);
    }
  }

  async seedChallenges() {
    try {
      console.log("🌱 Challenges Sync: Initializing...");

      // Seed Typing Challenges
      for (const challenge of typingSeed) {
        const existing = await this.db.select().from(typingChallenges).where(eq(typingChallenges.id, challenge.id)).limit(1);
        if (!existing.length) {
          await this.db.insert(typingChallenges).values(challenge);
        }
      }

      // Seed Quiz Questions
      for (const question of quizSeed) {
        const existing = await this.db.select().from(quizQuestions).where(eq(quizQuestions.id, question.id)).limit(1);
        if (!existing.length) {
          await this.db.insert(quizQuestions).values(question);
        }
      }

      // Seed Brain Teasers
      for (const teaser of teaserSeed) {
        const existing = await this.db.select().from(brainTeasers).where(eq(brainTeasers.id, teaser.id)).limit(1);
        if (!existing.length) {
          await this.db.insert(brainTeasers).values({
            ...teaser,
            date: new Date(teaser.date)
          });
        }
      }

      console.log("🌱 Challenges Sync: Complete.");
    } catch (error) {
      console.warn("Challenges sync deferred: ", error);
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser & { googleId?: string }): Promise<User> {
    const role = (insertUser as any).username === "admin" ? "admin" : ((insertUser as any).role || "user");
    const insertData = { 
      ...insertUser, 
      role, 
      googleId: insertUser.googleId || null 
    };
    
    const result = await this.db.insert(users).values(insertData as any).returning();
    return result[0];
  }


  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async updateUserStreak(userId: string, streak: number): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ streak, lastDailySolve: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async getUserActivity(userId: string): Promise<UserActivity[]> {
    return await this.db.select().from(userActivity)
      .where(eq(userActivity.userId, userId))
      .orderBy(desc(userActivity.date));
  }

  async trackUserActivity(userId: string, minutes: number, questions: number): Promise<void> {
    // Current date (start of day)
    // Find if activity exists for today (comparing only the date part)
    const existing = await this.db.select().from(userActivity)
      .where(and(
        eq(userActivity.userId, userId),
        sql`DATE(${userActivity.date}) = CURRENT_DATE`
      ))
      .limit(1);

    if (existing && existing.length > 0) {
      await this.db.update(userActivity)
        .set({
          minutesActive: sql`${userActivity.minutesActive} + ${minutes}`,
          questionsSolved: sql`${userActivity.questionsSolved} + ${questions}`
        })
        .where(eq(userActivity.id, existing[0].id));
    } else {
      await this.db.insert(userActivity).values({
        userId,
        minutesActive: minutes,
        questionsSolved: questions,
        date: new Date(),
      });
    }
  }

  // Contest operations
  async createContest(insertContest: InsertContest): Promise<Contest> {
    const startTime = new Date(insertContest.startTime);
    const endTime = new Date(insertContest.endTime);
    const computedDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const result = await this.db.insert(contests).values({
      ...insertContest,
      duration: insertContest.duration || computedDuration,
      lastUpdated: new Date(),
      notified: insertContest.notified ?? false
    }).returning();
    return result[0];
  }

  async getContest(id: string): Promise<Contest | undefined> {
    const result = await this.db.select().from(contests).where(eq(contests.id, id)).limit(1);
    return result[0];
  }

  async getAllContests(): Promise<Contest[]> {
    return await this.db.select().from(contests).orderBy(asc(contests.startTime));
  }

  async updateContestStatus(id: string, status: string): Promise<Contest | undefined> {
    const result = await this.db.update(contests)
      .set({ status })
      .where(eq(contests.id, id))
      .returning();
    return result[0];
  }

  async updateContestParticipants(id: string, participants: number): Promise<Contest | undefined> {
    const result = await this.db.update(contests)
      .set({ participants })
      .where(eq(contests.id, id))
      .returning();
    return result[0];
  }

  // Bookmark operations
  async getBookmarks(userId: string): Promise<any[]> {
    return await this.db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
  }

  async createBookmark(userId: string, contestId: string): Promise<any> {
    const [result] = await this.db.insert(bookmarks).values({ userId, contestId }).returning();
    return result;
  }

  async deleteBookmark(userId: string, contestId: string): Promise<void> {
    await this.db.delete(bookmarks).where(
      and(eq(bookmarks.userId, userId), eq(bookmarks.contestId, contestId))
    );
  }

  // Problem operations
  async createProblem(insertProblem: InsertProblem): Promise<Problem> {
    const result = await this.db.insert(problems).values(insertProblem).returning();
    return result[0];
  }

  async getProblemsByContest(contestId: string): Promise<Problem[]> {
    return await this.db.select().from(problems).where(eq(problems.contestId, contestId));
  }

  async getProblem(id: string): Promise<Problem | undefined> {
    const result = await this.db.select().from(problems).where(eq(problems.id, id)).limit(1);
    return result[0];
  }

  // Submission operations
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const result = await this.db.insert(submissions).values(insertSubmission).returning();
    return result[0];
  }

  async getSubmissionsByUser(userId: string, contestId?: string): Promise<Submission[]> {
    if (contestId) {
      return await this.db.select().from(submissions)
        .where(and(eq(submissions.userId, userId), eq(submissions.contestId, contestId)))
        .orderBy(desc(submissions.submittedAt));
    }
    return await this.db.select().from(submissions)
      .where(eq(submissions.userId, userId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getSubmissionsByProblem(problemId: string): Promise<Submission[]> {
    return await this.db.select().from(submissions)
      .where(eq(submissions.problemId, problemId))
      .orderBy(desc(submissions.submittedAt));
  }

  async updateSubmissionStatus(id: string, status: string, score?: number): Promise<Submission | undefined> {
    const updates: { status: string; score?: number } = { status };
    if (score !== undefined) {
      updates.score = score;
    }
    const result = await this.db.update(submissions)
      .set(updates)
      .where(eq(submissions.id, id))
      .returning();
    return result[0];
  }

  // Course operations
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const result = await this.db.insert(courses).values(insertCourse).returning();
    return result[0];
  }

  async getAllCourses(): Promise<Course[]> {
    return await this.db.select().from(courses)
      .where(eq(courses.isActive, true))
      .orderBy(asc(courses.level), asc(courses.title));
  }

  async getCoursesByLevel(level: string): Promise<Course[]> {
    return await this.db.select().from(courses)
      .where(and(eq(courses.isActive, true), eq(courses.level, level)))
      .orderBy(asc(courses.title));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const result = await this.db.select().from(courses).where(eq(courses.id, id)).limit(1);
    return result[0];
  }

  // Lesson operations
  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const result = await this.db.insert(lessons).values(insertLesson).returning();
    return result[0];
  }

  async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    return await this.db.select().from(lessons)
      .where(and(eq(lessons.courseId, courseId), eq(lessons.isActive, true)))
      .orderBy(asc(lessons.order));
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const result = await this.db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
    return result[0];
  }

  async updateLesson(id: string, updates: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const result = await this.db.update(lessons)
      .set(updates)
      .where(eq(lessons.id, id))
      .returning();
    return result[0];
  }

  // Enrollment operations
  async enrollInCourse(userId: string, courseId: string): Promise<Enrollment> {
    // Check if already enrolled
    const existing = await this.getEnrollment(userId, courseId);
    if (existing) {
      return existing;
    }

    const result = await this.db.insert(enrollments).values({
      userId,
      courseId,
      progress: 0,
      timeSpent: 0,
      status: 'active',
    }).returning();

    // Update course student count
    const course = await this.getCourse(courseId);
    if (course) {
      await this.db.update(courses)
        .set({ students: (course.students || 0) + 1 })
        .where(eq(courses.id, courseId));
    }

    return result[0];
  }

  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    return await this.db.select().from(enrollments)
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.lastAccessedAt));
  }

  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    const result = await this.db.select().from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);
    return result[0];
  }

  async updateEnrollmentProgress(userId: string, courseId: string, progress: number, timeSpent?: number): Promise<Enrollment | undefined> {
    const enrollment = await this.getEnrollment(userId, courseId);
    if (!enrollment) return undefined;

    const updates: { progress: number; timeSpent?: number; lastAccessedAt: Date } = {
      progress: Math.min(100, Math.max(0, progress)),
      lastAccessedAt: new Date(),
    };

    if (timeSpent !== undefined) {
      updates.timeSpent = (enrollment.timeSpent || 0) + timeSpent;
    }

    const result = await this.db.update(enrollments)
      .set(updates)
      .where(eq(enrollments.id, enrollment.id))
      .returning();
    return result[0];
  }

  async completeEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    const enrollment = await this.getEnrollment(userId, courseId);
    if (!enrollment) return undefined;

    const result = await this.db.update(enrollments)
      .set({
        progress: 100,
        status: 'completed',
        completedAt: new Date(),
        lastAccessedAt: new Date(),
      })
      .where(eq(enrollments.id, enrollment.id))
      .returning();
    return result[0];
  }

  // Lesson Progress operations
  async updateLessonProgress(enrollmentId: string, lessonId: string, userId: string, completed: boolean, timeSpent?: number): Promise<LessonProgress> {
    const existing = await this.db.select().from(lessonProgress)
      .where(and(
        eq(lessonProgress.enrollmentId, enrollmentId),
        eq(lessonProgress.lessonId, lessonId),
        eq(lessonProgress.userId, userId)
      ))
      .limit(1);

    if (existing[0]) {
      const updates: { completed: boolean; timeSpent?: number; completedAt?: Date | null; lastAccessedAt: Date } = {
        completed,
        lastAccessedAt: new Date(),
      };

      if (timeSpent !== undefined) {
        updates.timeSpent = (existing[0].timeSpent || 0) + timeSpent;
      }

      if (completed && !existing[0].completed) {
        updates.completedAt = new Date();
      }

      const result = await this.db.update(lessonProgress)
        .set(updates)
        .where(eq(lessonProgress.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      const result = await this.db.insert(lessonProgress).values({
        enrollmentId,
        lessonId,
        userId,
        completed,
        timeSpent: timeSpent || 0,
        completedAt: completed ? new Date() : null,
      }).returning();
      return result[0];
    }
  }

  async getLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | undefined> {
    const result = await this.db.select().from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lessonId)))
      .limit(1);
    return result[0];
  }

  async getEnrollmentLessonProgress(enrollmentId: string): Promise<LessonProgress[]> {
    return await this.db.select().from(lessonProgress)
      .where(eq(lessonProgress.enrollmentId, enrollmentId))
      .orderBy(desc(lessonProgress.lastAccessedAt));
  }

  // Challenge operations
  async getChallengeStats(userId: string): Promise<any> {
    const scores = await this.db.select().from(typingScores).where(eq(typingScores.userId, userId));
    const attempts = await this.db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
    const teaserSolves = await this.db.select().from(teaserAttempts).where(
      and(eq(teaserAttempts.userId, userId), eq(teaserAttempts.solved, true))
    );
    const userData = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userData[0];

    const totalWeight = attempts.reduce((acc: any, curr: any) => acc + (curr.totalQuestions || 1), 0);
    const totalScore = attempts.reduce((acc: any, curr: any) => acc + (curr.score || 0), 0);
    const avgScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

    return {
      typing: {
        completed: scores.length,
        bestWPM: scores.length ? Math.max(...scores.map((s: any) => s.wpm)) : 0,
      },
      quiz: {
        completed: attempts.length,
        averageScore: avgScore,
      },
      brainTeaser: {
        streak: user?.streak || 0,
        totalSolved: teaserSolves.length,
      }
    };
  }

  async getRandomTypingChallenge(difficulty: string, language: string): Promise<any> {
    const results = await this.db.select().from(typingChallenges).where(
      and(
        eq(typingChallenges.difficulty, difficulty),
        eq(typingChallenges.language, language)
      )
    );
    if (!results.length) return null;
    return results[Math.floor(Math.random() * results.length)];
  }

  async submitTypingScore(data: any): Promise<any> {
    const result = await this.db.insert(typingScores).values(data).returning();
    return result[0];
  }

  async getTypingLeaderboard(): Promise<any[]> {
    const scores = await this.db.select({
      userId: typingScores.userId,
      wpm: typingScores.wpm,
      accuracy: typingScores.accuracy,
      username: users.username,
      completedAt: typingScores.completedAt
    })
      .from(typingScores)
      .innerJoin(users, eq(typingScores.userId, users.id))
      .orderBy(desc(typingScores.wpm))
      .limit(10);
    return scores;
  }

  async getQuizQuestions(topic: string, difficulty: string, count: number): Promise<any[]> {
    const questions = await this.db.select().from(quizQuestions).where(
      and(
        eq(quizQuestions.topic, topic),
        eq(quizQuestions.difficulty, difficulty)
      )
    );
    return questions.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  async submitQuizAttempt(data: any): Promise<any> {
    const result = await this.db.insert(quizAttempts).values(data).returning();
    return result[0];
  }

  async getQuizStats(userId: string): Promise<any> {
    const attempts = await this.db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
    return {
      totalAttempts: attempts.length,
      avgScore: attempts.length ? Math.round(attempts.reduce((acc: any, curr: any) => acc + curr.score, 0) / attempts.length) : 0,
      bestScore: attempts.length ? Math.max(...attempts.map((a: any) => a.score)) : 0,
    };
  }

  async getDailyBrainTeaser(): Promise<any> {
    const allTeasers = await this.db.select().from(brainTeasers);
    if (allTeasers.length === 0) return null;

    const today = new Date();
    const hash = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = hash % allTeasers.length;
    return allTeasers[index];
  }

  async getTeaserAttempt(userId: string, teaserId: string): Promise<any> {
    const result = await this.db.select().from(teaserAttempts).where(
      and(eq(teaserAttempts.userId, userId), eq(teaserAttempts.teaserId, teaserId))
    ).limit(1);
    return result[0];
  }

  async submitTeaserAnswer(userId: string, teaserId: string, answer: string): Promise<any> {
    const teaser = await this.db.select().from(brainTeasers).where(eq(brainTeasers.id, teaserId)).limit(1);
    const teaserData = teaser[0];
    if (!teaserData) throw new Error("Teaser not found");

    const correct = answer.toLowerCase().trim() === teaserData.solution.toLowerCase().trim();
    const existing = await this.getTeaserAttempt(userId, teaserId);

    if (existing) {
      const result = await this.db.update(teaserAttempts).set({
        attempts: (existing.attempts || 0) + 1,
        solved: existing.solved || correct,
        userAnswer: answer,
        solvedAt: (existing.solved || correct) && !existing.solvedAt ? new Date() : existing.solvedAt
      }).where(eq(teaserAttempts.id, existing.id)).returning();
      return { correct, attempt: result[0] };
    } else {
      const result = await this.db.insert(teaserAttempts).values({
        userId,
        teaserId,
        solved: correct,
        userAnswer: answer,
        attempts: 1,
        solvedAt: correct ? new Date() : null
      }).returning();
      return { correct, attempt: result[0] };
    }
  }

  async recordHintUsed(userId: string, teaserId: string): Promise<void> {
    const existing = await this.getTeaserAttempt(userId, teaserId);
    if (existing) {
      await this.db.update(teaserAttempts).set({
        hintsUsed: (existing.hintsUsed || 0) + 1
      }).where(eq(teaserAttempts.id, existing.id));
    } else {
      await this.db.insert(teaserAttempts).values({
        userId,
        teaserId,
        hintsUsed: 1,
        attempts: 0
      });
    }
  }

  async getTeaserCalendar(userId: string): Promise<any[]> {
    const results = await this.db.select({
      date: teaserAttempts.attemptedAt,
      solved: teaserAttempts.solved
    }).from(teaserAttempts).where(eq(teaserAttempts.userId, userId)).orderBy(desc(teaserAttempts.attemptedAt));
    return results;
  }

  async getBrainTeaserStats(userId: string): Promise<any> {
    const attempts = await this.db.select().from(teaserAttempts).where(eq(teaserAttempts.userId, userId));
    return {
      totalAttempts: attempts.length,
      solved: attempts.filter((a: any) => a.solved).length,
    };
  }
}

// Use DatabaseStorage if DATABASE_URL is set, otherwise use MemStorage
let storageInstance: IStorage;

if (process.env.DATABASE_URL) {
  storageInstance = new DatabaseStorage(db);
} else {
  storageInstance = new MemStorage();
}

export const storage = storageInstance;

