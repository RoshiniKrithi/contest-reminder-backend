import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertContestSchema,
  insertProblemSchema,
  insertSubmissionSchema,
  insertCourseSchema,
  insertLessonSchema,
  insertEnrollmentSchema,
  insertLessonProgressSchema
} from "./shared/schema";
import { ContestService } from "./contest-apis";
import { setupAuth } from "./auth";
import type { Request, Response, NextFunction } from "express";

function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Access denied. Admin privileges required." });
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // User routes
  app.get("/api/contests", async (req, res) => {
    try {
      const contests = await storage.getAllContests();
      res.json(contests);
    } catch (error) {
      console.error("Error fetching contests:", error);
      res.status(500).json({ error: "Failed to fetch contests" });
    }
  });

  app.get("/api/contests/:id", async (req, res) => {
    try {
      const contest = await storage.getContest(req.params.id);
      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }
      res.json(contest);
    } catch (error) {
      console.error("Error fetching contest:", error);
      res.status(500).json({ error: "Failed to fetch contest" });
    }
  });

  app.post("/api/contests", async (req, res) => {
    try {
      const validatedData = insertContestSchema.parse(req.body);
      const contest = await storage.createContest(validatedData);
      res.status(201).json(contest);
    } catch (error) {
      console.error("Error creating contest:", error);
      res.status(400).json({ error: "Invalid contest data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/contests/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const contest = await storage.updateContestStatus(req.params.id, status);
      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }
      res.json(contest);
    } catch (error) {
      console.error("Error updating contest status:", error);
      res.status(500).json({ error: "Failed to update contest status" });
    }
  });

  // Problem routes
  app.get("/api/contests/:contestId/problems", async (req, res) => {
    try {
      const problems = await storage.getProblemsByContest(req.params.contestId);
      res.json(problems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch problems" });
    }
  });

  app.get("/api/problems/:id", async (req, res) => {
    try {
      const problem = await storage.getProblem(req.params.id);
      if (!problem) {
        return res.status(404).json({ error: "Problem not found" });
      }
      res.json(problem);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch problem" });
    }
  });

  app.post("/api/problems", async (req, res) => {
    try {
      const validatedData = insertProblemSchema.parse(req.body);
      const problem = await storage.createProblem(validatedData);
      res.status(201).json(problem);
    } catch (error) {
      res.status(400).json({ error: "Invalid problem data" });
    }
  });

  // Submission routes
  app.post("/api/submissions", async (req, res) => {
    try {
      const validatedData = insertSubmissionSchema.parse(req.body);
      const submission = await storage.createSubmission(validatedData);

      // Simple evaluation logic - in real implementation, this would run code
      const problem = await storage.getProblem(validatedData.problemId);
      if (problem) {
        // Evaluate submission
        const status = Math.random() > 0.3 ? "accepted" : "wrong_answer";
        const score = status === "accepted" ? problem.points : 0;
        await storage.updateSubmissionStatus(submission.id, status, score);

        if (status === "accepted") {
          await storage.trackUserActivity(validatedData.userId, 15, 1);

          // Check for daily challenge streak
          // Simple deterministic check: if problem title contains "Data" and it's today (mock logic)
          // In real app, we check against the daily problem ID
          const dailyChallenge = await getDailyProblem();

          if (dailyChallenge && dailyChallenge.id === problem.id) {
            const user = await storage.getUser(validatedData.userId);
            if (user) {
              const lastSolve = user.lastDailySolve ? new Date(user.lastDailySolve) : null;
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
              const lastSolveDate = lastSolve ? new Date(lastSolve.getFullYear(), lastSolve.getMonth(), lastSolve.getDate()).getTime() : 0;

              // If not solved today
              if (lastSolveDate < today) {
                const yesterday = today - 86400000;
                let newStreak = 1;

                // If solved yesterday, increment. Else reset to 1.
                if (lastSolveDate === yesterday) {
                  newStreak = (user.streak || 0) + 1;
                }

                await storage.updateUserStreak(user.id, newStreak);
              }
            }
          }
        } else {
          await storage.trackUserActivity(validatedData.userId, 15, 0);
        }
      }

      res.status(201).json(submission);
    } catch (error) {
      res.status(400).json({ error: "Invalid submission data" });
    }
  });

  // Daily Challenge Endpoint
  async function getDailyProblem() {
    // Deterministic selection based on date
    const allProblems = [];
    const contests = await storage.getAllContests();
    for (const contest of contests) {
      const contestProblems = await storage.getProblemsByContest(contest.id);
      allProblems.push(...contestProblems);
    }

    if (allProblems.length === 0) return null;

    const today = new Date();
    const hash = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = hash % allProblems.length;
    return allProblems[index];
  }

  app.get("/api/daily-challenge", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const problem = await getDailyProblem();
      if (!problem) {
        return res.status(404).json({ error: "No daily challenge available" });
      }

      const user = await storage.getUser(req.user.id);
      const lastSolve = user?.lastDailySolve ? new Date(user.lastDailySolve) : null;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const lastSolveDate = lastSolve ? new Date(lastSolve.getFullYear(), lastSolve.getMonth(), lastSolve.getDate()).getTime() : 0;

      const solvedToday = lastSolveDate === today;

      res.json({
        problemId: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        streak: user?.streak || 0,
        solvedToday
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily challenge" });
    }
  });

  app.get("/api/submissions/:userId", async (req, res) => {
    try {
      const { contestId } = req.query;
      const submissions = await storage.getSubmissionsByUser(
        req.params.userId,
        contestId as string
      );
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });



  // External contests endpoint
  app.get("/api/external-contests", async (req, res) => {
    try {
      const { platform } = req.query;
      let contests;

      if (platform && typeof platform === 'string') {
        contests = await ContestService.getContestsByPlatform(platform);
      } else {
        contests = await ContestService.fetchAllContests();
      }

      // Always add comprehensive demo data to ensure all requested platforms are represented
      const now = new Date();

      // Add comprehensive demo data for all requested platforms
      const mockContests = [
        // Codeforces contests
        {
          id: "cf-round-912",
          name: "Codeforces Round #912 (Div. 2)",
          platform: "Codeforces",
          start_time: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          duration: 120,
          url: "https://codeforces.com/contest/1912",
          status: "upcoming" as const
        },
        {
          id: "cf-educational-168",
          name: "Educational Codeforces Round 168 (Rated for Div. 2)",
          platform: "Codeforces",
          start_time: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
          duration: 135,
          url: "https://codeforces.com/contest/1988",
          status: "live" as const
        },

        // LeetCode contests
        {
          id: "lc-weekly-378",
          name: "Weekly Contest 378",
          platform: "LeetCode",
          start_time: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
          duration: 90,
          url: "https://leetcode.com/contest/weekly-contest-378",
          status: "live" as const
        },
        {
          id: "lc-biweekly-119",
          name: "Biweekly Contest 119",
          platform: "LeetCode",
          start_time: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 7.5 * 60 * 60 * 1000).toISOString(),
          duration: 90,
          url: "https://leetcode.com/contest/biweekly-contest-119",
          status: "upcoming" as const
        },

        // AtCoder contests
        {
          id: "atc-abc-334",
          name: "AtCoder Beginner Contest 334",
          platform: "AtCoder",
          start_time: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 25 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
          duration: 100,
          url: "https://atcoder.jp/contests/abc334",
          status: "upcoming" as const
        },

        // CodeChef contests
        {
          id: "cc-cook-off-dec",
          name: "CodeChef Cook-Off December 2024",
          platform: "CodeChef",
          start_time: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000).toISOString(),
          duration: 150,
          url: "https://www.codechef.com/COOK151A",
          status: "upcoming" as const
        },
        {
          id: "cc-starters-113",
          name: "Starters 113 (Div. 1, 2, 3 & 4)",
          platform: "CodeChef",
          start_time: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 100 * 60 * 1000).toISOString(),
          duration: 120,
          url: "https://www.codechef.com/START113A",
          status: "live" as const
        },

        // HackerRank contests
        {
          id: "hr-world-championship",
          name: "HackerRank World Championship Final",
          platform: "HackerRank",
          start_time: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
          duration: 195,
          url: "https://www.hackerrank.com/contests/world-championship-final",
          status: "live" as const
        },
        {
          id: "hr-algorithms-contest",
          name: "HackerRank Algorithms Contest",
          platform: "HackerRank",
          start_time: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 16 * 60 * 60 * 1000).toISOString(),
          duration: 240,
          url: "https://www.hackerrank.com/contests/algorithms-contest-2024",
          status: "upcoming" as const
        },

        // GeeksforGeeks contests
        {
          id: "gfg-job-a-thon-34",
          name: "Job-A-Thon 34: Hiring Challenge",
          platform: "GeeksforGeeks",
          start_time: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 110 * 60 * 1000).toISOString(),
          duration: 120,
          url: "https://practice.geeksforgeeks.org/contest/job-a-thon-34",
          status: "live" as const
        },
        {
          id: "gfg-weekly-contest-178",
          name: "Weekly Contest 178",
          platform: "GeeksforGeeks",
          start_time: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString(),
          duration: 90,
          url: "https://practice.geeksforgeeks.org/contest/weekly-contest-178",
          status: "upcoming" as const
        },
        {
          id: "gfg-potd-contest",
          name: "Problem of the Day Contest - December",
          platform: "GeeksforGeeks",
          start_time: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
          duration: 180,
          url: "https://practice.geeksforgeeks.org/contest/potd-december-2024",
          status: "upcoming" as const
        },

        // Coding Ninjas contests
        {
          id: "cn-code-kaze-4",
          name: "Code Kaze 4.0",
          platform: "Coding Ninjas",
          start_time: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          duration: 145,
          url: "https://www.codingninjas.com/studio/contests/code-kaze-40",
          status: "live" as const
        },
        {
          id: "cn-weekly-contest-134",
          name: "Weekly Contest 134",
          platform: "Coding Ninjas",
          start_time: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 9.5 * 60 * 60 * 1000).toISOString(),
          duration: 90,
          url: "https://www.codingninjas.com/studio/contests/weekly-contest-134",
          status: "upcoming" as const
        },
        {
          id: "cn-hiring-blitz",
          name: "Hiring Blitz - Tech Companies",
          platform: "Coding Ninjas",
          start_time: new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 39 * 60 * 60 * 1000).toISOString(),
          duration: 180,
          url: "https://www.codingninjas.com/studio/contests/hiring-blitz-2024",
          status: "upcoming" as const
        }
      ];

      // Always add all mock contests to ensure comprehensive platform coverage
      const baseContests = Array.isArray(contests) ? contests : [];
      const combinedContests = [...baseContests, ...mockContests];

      if (platform && typeof platform === 'string') {
        contests = combinedContests.filter(contest =>
          contest.platform.toLowerCase().includes(platform.toLowerCase())
        );
      } else {
        contests = combinedContests;
      }

      res.json(contests);
    } catch (error) {
      console.error("Error fetching external contests:", error);
      res.status(500).json({ error: "Failed to fetch external contests" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    try {
      const { level } = req.query;
      let courses;

      if (level && typeof level === 'string') {
        courses = await storage.getCoursesByLevel(level);
      } else {
        courses = await storage.getAllCourses();
      }

      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error) {
      res.status(400).json({ error: "Invalid course data" });
    }
  });

  // Lesson routes
  app.get("/api/courses/:courseId/lessons", async (req, res) => {
    try {
      const lessons = await storage.getLessonsByCourse(req.params.courseId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.post("/api/courses/:courseId/lessons", async (req, res) => {
    try {
      const validatedData = insertLessonSchema.parse({
        ...req.body,
        courseId: req.params.courseId
      });
      const lesson = await storage.createLesson(validatedData);
      res.status(201).json(lesson);
    } catch (error) {
      res.status(400).json({ error: "Invalid lesson data" });
    }
  });

  // Enrollment routes
  app.post("/api/courses/:courseId/enroll", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const enrollment = await storage.enrollInCourse(userId, req.params.courseId);
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(400).json({ error: "Failed to enroll in course" });
    }
  });

  app.get("/api/users/:userId/enrollments", async (req, res) => {
    try {
      const enrollments = await storage.getUserEnrollments(req.params.userId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/users/:userId/courses/:courseId/enrollment", async (req, res) => {
    try {
      const enrollment = await storage.getEnrollment(req.params.userId, req.params.courseId);
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollment" });
    }
  });

  app.patch("/api/users/:userId/courses/:courseId/progress", async (req, res) => {
    try {
      const { progress, timeSpent } = req.body;
      const enrollment = await storage.updateEnrollmentProgress(
        req.params.userId,
        req.params.courseId,
        progress,
        timeSpent
      );
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  app.patch("/api/users/:userId/courses/:courseId/complete", async (req, res) => {
    try {
      const enrollment = await storage.completeEnrollment(req.params.userId, req.params.courseId);
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete course" });
    }
  });

  // Lesson Progress routes
  app.patch("/api/enrollments/:enrollmentId/lessons/:lessonId/progress", async (req, res) => {
    try {
      const { userId, completed, timeSpent } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const progress = await storage.updateLessonProgress(
        req.params.enrollmentId,
        req.params.lessonId,
        userId,
        completed,
        timeSpent
      );

      // Track time spent in daily activity
      if (timeSpent && timeSpent > 0) {
        await storage.trackUserActivity(userId, timeSpent, 0);
      }

      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lesson progress" });
    }
  });

  app.get("/api/users/:userId/lessons/:lessonId/progress", async (req, res) => {
    try {
      const progress = await storage.getLessonProgress(req.params.userId, req.params.lessonId);
      if (!progress) {
        return res.status(404).json({ error: "Lesson progress not found" });
      }
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson progress" });
    }
  });

  app.get("/api/enrollments/:enrollmentId/progress", async (req, res) => {
    try {
      const progress = await storage.getEnrollmentLessonProgress(req.params.enrollmentId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollment progress" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const contests = await storage.getAllContests();
      const activeContests = contests.filter(c => c.status === "live").length;
      const totalParticipants = contests.reduce((sum, c) => sum + (c.participants || 0), 0);

      res.json({
        activeContests,
        participants: totalParticipants,
        problemsSolved: 342, // Static value for now
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Progress endpoint - returns user's contest participation and performance data
  app.get("/api/progress", async (req, res) => {
    try {
      // Generate realistic progress data based on current date
      const currentDate = new Date();
      const progressData = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = date.toLocaleDateString('en-US', { month: 'short' });

        // Simulate progressive improvement over months
        const baseContests = Math.max(1, 3 + (5 - i));
        const baseProblems = Math.max(5, 15 + (5 - i) * 7);
        const baseRating = Math.max(1100, 1200 + (5 - i) * 30);

        progressData.push({
          month,
          contestsAttended: baseContests + Math.floor(Math.random() * 3),
          problemsSolved: baseProblems + Math.floor(Math.random() * 10),
          averageRating: baseRating + Math.floor(Math.random() * 50)
        });
      }

      res.json(progressData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress data" });
    }
  });

  // User Activity (Self)
  app.get("/api/user/activity", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const activity = await storage.getUserActivity(req.user.id);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // ==================== CHALLENGE ROUTES ====================

  // Challenge Overview Stats
  app.get("/api/challenges/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user.id;
      const stats = await storage.getChallengeStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch challenge stats" });
    }
  });

  // Typing Challenge Routes
  app.get("/api/challenges/typing/snippets", async (req, res) => {
    try {
      const { difficulty = "easy", language = "javascript", r } = req.query;
      const snippet = await storage.getRandomTypingChallenge(
        difficulty as string,
        language as string,
        r ? parseInt(r as string) : undefined
      );
      if (!snippet) {
        return res.status(404).json({ error: "No snippets found" });
      }
      res.json(snippet);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch typing challenge" });
    }
  });

  app.post("/api/challenges/typing/submit", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { challengeId, wpm, accuracy, timeSpent } = req.body;
      const score = await storage.submitTypingScore({
        userId: req.user.id,
        challengeId,
        wpm,
        accuracy,
        timeSpent,
      });

      // Track activity
      const minutesSpent = Math.max(1, Math.floor(timeSpent / 60));
      await storage.trackUserActivity(req.user.id, minutesSpent, 1);

      res.status(201).json(score);
    } catch (error) {
      res.status(400).json({ error: "Failed to submit typing score" });
    }
  });

  app.get("/api/challenges/typing/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getTypingLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Quiz Challenge Routes
  app.get("/api/challenges/quiz/questions", async (req, res) => {
    try {
      const { topic = "arrays", difficulty = "medium", count = "2" } = req.query;
      const questions = await storage.getQuizQuestions(
        topic as string,
        difficulty as string,
        parseInt(count as string)
      );
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quiz questions" });
    }
  });

  app.post("/api/challenges/quiz/submit", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { questionIds, userAnswers, score, totalQuestions, topic, timeSpent } = req.body;
      const attempt = await storage.submitQuizAttempt({
        userId: req.user.id,
        questionIds,
        userAnswers,
        score,
        totalQuestions,
        topic,
        timeSpent,
      });
      console.log(`✅ Quiz submitted by user ${req.user.username}: Score ${score}/${totalQuestions}`);

      // Track activity
      const minutesSpent = Math.max(1, Math.floor(timeSpent / 60));
      await storage.trackUserActivity(req.user.id, minutesSpent, score);

      res.status(201).json(attempt);
    } catch (error) {
      res.status(400).json({ error: "Failed to submit quiz attempt" });
    }
  });

  app.get("/api/challenges/quiz/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const stats = await storage.getQuizStats(req.user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quiz stats" });
    }
  });

  // Brain Teaser Routes
  app.get("/api/challenges/brain-teaser/daily", async (req, res) => {
    try {
      const teaser = await storage.getDailyBrainTeaser();
      if (!teaser) {
        return res.status(404).json({ error: "No brain teaser available" });
      }
      res.json(teaser);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch brain teaser" });
    }
  });

  app.get("/api/challenges/brain-teaser/attempt/:teaserId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const attempt = await storage.getTeaserAttempt(req.user.id, req.params.teaserId);
      res.json(attempt || { solved: false, hintsUsed: 0, attempts: 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attempt" });
    }
  });

  app.post("/api/challenges/brain-teaser/submit", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { teaserId, answer } = req.body;
      const result = await storage.submitTeaserAnswer(req.user.id, teaserId, answer);

      // Update streak if correct
      if (result.correct) {
        const user = await storage.getUser(req.user.id);
        if (user) {
          const lastSolve = user.lastDailySolve ? new Date(user.lastDailySolve) : null;
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const lastSolveDate = lastSolve ? new Date(lastSolve.getFullYear(), lastSolve.getMonth(), lastSolve.getDate()).getTime() : 0;

          if (lastSolveDate < today) {
            const yesterday = today - 86400000;
            let newStreak = 1;

            if (lastSolveDate === yesterday) {
              newStreak = (user.streak || 0) + 1;
            }

            await storage.updateUserStreak(user.id, newStreak);
            console.log(`🔥 Streak updated for user ${user.username}: ${newStreak} days`);
          }
        }
        // Track activity for correct answer
        await storage.trackUserActivity(req.user.id, 10, 1);
      } else {
        // Track activity even if incorrect (time spent)
        await storage.trackUserActivity(req.user.id, 5, 0);
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Failed to submit answer" });
    }
  });

  app.post("/api/challenges/brain-teaser/hint", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { teaserId } = req.body;
      await storage.recordHintUsed(req.user.id, teaserId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to record hint" });
    }
  });

  app.get("/api/challenges/brain-teaser/calendar", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const calendar = await storage.getTeaserCalendar(req.user.id);
      res.json(calendar);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendar" });
    }
  });

  // ==================== END CHALLENGE ROUTES ====================


  const httpServer = createServer(app);

  // Admin Routes
  app.get("/api/admin/users", ensureAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:userId/activity", ensureAdmin, async (req, res) => {
    try {
      const activity = await storage.getUserActivity(req.params.userId);
      res.json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user activity" });
    }
  });

  return httpServer;
}
