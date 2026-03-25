import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  googleId: text("google_id").unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // user, admin
  streak: integer("streak").default(0),
  lastDailySolve: timestamp("last_daily_solve"),
});

export const contests = pgTable("contests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming, live, completed
  createdBy: varchar("created_by").notNull(),
  participants: integer("participants").default(0),
});

export const problems = pgTable("problems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contestId: varchar("contest_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  points: integer("points").notNull().default(100),
  testCases: jsonb("test_cases").notNull(), // Array of {input, output}
  timeLimit: integer("time_limit").default(2000), // milliseconds
  memoryLimit: integer("memory_limit").default(256), // MB
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  problemId: varchar("problem_id").notNull(),
  contestId: varchar("contest_id").notNull(),
  code: text("code").notNull(),
  language: text("language").notNull(),
  status: text("status").notNull(), // pending, accepted, wrong_answer, time_limit, compilation_error
  score: integer("score").default(0),
  submittedAt: timestamp("submitted_at").default(sql`now()`),
});

export const leaderboard = pgTable("leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contestId: varchar("contest_id").notNull(),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  totalScore: integer("total_score").default(0),
  problemsSolved: integer("problems_solved").default(0),
  lastSubmission: timestamp("last_submission"),
  rank: integer("rank").default(0),
});


export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  level: text("level").notNull(), // beginner, intermediate, advanced
  duration: text("duration").notNull(), // e.g., "4 weeks", "2 months"
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  topics: jsonb("topics").notNull(), // Array of topic strings
  prerequisites: text("prerequisites"), // Prerequisites description
  instructor: text("instructor").notNull(),
  rating: integer("rating").default(5), // 1-5 stars
  students: integer("students").default(0), // Number of enrolled students
  price: text("price").notNull(), // e.g., "Free", "$99", "Premium"
  thumbnail: text("thumbnail"), // Course thumbnail URL
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  order: integer("order").notNull(),
  duration: integer("duration").default(0), // Duration in minutes
  videoUrl: text("video_url"), // Optional video content
  quizData: jsonb("quiz_data"), // Array of {question, options[], correctAnswerIndex}
  type: text("type").default("video"), // video, quiz, theory
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  courseId: varchar("course_id").notNull(),
  enrolledAt: timestamp("enrolled_at").default(sql`now()`),
  completedAt: timestamp("completed_at"),
  progress: integer("progress").default(0), // Progress percentage (0-100)
  timeSpent: integer("time_spent").default(0), // Time spent in minutes
  status: text("status").default("active"), // active, completed, paused
  lastAccessedAt: timestamp("last_accessed_at").default(sql`now()`),
});

export const lessonProgress = pgTable("lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id").notNull(),
  lessonId: varchar("lesson_id").notNull(),
  userId: varchar("user_id").notNull(),
  completed: boolean("completed").default(false),
  timeSpent: integer("time_spent").default(0), // Time spent in minutes
  completedAt: timestamp("completed_at"),
  lastAccessedAt: timestamp("last_accessed_at").default(sql`now()`),
});

export const userActivity = pgTable("user_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").notNull().default(sql`CURRENT_DATE`),
  minutesActive: integer("minutes_active").default(0),
  questionsSolved: integer("questions_solved").default(0),
});

// Insert schemas
export const insertUserSchema = (createInsertSchema as any)(users).omit({ id: true });
export const insertContestSchema = (createInsertSchema as any)(contests).omit({ id: true, participants: true });
export const insertProblemSchema = (createInsertSchema as any)(problems).omit({ id: true });
export const insertSubmissionSchema = (createInsertSchema as any)(submissions).omit({ id: true, submittedAt: true, score: true });
export const insertLeaderboardSchema = (createInsertSchema as any)(leaderboard).omit({ id: true, rank: true });
export const insertCourseSchema = (createInsertSchema as any)(courses).omit({ id: true, createdAt: true, students: true });
export const insertLessonSchema = (createInsertSchema as any)(lessons).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = (createInsertSchema as any)(enrollments).omit({ id: true, enrolledAt: true, lastAccessedAt: true });
export const insertLessonProgressSchema = (createInsertSchema as any)(lessonProgress).omit({ id: true, lastAccessedAt: true });
export const insertUserActivitySchema = (createInsertSchema as any)(userActivity).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Contest = typeof contests.$inferSelect;
export type InsertContest = z.infer<typeof insertContestSchema>;

