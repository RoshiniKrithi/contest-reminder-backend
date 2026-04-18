import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ProtectedAdminRoute } from "@/lib/protected-admin-route";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/navbar";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUserList from "@/pages/admin/user-list";
import AdminUserDetail from "@/pages/admin/user-detail";
import Dashboard from "@/pages/dashboard";
import Contests from "@/pages/contests";
import Courses from "@/pages/courses";
import ContestDetail from "@/pages/contest-detail";
import CourseDetail from "@/pages/course-detail";
import LessonDetail from "@/pages/lesson-detail";
import Problems from "@/pages/problems";
import ProblemDetail from "@/pages/problem-detail";
import Profile from "@/pages/profile";
import PlatformDetail from "@/pages/platform-detail";
import Leaderboard from "@/pages/leaderboard";
import Challenges from "@/pages/challenges";
import TypingChallenge from "@/pages/typing-challenge";
import AlgorithmQuiz from "@/pages/algorithm-quiz";
import BrainTeaser from "@/pages/brain-teaser";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import LoadingScreen from "@/components/layout/loading-screen";
import { useState, useEffect, useRef } from "react";

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Switch location={location} key={location}>
        <Route path="/auth" component={AuthPage} />

        {/* Admin Routes */}
        <ProtectedAdminRoute path="/admin/dashboard" component={AdminDashboard} />
        <ProtectedAdminRoute path="/admin/users" component={AdminUserList} />
        <ProtectedAdminRoute path="/admin/users/:id" component={AdminUserDetail} />

        {/* User Routes */}
        <ProtectedRoute path="/" component={Dashboard} />
        <ProtectedRoute path="/reminders" component={Contests} />
        <ProtectedRoute path="/contests" component={Contests} />
        <ProtectedRoute path="/courses" component={Courses} />
        <ProtectedRoute path="/contest/:id" component={ContestDetail} />
        <ProtectedRoute path="/course/:id" component={CourseDetail} />
        <ProtectedRoute path="/course/:id/lesson/:lessonId" component={LessonDetail} />
        <ProtectedRoute path="/problems" component={Problems} />
        <ProtectedRoute path="/problems/:id" component={ProblemDetail} />
        <ProtectedAdminRoute path="/profile" component={Profile} />
        <ProtectedRoute path="/leaderboard" component={Leaderboard} />
        <ProtectedRoute path="/platform/:platform" component={PlatformDetail} />

        {/* Challenge Routes */}
        <ProtectedRoute path="/challenges" component={Challenges} />
        <ProtectedRoute path="/challenges/typing" component={TypingChallenge} />
        <ProtectedRoute path="/challenges/quiz" component={AlgorithmQuiz} />
        <ProtectedRoute path="/challenges/brain-teaser" component={BrainTeaser} />
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function AppContent() {
  const [location] = useLocation();
  console.log("AppContent rendering at:", location);

  const isAdminRoute = location.startsWith("/admin");
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const prevUserRef = useRef(user);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Show loader ONLY when user transitions from null to non-null (login)
    // or if the user is already logged in and it's the first render (if that's desired)
    // The user said: "after i login when i gooes to the dash board page not befor that"

    if (user && !prevUserRef.current && !hasLoadedRef.current) {
      setIsLoading(true);
      hasLoadedRef.current = true;
    }
    prevUserRef.current = user;
  }, [user]);

  return (
    <TooltipProvider>
      {isLoading && <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />}
      <div style={{ backgroundColor: '#0f172a', color: 'white' }} className={`min-h-screen transition-all duration-300 ${isAdminRoute ? '' : 'bg-gradient-to-br from-gray-900 to-gray-800'}`}>
        {!isAdminRoute && <Navbar />}
        <main className="relative">
          <Router />
        </main>
      </div>

      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
