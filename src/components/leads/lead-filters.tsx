import { LeadFilters } from '@/types/lead';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, X } from 'lucide-react';

interface LeadFiltersProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
}

export function LeadFiltersComponent({ filters, onFiltersChange }: LeadFiltersProps) {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const handleStatusToggle = (status: string) => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status as any)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status as any];
    
    onFiltersChange({
      ...filters,
      status: newStatus.length > 0 ? newStatus : undefined
    });
  };

  const handlePriorityToggle = (priority: string) => {
    const currentPriority = filters.priority || [];
    const newPriority = currentPriority.includes(priority as any)
      ? currentPriority.filter(p => p !== priority)
      : [...currentPriority, priority as any];
    
    onFiltersChange({
      ...filters,
      priority: newPriority.length > 0 ? newPriority : undefined
    });
  };

  const handleSourceToggle = (source: string) => {
    const currentSource = filters.source || [];
    const newSource = currentSource.includes(source as any)
      ? currentSource.filter(s => s !== source)
      : [...currentSource, source as any];
    
    onFiltersChange({
      ...filters,
      source: newSource.length > 0 ? newSource : undefined
    });
  };

  const handleScoreRangeChange = (range: number[]) => {
    onFiltersChange({
      ...filters,
      scoreRange: [range[0], range[1]]
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof LeadFilters];
    return value !== undefined && value !== '';
  });

  const statusOptions = [
    { value: 'new', label: 'New', color: 'bg-blue-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
    { value: 'qualified', label: 'Qualified', color: 'bg-green-500' },
    { value: 'nurture', label: 'Nurture', color: 'bg-purple-500' },
    { value: 'cold', label: 'Cold', color: 'bg-gray-500' },
    { value: 'converted', label: 'Converted', color: 'bg-emerald-500' }
  ];

  const priorityOptions = [
    { value: 'immediate', label: 'Immediate', color: 'bg-red-500' },
    { value: 'queue', label: 'Queue', color: 'bg-yellow-500' },
    { value: 'nurture', label: 'Nurture', color: 'bg-blue-500' }
  ];

  const sourceOptions = [
    { value: 'google', label: 'Google', color: 'bg-orange-500' },
    { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-600' },
    { value: 'clay', label: 'Clay', color: 'bg-purple-600' },
    { value: 'apollo', label: 'Apollo', color: 'bg-green-600' },
    { value: 'manual', label: 'Manual', color: 'bg-gray-600' }
  ];

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label>Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company, contact, or email..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex flex-wrap gap-1">
            {statusOptions.map(option => (
              <Badge
                key={option.value}
                variant={filters.status?.includes(option.value as any) ? "default" : "outline"}
                className={`cursor-pointer text-xs ${
                  filters.status?.includes(option.value as any) ? option.color : ''
                }`}
                onClick={() => handleStatusToggle(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <Label>Priority</Label>
          <div className="flex flex-wrap gap-1">
            {priorityOptions.map(option => (
              <Badge
                key={option.value}
                variant={filters.priority?.includes(option.value as any) ? "default" : "outline"}
                className={`cursor-pointer text-xs ${
                  filters.priority?.includes(option.value as any) ? option.color : ''
                }`}
                onClick={() => handlePriorityToggle(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Source Filter */}
        <div className="space-y-2">
          <Label>Source</Label>
          <div className="flex flex-wrap gap-1">
            {sourceOptions.map(option => (
              <Badge
                key={option.value}
                variant={filters.source?.includes(option.value as any) ? "default" : "outline"}
                className={`cursor-pointer text-xs ${
                  filters.source?.includes(option.value as any) ? option.color : ''
                }`}
                onClick={() => handleSourceToggle(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Score Range Filter */}
        <div className="space-y-2">
          <Label>Score Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {filters.scoreRange 
                  ? `${filters.scoreRange[0]}% - ${filters.scoreRange[1]}%`
                  : "All scores"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Score Range: {filters.scoreRange?.[0] || 0}% - {filters.scoreRange?.[1] || 100}%</Label>
                  <Slider
                    value={filters.scoreRange || [0, 100]}
                    onValueChange={handleScoreRangeChange}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1 pt-2 border-t">
          {filters.search && (
            <Badge variant="secondary" className="text-xs">
              Search: "{filters.search}"
            </Badge>
          )}
          {filters.scoreRange && (
            <Badge variant="secondary" className="text-xs">
              Score: {filters.scoreRange[0]}%-{filters.scoreRange[1]}%
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}