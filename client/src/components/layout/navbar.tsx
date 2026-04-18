import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Code, Home, Globe, GraduationCap, Flame, Gamepad2 } from "lucide-react";
import { UserDropdown } from "./user-dropdown";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface DailyChallengeData {
  problemId: string;
  title: string;
  difficulty: string;
  streak: number;
  solvedToday: boolean;
}


export default function Navbar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const { data: daily } = useQuery<DailyChallengeData>({
    queryKey: ["/api/daily-challenge"],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    enabled: !!user,
  });


  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/reminders", label: "Live Contests", icon: Globe },
    { path: "/challenges", label: "Challenges", icon: Gamepad2 },
    { path: "/courses", label: "Courses", icon: GraduationCap },
  ];

  return (
    <>
      <nav className="bg-slate-950/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-12">
              <Link href="/" className="flex items-center space-x-3 group" data-testid="link-home">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl group-hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-white tracking-tighter uppercase group-hover:text-blue-400 transition-colors">
                    Code<span className="text-blue-500">Arena</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-black tracking-[0.3em] uppercase -mt-1">
                    Command Center
                  </span>
                </div>
              </Link>
              <div className="hidden lg:flex items-center space-x-1">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} href={item.path}>
                      <button
                        className={`group relative flex items-center space-x-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${active
                          ? "text-white"
                          : "text-slate-500 hover:text-white"
                          }`}
                        data-testid={`nav-${item.path.replace('/', '') || 'home'}`}
                      >
                        <IconComponent className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-blue-400' : ''}`} />
                        <span>{item.label}</span>
                        {/* Neon Underline Component */}
                        <div
                          className={`absolute bottom-1 left-6 right-6 h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] transition-all duration-500 transform origin-left ${active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0 group-hover:scale-x-50 group-hover:opacity-50"
                            }`}
                        />
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
            {location !== "/auth" && (
              <div className="flex items-center space-x-6">

                {/* Daily Streak Indicator */}
                <div
                  onClick={() => daily?.problemId && setLocation(`/problems/${daily.problemId}`)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-full border border-orange-500/20 bg-slate-800 hover:bg-slate-700 transition-all duration-300 shadow-lg shadow-black/20 min-w-[90px] justify-center group ${daily?.problemId ? 'cursor-pointer' : 'cursor-wait opacity-80'}`}
                  title={daily ? `Click to solve Daily Challenge` : "Loading Daily Challenge..."}
                >
                  <Flame className={`h-5 w-5 transition-colors duration-200 ${daily?.solvedToday
                    ? "text-orange-500 fill-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,1)]"
                    : "text-slate-400 group-hover:text-orange-400"
                    }`} />
                  <span className={`text-sm font-black tracking-wide ${daily?.solvedToday ? "text-orange-400" : "text-slate-200 group-hover:text-white"}`}>
                    {daily ? daily.streak : "-"}
                  </span>
                </div>

                <div className="h-8 w-[1px] bg-white/5 hidden sm:block" />
                <UserDropdown />
              </div>
            )}
          </div>
        </div>
      </nav>



    </>
  );
}
