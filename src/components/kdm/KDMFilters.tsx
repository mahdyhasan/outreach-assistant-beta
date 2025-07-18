import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface KDMFiltersProps {
  filters: {
    search: string;
    contactType: string[];
    companySearch: string;
  };
  onFiltersChange: (filters: any) => void;
}

const contactTypeOptions = [
  { value: 'kdm', label: 'Key Decision Maker' },
  { value: 'influencer', label: 'Influencer' },
  { value: 'gatekeeper', label: 'Gatekeeper' },
];

export function KDMFilters({ filters, onFiltersChange }: KDMFiltersProps) {
  const updateFilters = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
      {/* Search by name */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <Label htmlFor="search" className="text-sm font-medium whitespace-nowrap">Name:</Label>
        <Input
          id="search"
          placeholder="Search by name..."
          value={filters.search}
          onChange={(e) => updateFilters('search', e.target.value)}
          className="h-8"
        />
      </div>

      {/* Search by company */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <Label htmlFor="companySearch" className="text-sm font-medium whitespace-nowrap">Company:</Label>
        <Input
          id="companySearch"
          placeholder="Search by company..."
          value={filters.companySearch}
          onChange={(e) => updateFilters('companySearch', e.target.value)}
          className="h-8"
        />
      </div>

      {/* Contact Type */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium whitespace-nowrap">Type:</Label>
        <Select value={filters.contactType.join(',')} onValueChange={(value) => updateFilters('contactType', value ? value.split(',') : [])}>
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {contactTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}