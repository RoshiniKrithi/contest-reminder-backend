import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Trophy, Zap, ArrowRight, ShieldCheck, Gamepad2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

const loginSchema = insertUserSchema.pick({ username: true, password: true });
type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Parallax Values for the Main Card
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["3deg", "-3deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-3deg", "3deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const onLogin = async (data: LoginFormData) => {
    await loginMutation.mutateAsync(data);
  };

  const onRegister = async (data: LoginFormData) => {
    await registerMutation.mutateAsync(data);
  };

  if (user) {
    return null;
  }

  return (
    <div
      className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col items-center justify-center p-4 lg:p-12 font-sans selection:bg-primary/30"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Immersive Background Layers (Preserving existing logic/theme) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.15] brightness-50 contrast-150 pointer-events-none mix-blend-overlay" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="w-full max-w-6xl z-10"
      >
        <div className="glass-card rounded-[2.5rem] overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)]">

          {/* Left Panel: Hero & Content */}
          <div className="lg:col-span-7 p-8 lg:p-20 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 relative bg-gradient-to-br from-white/[0.03] to-transparent">
            {/* Ambient Light Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 mb-20"
              >
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
                  <Code className="h-8 w-8 text-primary shadow-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">CodeArena</h2>
                  <div className="flex items-center gap-2 mt-1.5 pl-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
                    <span className="text-[10px] text-emerald-500/80 font-black tracking-[0.2em] uppercase">Operations Online</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-[1.05]">
                  <span className="text-gray-200 block">Sharpen Your Skills</span>
                  <span className="text-gradient-primary">In the Arena.</span>
                </h1>
                <p className="text-slate-500 text-lg lg:text-xl max-w-md leading-relaxed font-semibold">
                  The ultimate platform for competitive programmers to track progress, master new algorithms, and conquer challenges globally.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 lg:mt-24">
                {[
                  { icon: Trophy, label: "Live Contests", color: "text-amber-500", border: "border-amber-500/20" },
                  { icon: ShieldCheck, label: "Skill Analytics", color: "text-emerald-500", border: "border-emerald-500/20" },
                  { icon: Gamepad2, label: "Interactive LMS", color: "text-primary", border: "border-primary/20" }
                ].map((feat, i) => (
                  <motion.div
                    key={feat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + (i * 0.1), ease: "easeOut" }}
                    whileHover={{ scale: 1.05, translateY: -8, transition: { duration: 0.2 } }}
                    className="glass p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all cursor-default group"
                  >
                    <div className={`p-3 rounded-xl bg-gray-950/60 w-fit mb-4 border ${feat.border} group-hover:scale-110 transition-transform ${feat.color} shadow-lg shadow-black/40`}>
                      <feat.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.15em]">{feat.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-16 lg:mt-0 pt-10 border-t border-white/5 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity">
              <div className="flex gap-6">
                <div className="text-[11px] text-white font-black tracking-widest uppercase cursor-pointer hover:text-primary transition-colors">Github</div>
                <div className="text-[11px] text-white font-black tracking-widest uppercase cursor-pointer hover:text-primary transition-colors">Discord</div>
              </div>
              <span className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase">© 2024 TERMINAL PROTOCOL</span>
            </div>
          </div>

          {/* Right Panel: Auth Forms (Premium Glass Entry) */}
          <div className="lg:col-span-5 p-8 lg:p-20 flex flex-col justify-center bg-gray-950/50 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />

            <div className="relative z-10 w-full max-w-sm mx-auto">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/[0.03] rounded-2xl p-1.5 border border-white/10 mb-12 shadow-inner">
                  <TabsTrigger value="login" className="rounded-xl font-bold py-3 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-lg transition-all duration-300">Login</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-xl font-bold py-3 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-lg transition-all duration-300">Join</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                  >
                    <TabsContent value="login" className="mt-0 outline-none">
                      <div className="mb-10">
                        <h3 className="text-3xl font-black text-white tracking-tighter">Access Terminal</h3>
                        <p className="text-slate-600 mt-2.5 font-semibold leading-relaxed">System authentication required for dashboard uplink.</p>
                      </div>

                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                        <div className="space-y-2.5">
                          <Label className="text-slate-600 text-[10px] font-black uppercase tracking-[0.25em] ml-1.5">Identity Tag</Label>
                          <Input
                            {...loginForm.register("username")}
                            className="bg-white/[0.04] border-white/10 text-white h-14 rounded-2xl focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-gray-700 font-semibold px-5"
                            placeholder="username_01"
                          />
                          {loginForm.formState.errors.username && (
                            <p className="text-[10px] font-bold text-rose-500 ml-2">{String(loginForm.formState.errors.username.message)}</p>
                          )}
                        </div>

                        <div className="space-y-2.5">
                          <Label className="text-slate-600 text-[10px] font-black uppercase tracking-[0.25em] ml-1.5">Security Key</Label>
                          <Input
                            type="password"
                            {...loginForm.register("password")}
                            className="bg-white/[0.04] border-white/10 text-white h-14 rounded-2xl focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-gray-700 px-5"
                            placeholder="••••••••"
                          />
                          {loginForm.formState.errors.password && (
                            <p className="text-[10px] font-bold text-rose-500 ml-2">{String(loginForm.formState.errors.password.message)}</p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-white text-gray-950 hover:bg-gray-100 h-16 rounded-2xl font-black uppercase tracking-widest text-[13px] transition-all flex items-center justify-center gap-4 shadow-[0_15px_40px_rgba(255,255,255,0.1)] active:scale-[0.97] mt-8 group"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Syncing..." : (
                            <>
                              Initialize Session
                              <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                            </>
                          )}
                        </Button>

                        {/* Divider */}
                        <div className="relative my-8">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-gray-950/50 px-4 text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px]">Or Continue With</span>
                          </div>
                        </div>

                        {/* Google Sign-In Button */}
                        <a
                          href="/api/auth/google"
                          className="w-full bg-white/[0.06] border border-white/10 hover:bg-white/10 hover:border-white/20 h-14 rounded-2xl font-bold text-[13px] transition-all flex items-center justify-center gap-3 active:scale-[0.97] group text-white"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <span className="tracking-wider">Sign in with Google</span>
                        </a>
                      </form>
                    </TabsContent>

                    <TabsContent value="register" className="mt-0 outline-none">
                      <div className="mb-10">
                        <h3 className="text-3xl font-black text-white tracking-tighter">New Operative</h3>
                        <p className="text-slate-600 mt-2.5 font-semibold leading-relaxed">Establish your secure identity in the arena.</p>
                      </div>

                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-6">
                        <div className="space-y-2.5">
                          <Label className="text-slate-600 text-[10px] font-black uppercase tracking-[0.25em] ml-1.5">Designate Tag</Label>
                          <Input
                            {...registerForm.register("username")}
                            className="bg-white/[0.04] border-white/10 text-white h-14 rounded-2xl focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-gray-700 font-semibold px-5"
                            placeholder="operative_name"
                          />
                          {registerForm.formState.errors.username && (
                            <p className="text-[10px] font-bold text-rose-500 ml-2">{String(registerForm.formState.errors.username.message)}</p>
                          )}
                        </div>

                        <div className="space-y-2.5">
                          <Label className="text-slate-600 text-[10px] font-black uppercase tracking-[0.25em] ml-1.5">Secret Protocol</Label>
                          <Input
                            type="password"
                            {...registerForm.register("password")}
                            className="bg-white/[0.04] border-white/10 text-white h-14 rounded-2xl focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-gray-700 px-5"
                            placeholder="Min 6 characters"
                          />
                          {registerForm.formState.errors.password && (
                            <p className="text-[10px] font-bold text-rose-500 ml-2">{String(registerForm.formState.errors.password.message)}</p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-primary text-white hover:bg-primary/90 h-16 rounded-2xl font-black uppercase tracking-widest text-[13px] transition-all flex items-center justify-center gap-4 shadow-[0_15px_40px_rgba(56,189,248,0.2)] active:scale-[0.97] mt-8 group border-none"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Deploying..." : (
                            <>
                              Confirm Registration
                              <Zap className="h-5 w-5 fill-white group-hover:scale-110 transition-transform" />
                            </>
                          )}
                        </Button>

                        {/* Divider */}
                        <div className="relative my-8">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-gray-950/50 px-4 text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px]">Or Sign Up With</span>
                          </div>
                        </div>

                        {/* Google Sign-In Button */}
                        <a
                          href="/api/auth/google"
                          className="w-full bg-white/[0.06] border border-white/10 hover:bg-white/10 hover:border-white/20 h-14 rounded-2xl font-bold text-[13px] transition-all flex items-center justify-center gap-3 active:scale-[0.97] group text-white"
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <span className="tracking-wider">Sign up with Google</span>
                        </a>
                      </form>
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </Tabs>
            </div>
          </div>
        </div>
      </motion.div>

      <footer className="mt-16 z-10 text-center animate-pulse">
        <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.5em]">
          Protocol Locked // Multi-Factor Uplink Enabled
        </p>
      </footer>
    </div>
  );
}
