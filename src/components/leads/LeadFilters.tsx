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
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
      {/* Search - compact input */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <Label htmlFor="search" className="text-sm font-medium whitespace-nowrap">Search:</Label>
        <Input
          id="search"
          placeholder="Company name..."
          value={filters.search}
          onChange={(e) => updateFilters('search', e.target.value)}
          className="h-8"
        />
      </div>

      {/* Status - compact dropdown */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium whitespace-nowrap">Status:</Label>
        <Select value={filters.status.length > 0 ? filters.status.join(',') : 'all'} onValueChange={(value) => updateFilters('status', value === 'all' ? [] : value.split(','))}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Source - compact dropdown */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium whitespace-nowrap">Source:</Label>
        <Select value={filters.source.length > 0 ? filters.source.join(',') : 'all'} onValueChange={(value) => updateFilters('source', value === 'all' ? [] : value.split(','))}>
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sourceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Score Range - compact slider */}
      <div className="flex items-center gap-2 min-w-[160px]">
        <Label className="text-sm font-medium whitespace-nowrap">Score:</Label>
        <div className="flex-1">
          <Slider
            value={filters.scoreRange}
            onValueChange={(value) => updateFilters('scoreRange', value as [number, number])}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{filters.scoreRange[0]}%</span>
            <span>{filters.scoreRange[1]}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}