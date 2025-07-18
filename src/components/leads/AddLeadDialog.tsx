import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabaseLeads } from "@/hooks/use-supabase-leads";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { checkCompanyDuplicate } from "@/lib/deduplication-utils";

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddLeadDialog({ open, onOpenChange, onSuccess }: AddLeadDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    show: boolean;
    duplicates: any[];
    forceAdd: boolean;
  }>({ show: false, duplicates: [], forceAdd: false });
  const [formData, setFormData] = useState({
    company_name: '',
    website: '',
    industry: '',
    employee_size: '',
    founded: '',
    description: '',
    public_email: '',
    public_phone: '',
    linkedin_profile: '',
  });

  const checkForDuplicates = async () => {
    if (!formData.company_name.trim() && !formData.website.trim()) return;
    
    setLoading(true);
    try {
      const { isDuplicate, duplicates } = await checkCompanyDuplicate(
        formData.company_name,
        formData.website
      );
      
      if (isDuplicate && !duplicateWarning.forceAdd) {
        setDuplicateWarning({ show: true, duplicates, forceAdd: false });
        setLoading(false);
        return;
      }
      
      // Proceed with adding the lead
      await addLead();
    } catch (error) {
      console.error('Error checking duplicates:', error);
      await addLead(); // Continue if duplicate check fails
    }
  };

  const addLead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('companies')
        .insert({
          ...formData,
          user_id: user.id,
          source: 'manual',
          status: 'pending_review',
          ai_score: 0,
          enrichment_data: {},
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: duplicateWarning.forceAdd 
          ? "Lead added successfully (duplicate override)" 
          : "Lead added successfully",
      });

      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add lead",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await checkForDuplicates();
  };

  const handleForceAdd = async () => {
    setDuplicateWarning(prev => ({ ...prev, forceAdd: true }));
    setLoading(true);
    await addLead();
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      website: '',
      industry: '',
      employee_size: '',
      founded: '',
      description: '',
      public_email: '',
      public_phone: '',
      linkedin_profile: '',
    });
    setDuplicateWarning({ show: false, duplicates: [], forceAdd: false });
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Lead
          </DialogTitle>
          <DialogDescription>
            Manually add a new company lead to your pipeline
          </DialogDescription>
        </DialogHeader>

        {duplicateWarning.show && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="font-medium mb-2">Potential duplicate found:</div>
              {duplicateWarning.duplicates.map((dup, index) => (
                <div key={index} className="text-sm mb-1">
                  • {dup.company_name} ({dup.reason})
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDuplicateWarning({ show: false, duplicates: [], forceAdd: false })}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleForceAdd}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Anyway
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => updateFormData('company_name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => updateFormData('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => updateFormData('industry', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_size">Employee Size</Label>
              <Select value={formData.employee_size} onValueChange={(value) => updateFormData('employee_size', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10</SelectItem>
                  <SelectItem value="11-50">11-50</SelectItem>
                  <SelectItem value="51-200">51-200</SelectItem>
                  <SelectItem value="201-500">201-500</SelectItem>
                  <SelectItem value="501-1000">501-1000</SelectItem>
                  <SelectItem value="1000+">1000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="founded">Founded</Label>
              <Input
                id="founded"
                value={formData.founded}
                onChange={(e) => updateFormData('founded', e.target.value)}
                placeholder="e.g. 2020"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="public_email">Public Email</Label>
              <Input
                id="public_email"
                type="email"
                value={formData.public_email}
                onChange={(e) => updateFormData('public_email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="public_phone">Public Phone</Label>
              <Input
                id="public_phone"
                value={formData.public_phone}
                onChange={(e) => updateFormData('public_phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_profile">LinkedIn Profile</Label>
              <Input
                id="linkedin_profile"
                value={formData.linkedin_profile}
                onChange={(e) => updateFormData('linkedin_profile', e.target.value)}
                placeholder="https://linkedin.com/company/example"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              rows={3}
              placeholder="Brief description of the company..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || duplicateWarning.show}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {duplicateWarning.show ? 'Check Above' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}