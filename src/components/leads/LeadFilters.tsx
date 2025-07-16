import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";

interface LeadFiltersProps {
  filters: {
    search: string;
    status: string[];
    scoreRange: [number, number];
    source: string[];
  };
  onFiltersChange: (filters: any) => void;
}

const statusOptions = [
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'enriched', label: 'Enriched' },
];

const sourceOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'apollo', label: 'Apollo' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'scraping', label: 'Scraping' },
];

export function LeadFilters({ filters, onFiltersChange }: LeadFiltersProps) {
  const updateFilters = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: 'status' | 'source', value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilters(key, updated);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="search">Search Companies</Label>
        <Input
          id="search"
          placeholder="Search by company name..."
          value={filters.search}
          onChange={(e) => updateFilters('search', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${option.value}`}
                checked={filters.status.includes(option.value)}
                onCheckedChange={() => toggleArrayFilter('status', option.value)}
              />
              <Label htmlFor={`status-${option.value}`} className="text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Source</Label>
        <div className="space-y-2">
          {sourceOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`source-${option.value}`}
                checked={filters.source.includes(option.value)}
                onCheckedChange={() => toggleArrayFilter('source', option.value)}
              />
              <Label htmlFor={`source-${option.value}`} className="text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>AI Score Range</Label>
        <div className="px-2">
          <Slider
            value={filters.scoreRange}
            onValueChange={(value) => updateFilters('scoreRange', value as [number, number])}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>{filters.scoreRange[0]}%</span>
            <span>{filters.scoreRange[1]}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}