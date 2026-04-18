import { Link, useLocation } from "wouter";
import { UserDropdown } from "./user-dropdown";
import { LayoutDashboard, Users, Code, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [location] = useLocation();

    const navItems = [
        { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex-shrink-0 hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <Code className="h-6 w-6 text-cyan-500 mr-2" />
                    <span className="font-bold text-lg tracking-tight">Admin<span className="text-cyan-500">Panel</span></span>
                </div>

                <nav className="p-4 space-y-2 flex-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = location === item.path;
                        return (
                            <Link key={item.path} href={item.path}>
                                <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${active
                                        ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"
                                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                                    }`}>
                                    <Icon className="h-5 w-5" />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Link href="/">
                        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-slate-100 hover:bg-slate-800">
                            <LogOut className="mr-2 h-4 w-4" />
                            Back to App
                        </Button>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
                <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/30">
                    <h1 className="text-xl font-semibold text-slate-100">
                        {navItems.find(i => i.path === location)?.label || "Admin Dashboard"}
                    </h1>
                    <div className="flex items-center gap-4">
                        <UserDropdown />
                    </div>
                </header>
                <div className="flex-1 p-8 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
