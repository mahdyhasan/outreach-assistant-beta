import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CompanyLead } from "@/hooks/use-supabase-leads";
import { Building2, User, Signal, Globe, Phone, Mail, Calendar, TrendingUp, UserPlus, Edit, Linkedin } from "lucide-react";
import { AddDecisionMakerDialog } from "./AddDecisionMakerDialog";
import { EditKDMDialog } from "../kdm/EditKDMDialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LeadDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: CompanyLead | null;
  onRefresh?: () => void;
}

export function LeadDetailsDialog({ open, onOpenChange, lead, onRefresh }: LeadDetailsDialogProps) {
  const [showAddDecisionMaker, setShowAddDecisionMaker] = useState(false);
  const [showEditKDM, setShowEditKDM] = useState(false);
  const [selectedKDM, setSelectedKDM] = useState<any>(null);

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {lead.company_name}
          </DialogTitle>
          <DialogDescription>
            Complete lead details including company info, decision makers, and signals
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Industry</p>
                  <p className="text-sm text-muted-foreground">{lead.industry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Employee Size</p>
                  <p className="text-sm text-muted-foreground">{lead.employee_size || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Founded</p>
                  <p className="text-sm text-muted-foreground">{lead.founded || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">{lead.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">AI Score</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-semibold">{lead.ai_score}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Source</p>
                  <Badge variant="secondary">{lead.source}</Badge>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Contact Information</p>
                <div className="space-y-2">
                  {lead.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">
                        {lead.website}
                      </a>
                    </div>
                  )}
                  {lead.public_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{lead.public_email}</span>
                    </div>
                  )}
                  {lead.public_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{lead.public_phone}</span>
                    </div>
                  )}
                  {lead.linkedin_profile && (
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      <a 
                        href={lead.linkedin_profile} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {lead.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Description</p>
                    <p className="text-sm text-muted-foreground">{lead.description}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex gap-2">
                <Badge variant="outline">{lead.status.replace('_', ' ')}</Badge>
                <Badge variant="secondary">{lead.source}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Decision Makers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Decision Makers ({lead.decision_makers?.length || 0})
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAddDecisionMaker(true)}
                  className="flex items-center gap-1"
                >
                  <UserPlus className="h-3 w-3" />
                  Add KDM
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lead.decision_makers && lead.decision_makers.length > 0 ? (
                <div className="space-y-4">
                  {lead.decision_makers.map((dm) => (
                    <div key={dm.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{dm.first_name} {dm.last_name}</p>
                          <p className="text-sm text-muted-foreground">{dm.designation}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {dm.contact_type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedKDM(dm);
                              setShowEditKDM(true);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {dm.email && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span>{dm.email}</span>
                            </div>
                            {dm.email_status && (
                              <Badge variant="outline" className="text-xs">
                                {dm.email_status.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {dm.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{dm.phone}</span>
                          </div>
                        )}
                        
                        {dm.linkedin_profile && (
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-3 w-3" />
                            <a 
                              href={dm.linkedin_profile} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-xs"
                            >
                              LinkedIn Profile
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          Confidence: {dm.confidence_score || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Added: {new Date(dm.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No decision makers found</p>
              )}
            </CardContent>
          </Card>

          {/* Signals */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Signal className="h-4 w-4" />
                Signals ({lead.signals?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lead.signals && lead.signals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.signals.map((signal) => (
                    <div key={signal.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">{signal.signal_title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {signal.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {signal.signal_description}
                      </p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {signal.signal_type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(signal.detected_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No signals detected</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Decision Maker Dialog */}
        <AddDecisionMakerDialog
          open={showAddDecisionMaker}
          onOpenChange={setShowAddDecisionMaker}
          companyId={lead.id}
          onSuccess={() => {
            onRefresh?.();
          }}
        />

        {/* Edit KDM Dialog */}
        <EditKDMDialog
          open={showEditKDM}
          onOpenChange={setShowEditKDM}
          kdm={selectedKDM}
          onSuccess={() => {
            onRefresh?.();
            setShowEditKDM(false);
            setSelectedKDM(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}