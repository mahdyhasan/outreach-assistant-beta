import { Lead } from '@/types/lead';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  MoreHorizontal,
  Brain,
  UserCheck,
  TrendingUp,
  MessageSquare,
  Linkedin,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onScoreAdjust: (lead: Lead) => void;
  onStatusChange: (leadId: string, status: Lead['status'], responseTag?: Lead['responseTag']) => void;
}

export function LeadCard({ lead, onScoreAdjust, onStatusChange }: LeadCardProps) {
  const getStatusColor = (status: Lead['status']) => {
    const colors = {
      new: 'bg-blue-500',
      in_progress: 'bg-yellow-500',
      qualified: 'bg-green-500',
      nurture: 'bg-purple-500',
      cold: 'bg-gray-500',
      converted: 'bg-emerald-500'
    };
    return colors[status];
  };

  const getPriorityColor = (priority: Lead['priority']) => {
    const colors = {
      immediate: 'bg-red-500',
      queue: 'bg-yellow-500',
      nurture: 'bg-blue-500'
    };
    return colors[priority];
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg">{lead.companyName}</h3>
              {lead.website && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                  <a href={lead.website} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{lead.contactName}</span>
              <span>•</span>
              <span>{lead.jobTitle}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border z-50">
              <DropdownMenuItem onClick={() => onScoreAdjust(lead)}>
                <Brain className="h-4 w-4 mr-2" />
                Adjust Score
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onStatusChange(lead.id, 'qualified', 'positive')}>
                <UserCheck className="h-4 w-4 mr-2" />
                Mark Qualified
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(lead.id, 'cold', 'negative')}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Mark Cold
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-lg font-bold text-lg ${getScoreColor(lead.finalScore)}`}>
              {lead.finalScore}%
            </div>
            <div className="text-xs space-y-1">
              {lead.humanScore !== undefined ? (
                <>
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    <span>Human: {lead.humanScore}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Brain className="h-3 w-3" />
                    <span>AI: {lead.aiScore}%</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  <span>AI Score</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Badge className={`${getStatusColor(lead.status)} text-xs`}>
              {lead.status.replace('_', ' ')}
            </Badge>
            <Badge className={`${getPriorityColor(lead.priority)} text-xs`}>
              {lead.priority}
            </Badge>
          </div>
        </div>

        {/* Human Feedback Alert */}
        {lead.humanFeedback && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <div className="flex items-center gap-1 font-medium text-yellow-800">
              <AlertTriangle className="h-3 w-3" />
              Score Corrected
            </div>
            <div className="text-yellow-700 mt-1">
              {lead.humanFeedback.originalScore}% → {lead.humanFeedback.correctedScore}%: {lead.humanFeedback.reason}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">{lead.email}</span>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{lead.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>{lead.location}</span>
          </div>
          {lead.linkedinUrl && (
            <div className="flex items-center gap-2">
              <Linkedin className="h-3 w-3 text-muted-foreground" />
              <a 
                href={lead.linkedinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                LinkedIn Profile
              </a>
            </div>
          )}
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground border-t pt-3">
          <div>
            <span className="font-medium">Industry:</span> {lead.industry}
          </div>
          <div>
            <span className="font-medium">Size:</span> {lead.companySize}
          </div>
          <div>
            <span className="font-medium">Source:</span> {lead.source}
          </div>
          <div>
            <span className="font-medium">Growth:</span> {lead.enrichmentData.companyGrowthRate || 'N/A'}
          </div>
        </div>

        {/* Enrichment Data Highlights */}
        {(lead.enrichmentData.fundingRounds?.length || lead.enrichmentData.recentNews?.length) && (
          <div className="space-y-2">
            {lead.enrichmentData.fundingRounds?.length && (
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-medium">
                  {lead.enrichmentData.fundingRounds[0]}
                </span>
              </div>
            )}
            {lead.enrichmentData.recentNews?.length && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Recent:</span> {lead.enrichmentData.recentNews[0]}
              </div>
            )}
          </div>
        )}

        {/* Outreach Status */}
        {lead.outreachHistory.length > 0 && (
          <div className="flex items-center gap-2 text-xs border-t pt-3">
            <MessageSquare className="h-3 w-3" />
            <span>Last contact: {formatDate(lead.lastContactDate!)}</span>
            {lead.followupCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {lead.followupCount} followups
              </Badge>
            )}
          </div>
        )}

        {/* Next Action */}
        {lead.nextFollowupDate && (
          <div className="flex items-center gap-2 text-xs text-orange-600">
            <Calendar className="h-3 w-3" />
            <span>Next followup: {formatDate(lead.nextFollowupDate)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}