export type Problem = typeof problems.$inferSelect;
export type InsertProblem = z.infer<typeof insertProblemSchema>;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

export type LeaderboardEntry = typeof leaderboard.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardSchema>;


export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;

export type UserActivity = typeof userActivity.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;

// Challenges - Typing Challenge Tables
export const typingChallenges = pgTable("typing_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  code: text("code").notNull(),
  language: text("language").notNull(), // javascript, python, java, cpp
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  lineCount: integer("line_count").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const typingScores = pgTable("typing_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  challengeId: varchar("challenge_id").notNull(),
  wpm: integer("wpm").notNull(),
  accuracy: integer("accuracy").notNull(), // 0-100
  timeSpent: integer("time_spent").notNull(), // seconds
  completedAt: timestamp("completed_at").default(sql`now()`),
});

// Challenges - Algorithm Quiz Tables
export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  codeSnippet: text("code_snippet"),
  options: jsonb("options").notNull(), // Array of 4 options
  correctAnswer: integer("correct_answer").notNull(), // 0-3 index
  topic: text("topic").notNull(), // arrays, graphs, dp, trees, etc.
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  explanation: text("explanation").notNull(),
  timeLimit: integer("time_limit").default(60), // seconds
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  questionIds: jsonb("question_ids").notNull(), // Array of question IDs
  userAnswers: jsonb("user_answers").notNull(), // Array of user's answers
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  topic: text("topic").notNull(),
  timeSpent: integer("time_spent").notNull(), // seconds
  completedAt: timestamp("completed_at").default(sql`now()`),
});

// Challenges - Brain Teaser Tables
export const brainTeasers = pgTable("brain_teasers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull().unique(), // One per day
  title: text("title").notNull(),
  puzzle: text("puzzle").notNull(),
  hint1: text("hint1"),
  hint2: text("hint2"),
  hint3: text("hint3"),
  solution: text("solution").notNull(),
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  explanation: text("explanation").notNull(),
  category: text("category").notNull(), // logic, math, patterns, algorithms
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const teaserAttempts = pgTable("teaser_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  teaserId: varchar("teaser_id").notNull(),
  solved: boolean("solved").default(false),
  hintsUsed: integer("hints_used").default(0),
  attempts: integer("attempts").default(0),
  userAnswer: text("user_answer"),
  solvedAt: timestamp("solved_at"),
  attemptedAt: timestamp("attempted_at").default(sql`now()`),
});


// Insert schemas for challenges
export const insertTypingChallengeSchema = (createInsertSchema as any)(typingChallenges).omit({ id: true, createdAt: true });
export const insertTypingScoreSchema = (createInsertSchema as any)(typingScores).omit({ id: true, completedAt: true });
export const insertQuizQuestionSchema = (createInsertSchema as any)(quizQuestions).omit({ id: true, createdAt: true });
export const insertQuizAttemptSchema = (createInsertSchema as any)(quizAttempts).omit({ id: true, completedAt: true });
export const insertBrainTeaserSchema = (createInsertSchema as any)(brainTeasers).omit({ id: true, createdAt: true });
export const insertTeaserAttemptSchema = (createInsertSchema as any)(teaserAttempts).omit({ id: true, attemptedAt: true });

// Types for challenges
export type TypingChallenge = typeof typingChallenges.$inferSelect;
export type InsertTypingChallenge = z.infer<typeof insertTypingChallengeSchema>;

export type TypingScore = typeof typingScores.$inferSelect;
export type InsertTypingScore = z.infer<typeof insertTypingScoreSchema>;

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

export type BrainTeaser = typeof brainTeasers.$inferSelect;
export type InsertBrainTeaser = z.infer<typeof insertBrainTeaserSchema>;

export type TeaserAttempt = typeof teaserAttempts.$inferSelect;
export type InsertTeaserAttempt = z.infer<typeof insertTeaserAttemptSchema>;

