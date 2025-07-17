import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus } from "lucide-react";

interface AddDecisionMakerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess: () => void;
}

export function AddDecisionMakerDialog({ open, onOpenChange, companyId, onSuccess }: AddDecisionMakerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    designation: "",
    email: "",
    phone: "",
    linkedin_profile: "",
    contact_type: "kdm",
    confidence_score: 85
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.designation) {
      toast({
        title: "Missing Information",
        description: "Please fill in the required fields (Name and Designation)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('decision_makers')
        .insert({
          ...formData,
          company_id: companyId,
        });

      if (error) throw error;

      toast({
        title: "Decision Maker Added",
        description: `${formData.first_name} ${formData.last_name} has been added successfully`,
      });

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        designation: "",
        email: "",
        phone: "",
        linkedin_profile: "",
        contact_type: "kdm",
        confidence_score: 85
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error adding decision maker:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add decision maker",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Decision Maker
          </DialogTitle>
          <DialogDescription>
            Add a new decision maker for this company
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="designation">Designation *</Label>
            <Input
              id="designation"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="e.g., CEO, CTO, VP Marketing"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn Profile</Label>
            <Input
              id="linkedin"
              value={formData.linkedin_profile}
              onChange={(e) => setFormData({ ...formData, linkedin_profile: e.target.value })}
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_type">Contact Type</Label>
              <Select
                value={formData.contact_type}
                onValueChange={(value) => setFormData({ ...formData, contact_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kdm">Key Decision Maker</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                  <SelectItem value="champion">Champion</SelectItem>
                  <SelectItem value="technical">Technical Contact</SelectItem>
                  <SelectItem value="procurement">Procurement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confidence">Confidence Score</Label>
              <Select
                value={formData.confidence_score.toString()}
                onValueChange={(value) => setFormData({ ...formData, confidence_score: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="95">95% - Verified</SelectItem>
                  <SelectItem value="85">85% - High Confidence</SelectItem>
                  <SelectItem value="75">75% - Good Confidence</SelectItem>
                  <SelectItem value="60">60% - Medium Confidence</SelectItem>
                  <SelectItem value="40">40% - Low Confidence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Decision Maker
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}