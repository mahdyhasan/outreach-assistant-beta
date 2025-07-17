import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, Search, Settings, Target } from 'lucide-react';
import { useApolloSearch, CompanySearchFilters } from '@/hooks/use-apollo-search';

interface AutomatedScrapingProps {
  dailyScraped: number;
  dailyLimit: number;
  onLeadsFound: (count: number) => void;
}

export const AutomatedScraping = ({ 
  dailyScraped = 0, 
  dailyLimit = 100, 
  onLeadsFound 
}: AutomatedScrapingProps) => {
  console.log('AutomatedScraping rendering with props:', { dailyScraped, dailyLimit });
  
  const { searchCompanies, loading } = useApolloSearch();
  const [searchParams, setSearchParams] = useState<CompanySearchFilters>({
    query: '',
    location: 'all',
    industry: 'all',
    size: 'all',
    limit: 20,
  });
  const [lastSearchResults, setLastSearchResults] = useState<{
    totalFound: number;
    companiesAdded: number;
    decisionMakersFound: number;
  } | null>(null);

  useEffect(() => {
    console.log('AutomatedScraping mounted successfully');
  }, []);

  const handleSearch = async () => {
    if (!searchParams.query.trim()) return;
    
    // Convert "all" values back to empty strings for the API
    const apiParams = {
      ...searchParams,
      location: searchParams.location === 'all' ? '' : searchParams.location,
      industry: searchParams.industry === 'all' ? '' : searchParams.industry,
      size: searchParams.size === 'all' ? '' : searchParams.size,
    };
    
    const results = await searchCompanies(apiParams);
    
    if (results.success) {
      setLastSearchResults({
        totalFound: results.totalFound,
        companiesAdded: results.companies.length,
        decisionMakersFound: results.decisionMakersFound,
      });
      onLeadsFound(results.companies.length);
    }
  };

  const progressPercentage = (dailyScraped / dailyLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Daily Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Daily Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Scraped Today</span>
              <span>{dailyScraped} of {dailyLimit}</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            {progressPercentage >= 100 && (
              <Badge variant="secondary" className="mt-2">
                Daily limit reached
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Apollo Company Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Company Search
          </CardTitle>
          <CardDescription>
            Find companies using Apollo API integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-query">Search Query</Label>
              <Input
                id="search-query"
                placeholder="e.g., AI startups, SaaS companies"
                value={searchParams.query}
                onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select 
                value={searchParams.location} 
                onValueChange={(value) => setSearchParams({ ...searchParams, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Location</SelectItem>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select 
                value={searchParams.industry} 
                onValueChange={(value) => setSearchParams({ ...searchParams, industry: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Industry</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="E-commerce">E-commerce</SelectItem>
                  <SelectItem value="Fintech">Fintech</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-size">Company Size</Label>
              <Select 
                value={searchParams.size} 
                onValueChange={(value) => setSearchParams({ ...searchParams, size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Size</SelectItem>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="501+">500+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Search Limit</Label>
            <Select 
              value={searchParams.limit?.toString()} 
              onValueChange={(value) => setSearchParams({ ...searchParams, limit: parseInt(value) })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 results</SelectItem>
                <SelectItem value="20">20 results</SelectItem>
                <SelectItem value="50">50 results</SelectItem>
                <SelectItem value="100">100 results</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={loading || !searchParams.query.trim() || dailyScraped >= dailyLimit} 
            className="w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Searching...' : 'Start Company Search'}
          </Button>

          {lastSearchResults && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Last Search Results</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Found:</span>
                  <br />
                  <Badge variant="secondary">{lastSearchResults.totalFound}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Companies Added:</span>
                  <br />
                  <Badge variant="default">{lastSearchResults.companiesAdded}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Decision Makers:</span>
                  <br />
                  <Badge variant="outline">{lastSearchResults.decisionMakersFound}</Badge>
                </div>
              </div>
            </div>
          )}

          {dailyScraped >= dailyLimit && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 text-sm">
                Daily limit reached. You can search again tomorrow or upgrade your plan for higher limits.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};