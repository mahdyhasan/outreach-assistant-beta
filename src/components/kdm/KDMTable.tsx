import { Eye, Edit, Mail, Linkedin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface KDM {
  id: string;
  first_name: string;
  last_name: string;
  designation: string;
  email?: string;
  phone?: string;
  linkedin_profile?: string;
  contact_type: string;
  confidence_score?: number;
  companies?: {
    company_name: string;
    website?: string;
  };
}

interface KDMTableProps {
  kdms: KDM[];
  onAction: (type: 'details' | 'edit', kdm: KDM) => void;
  onRefresh: () => void;
}

export function KDMTable({ kdms, onAction, onRefresh }: KDMTableProps) {
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

  if (kdms.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No KDMs found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Score</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {kdms.map((kdm) => (
            <TableRow key={kdm.id}>
              <TableCell className="font-medium">
                {kdm.first_name} {kdm.last_name}
              </TableCell>
              <TableCell>{kdm.designation}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{kdm.companies?.company_name}</div>
                  {kdm.companies?.website && (
                    <div className="text-xs text-muted-foreground">
                      {kdm.companies.website}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {kdm.email && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Mail className="h-3 w-3" />
                    </Button>
                  )}
                  {kdm.phone && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Phone className="h-3 w-3" />
                    </Button>
                  )}
                  {kdm.linkedin_profile && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Linkedin className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {getContactTypeBadge(kdm.contact_type)}
              </TableCell>
              <TableCell>
                {kdm.confidence_score && (
                  <Badge variant="outline">
                    {kdm.confidence_score}%
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAction('details', kdm)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAction('edit', kdm)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}