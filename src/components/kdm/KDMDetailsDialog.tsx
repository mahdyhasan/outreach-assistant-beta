import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Linkedin, Building, Calendar, User } from "lucide-react";

interface KDM {
  id: string;
  first_name: string;
  last_name: string;
  designation: string;
  email?: string;
  phone?: string;
  linkedin_profile?: string;
  facebook_profile?: string;
  instagram_profile?: string;
  contact_type: string;
  confidence_score?: number;
  email_status?: string;
  created_at: string;
  updated_at: string;
  companies?: {
    company_name: string;
    website?: string;
    industry?: string;
    location?: string;
  };
}

interface KDMDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kdm: KDM | null;
  onRefresh: () => void;
}

export function KDMDetailsDialog({ open, onOpenChange, kdm, onRefresh }: KDMDetailsDialogProps) {
  if (!kdm) return null;

  const getContactTypeBadge = (type: string) => {
    const colors = {
      kdm: 'bg-primary text-primary-foreground',
      influencer: 'bg-secondary text-secondary-foreground',
      gatekeeper: 'bg-muted text-muted-foreground',
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors] || colors.kdm}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const getEmailStatusBadge = (status: string) => {
    const colors = {
      not_contacted: 'bg-gray-100 text-gray-800',
      contacted: 'bg-blue-100 text-blue-800',
      replied: 'bg-green-100 text-green-800',
      bounced: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.not_contacted}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {kdm.first_name} {kdm.last_name}
          </DialogTitle>
          <DialogDescription>
            {kdm.designation} at {kdm.companies?.company_name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="font-medium">{kdm.first_name} {kdm.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Designation</label>
                  <p className="font-medium">{kdm.designation}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Type</label>
                  <div className="mt-1">{getContactTypeBadge(kdm.contact_type)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Confidence Score</label>
                  <p className="font-medium">{kdm.confidence_score || 'N/A'}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {kdm.email && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{kdm.email}</span>
                  </div>
                  {kdm.email_status && getEmailStatusBadge(kdm.email_status)}
                </div>
              )}
              
              {kdm.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{kdm.phone}</span>
                </div>
              )}
              
              {kdm.linkedin_profile && (
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={kdm.linkedin_profile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Information */}
          {kdm.companies && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building className="h-4 w-4" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                  <p className="font-medium">{kdm.companies.company_name}</p>
                </div>
                
                {kdm.companies.website && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Website</label>
                    <p className="font-medium">{kdm.companies.website}</p>
                  </div>
                )}
                
                {kdm.companies.industry && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Industry</label>
                    <p className="font-medium">{kdm.companies.industry}</p>
                  </div>
                )}
                
                {kdm.companies.location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="font-medium">{kdm.companies.location}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="font-medium">
                  {new Date(kdm.created_at).toLocaleDateString()} at {new Date(kdm.created_at).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="font-medium">
                  {new Date(kdm.updated_at).toLocaleDateString()} at {new Date(kdm.updated_at).toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}