import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, MotionCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  User,
  Edit3,
  Plus,
  Check,
  X,
  Shield,
  ShieldAlert,
  Terminal,
  Unplug,
  Settings2,
  Trash2
} from "lucide-react";
import {
  SiCodeforces,
  SiLeetcode,
  SiCodechef
} from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface PlatformProfile {
  platform: string;
  username: string;
  verified: boolean;
}

interface PlatformInfo {
  name: string;
  icon: React.ComponentType<any> | (() => JSX.Element);
  color: string;
  glow: string;
  profileUrl: (username: string) => string;
  description: string;
}

const platformInfo: Record<string, PlatformInfo> = {
  'codeforces': {
    name: 'Codeforces',
    icon: SiCodeforces,
    color: 'text-blue-400',
    glow: 'bg-blue-500/20',
    profileUrl: (username: string) => `https://codeforces.com/profile/${username}`,
    description: 'Algorithmic Combat Intelligence'
  },
  'leetcode': {
    name: 'LeetCode',
    icon: SiLeetcode,
    color: 'text-amber-400',
    glow: 'bg-amber-500/20',
    profileUrl: (username: string) => `https://leetcode.com/u/${username}/`,
    description: 'Technical Protocol Mastery'
  },
  'codechef': {
    name: 'CodeChef',
    icon: SiCodechef,
    color: 'text-rose-400',
    glow: 'bg-rose-500/20',
    profileUrl: (username: string) => `https://www.codechef.com/users/${username}`,
    description: 'Gourmet Logic Simulations'
  },
  'atcoder': {
    name: 'AtCoder',
    icon: () => <div className="w-5 h-5 bg-white/10 rounded font-black text-[10px] flex items-center justify-center text-white border border-white/10">AC</div>,
    color: 'text-indigo-400',
    glow: 'bg-indigo-500/20',
    profileUrl: (username: string) => `https://atcoder.jp/users/${username}`,
    description: 'Eastern Sector Simulations'
  },
  'hackerrank': {
    name: 'HackerRank',
    icon: () => <div className="w-5 h-5 bg-white/10 rounded font-black text-[10px] flex items-center justify-center text-white border border-white/10">HR</div>,
    color: 'text-emerald-400',
    glow: 'bg-emerald-500/20',
    profileUrl: (username: string) => `https://www.hackerrank.com/profile/${username}`,
    description: 'Skill Matrix Calibration'
  },
  'topcoder': {
    name: 'TopCoder',
    icon: () => <div className="w-5 h-5 bg-white/10 rounded font-black text-[10px] flex items-center justify-center text-white border border-white/10">TC</div>,
    color: 'text-cyan-400',
    glow: 'bg-cyan-500/20',
    profileUrl: (username: string) => `https://www.topcoder.com/members/${username}`,
    description: 'Legacy Force Operations'
  }
};

