import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const editKDMSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  designation: z.string().min(1, "Designation is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  linkedin_profile: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  contact_type: z.enum(["kdm", "influencer", "gatekeeper"]),
  confidence_score: z.number().min(0).max(100).optional(),
});

type EditKDMFormData = z.infer<typeof editKDMSchema>;

interface EditKDMDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kdm: any;
  onSuccess: () => void;
}

export function EditKDMDialog({ open, onOpenChange, kdm, onSuccess }: EditKDMDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditKDMFormData>({
    resolver: zodResolver(editKDMSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      designation: "",
      email: "",
      phone: "",
      linkedin_profile: "",
      contact_type: "kdm",
      confidence_score: 0,
    },
  });

  useEffect(() => {
    if (kdm && open) {
      form.reset({
        first_name: kdm.first_name || "",
        last_name: kdm.last_name || "",
        designation: kdm.designation || "",
        email: kdm.email || "",
        phone: kdm.phone || "",
        linkedin_profile: kdm.linkedin_profile || "",
        contact_type: kdm.contact_type || "kdm",
        confidence_score: kdm.confidence_score || 0,
      });
    }
  }, [kdm, open, form]);

  const onSubmit = async (data: EditKDMFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("decision_makers")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          designation: data.designation,
          email: data.email || null,
          phone: data.phone || null,
          linkedin_profile: data.linkedin_profile || null,
          contact_type: data.contact_type,
          confidence_score: data.confidence_score || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", kdm.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "KDM updated successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error updating KDM:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update KDM",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!kdm) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Key Decision Maker</DialogTitle>
          <DialogDescription>
            Update the details for {kdm.first_name} {kdm.last_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                {...form.register("first_name")}
                placeholder="John"
              />
              {form.formState.errors.first_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.first_name.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                {...form.register("last_name")}
                placeholder="Doe"
              />
              {form.formState.errors.last_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="designation">Designation *</Label>
            <Input
              id="designation"
              {...form.register("designation")}
              placeholder="CEO, CTO, Marketing Director..."
            />
            {form.formState.errors.designation && (
              <p className="text-sm text-destructive">
                {form.formState.errors.designation.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="john.doe@company.com"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_profile">LinkedIn Profile</Label>
            <Input
              id="linkedin_profile"
              {...form.register("linkedin_profile")}
              placeholder="https://linkedin.com/in/johndoe"
            />
            {form.formState.errors.linkedin_profile && (
              <p className="text-sm text-destructive">
                {form.formState.errors.linkedin_profile.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_type">Contact Type</Label>
              <Select
                value={form.watch("contact_type")}
                onValueChange={(value) => form.setValue("contact_type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kdm">Key Decision Maker</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                  <SelectItem value="gatekeeper">Gatekeeper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence_score">Confidence Score (%)</Label>
              <Input
                id="confidence_score"
                type="number"
                min="0"
                max="100"
                {...form.register("confidence_score", { valueAsNumber: true })}
                placeholder="85"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update KDM
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}