import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CreateContestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateContestModal({ isOpen, onClose }: CreateContestModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    duration: "3",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createContestMutation = useMutation({
    mutationFn: async (data: any) => {
      const startTime = new Date(data.startTime);
      const endTime = new Date(startTime.getTime() + parseInt(data.duration) * 60 * 60 * 1000);
      
      return apiRequest("POST", "/api/contests", {
        title: data.title,
        description: data.description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "upcoming",
        createdBy: "user", // In real app, this would come from authentication
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Contest created successfully",
        description: "Your contest has been scheduled.",
      });
      onClose();
      setFormData({
        title: "",
        description: "",
        startTime: "",
        duration: "3",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create contest. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createContestMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create New Contest</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Contest Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter contest title"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Date & Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="3"
                min="1"
                max="24"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Contest description and rules"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createContestMutation.isPending}>
              {createContestMutation.isPending ? "Creating..." : "Create Contest"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