export default function PlatformProfiles() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<PlatformProfile[]>([
    { platform: 'codeforces', username: 'tourist', verified: true },
    { platform: 'leetcode', username: 'code_commander', verified: false },
  ]);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPlatform, setNewPlatform] = useState('codeforces');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const handleSaveProfile = (platform: string) => {
    if (!newUsername.trim()) {
      toast({
        title: "Protocol Violation",
        description: "Identifier cannot be null",
        variant: "destructive",
      });
      return;
    }

    setProfiles(prev =>
      prev.map(profile =>
        profile.platform === platform
          ? { ...profile, username: newUsername, verified: false }
          : profile
      )
    );
    setEditingProfile(null);
    setNewUsername('');

    toast({
      title: "Uplink Calibrated",
      description: `${platformInfo[platform].name} connection updated`,
    });
  };

  const handleAddProfile = () => {
    if (!newUsername.trim()) {
      toast({
        title: "Protocol Violation",
        description: "Identifier cannot be null",
        variant: "destructive",
      });
      return;
    }

    const existingProfile = profiles.find(p => p.platform === newPlatform);
    if (existingProfile) {
      toast({
        title: "Conflict Detected",
        description: "Platform uplink already established",
        variant: "destructive",
      });
      return;
    }

    setProfiles(prev => [...prev, {
      platform: newPlatform,
      username: newUsername,
      verified: false
    }]);
    setIsAddingNew(false);
    setNewUsername('');

    toast({
      title: "Uplink Established",
      description: `${platformInfo[newPlatform].name} integration complete`,
    });
  };

  const handleRemoveProfile = (platform: string) => {
    setProfiles(prev => prev.filter(p => p.platform !== platform));
    toast({
      title: "Uplink Terminated",
      description: `${platformInfo[platform].name} connection severed`,
    });
  };

  const availablePlatforms = Object.keys(platformInfo).filter(
    platform => !profiles.some(p => p.platform === platform)
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            Command <span className="text-gradient-primary">Dossier</span>
          </h2>
          <p className="text-slate-400 font-medium max-w-lg">
            Synchronize external protocol identifiers to aggregate performance metrics multi-platform.
          </p>
        </div>

        {availablePlatforms.length > 0 && (
          <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest px-6 h-11 rounded-xl shadow-lg shadow-blue-900/40 border-0">
                <Plus className="h-4 w-4 mr-2" />
                Establish Uplink
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">New Integration</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">
                  Initialize a secure connection to an external algorithmic platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Platform</Label>
                  <select
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none transition-all"
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                  >
                    {availablePlatforms.map(platform => (
                      <option key={platform} value={platform} className="bg-slate-900">
                        {platformInfo[platform].name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Codename / Identifier</Label>
                  <Input
                    placeholder="Enter platform username..."
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-slate-950 border-white/10 h-12 rounded-xl focus:ring-0 focus:border-blue-500/50 text-white"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleAddProfile} className="flex-1 bg-blue-600 hover:bg-blue-500 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl border-0">
                    Execute Connection
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewUsername('');
                    }}
                    className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl text-white"
                  >
                    Abort
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {profiles.map((profile) => {
            const info = platformInfo[profile.platform];
            const IconComponent = info.icon;
            const isEditing = editingProfile === profile.platform;

            return (
              <MotionCard
                key={profile.platform}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                variants={itemVariants}
                className="group relative border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl overflow-hidden hover:bg-slate-900/60 transition-all border-l-2"
                style={{ borderLeftColor: profile.verified ? 'rgb(16 185 129)' : 'rgb(100 116 139)' }}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 pointer-events-none rounded-full ${info.glow}`} />

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${info.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${profile.verified ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                      {profile.verified ? (
                        <div className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure</div>
                      ) : (
                        <div className="flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Pending</div>
                      )}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-white tracking-tight">{info.name}</CardTitle>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {info.description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Operational Identifier</Label>
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingProfile(profile.platform);
                            setNewUsername(profile.username);
                          }}
                          className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                        >
                          <Settings2 className="h-3 w-3" /> Recalibrate
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex gap-2">
                        <Input
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="Identifier..."
                          className="flex-1 bg-slate-950 border-white/10 h-10 rounded-xl text-sm focus:ring-0 focus:border-blue-500/50"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveProfile(profile.platform)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl aspect-square p-0 h-10 w-10"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingProfile(null);
                            setNewUsername('');
                          }}
                          className="text-slate-500 hover:text-white hover:bg-white/5 rounded-xl aspect-square p-0 h-10 w-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between group-hover:border-white/10 transition-colors">
                        <span className="text-white font-black tracking-tight text-sm">
                          {profile.username}
                        </span>
                        <Terminal className="h-4 w-4 text-slate-700" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[9px] tracking-widest h-10 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                      onClick={() => window.open(info.profileUrl(profile.username), '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-2 text-blue-400" />
                      Decrypt Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveProfile(profile.platform)}
                      className="text-slate-600 hover:text-rose-400 hover:bg-rose-400/5 rounded-xl aspect-square p-0 h-10 w-10 group/trash"
                    >
                      <Trash2 className="h-4 w-4 group-hover/trash:scale-110 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </MotionCard>
            );
          })}
        </AnimatePresence>
      </div>

      {profiles.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed border-white/10 bg-slate-900/20 rounded-3xl p-16 text-center">
            <Unplug className="h-16 w-16 text-slate-700 mx-auto mb-6 opacity-50" />
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Isolated System</h3>
            <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">
              No protocol uplinks detected. Establish a connection to aggregate your performance data.
            </p>
            <Button
              onClick={() => setIsAddingNew(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[11px] tracking-widest px-8 h-12 rounded-xl shadow-xl shadow-blue-900/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Initialize First Uplink
            </Button>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}