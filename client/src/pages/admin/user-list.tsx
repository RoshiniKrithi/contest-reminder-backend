import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { User } from "@shared/schema";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Search } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function AdminUserList() {
    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ["/api/admin/users"],
    });
    const [search, setSearch] = useState("");

    const filteredUsers = users?.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase())
    ) || [];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-100">User Management</h2>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search users..."
                            className="pl-10 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="bg-slate-900 border-slate-800 text-slate-100">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-100">All Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-slate-500 py-8 text-center">Loading...</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-800 hover:bg-slate-900">
                                        <TableHead className="text-slate-400">Username</TableHead>
                                        <TableHead className="text-slate-400">Role</TableHead>
                                        <TableHead className="text-slate-400">ID</TableHead>
                                        <TableHead className="text-slate-400 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                                            <TableCell className="font-medium text-slate-200">{user.username}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'admin'
                                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                        : 'bg-slate-700/50 text-slate-400 border border-slate-700'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-500 font-mono text-xs">{user.id}</TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/users/${user.id}`}>
                                                    <Button variant="ghost" size="sm" className="hover:bg-cyan-500/10 hover:text-cyan-400 text-slate-400">
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Details
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
