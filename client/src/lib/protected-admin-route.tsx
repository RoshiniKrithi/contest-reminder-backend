import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedAdminRoute({
    path,
    component: Component,
}: {
    path: string;
    component: () => React.JSX.Element;
}) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <Route path={path}>
                <div className="flex items-center justify-center min-h-screen bg-slate-950">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
            </Route>
        );
    }

    if (!user || user.role !== "admin") {
        return (
            <Route path={path}>
                <Redirect to="/" />
            </Route>
        );
    }

    return <Route path={path} component={Component} />;
}
