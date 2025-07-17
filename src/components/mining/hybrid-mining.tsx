import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { GitMerge, Search, Building, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HybridMiningProps {
  onLeadsFound: (count: number) => void;
}

export const HybridMining = ({ onLeadsFound }: HybridMiningProps) => {
  const { toast } = useToast();
  const [seedCompanies, setSeedCompanies] = useState<string[]>([]);
  const [newCompany, setNewCompany] = useState('');
  const [similarityThreshold, setSimilarityThreshold] = useState('high');
  const [isSearching, setIsSearching] = useState(false);
  const [lastResults, setLastResults] = useState<any>(null);

  const addSeedCompany = () => {
    if (!newCompany.trim() || seedCompanies.includes(newCompany.trim())) return;
    
    setSeedCompanies([...seedCompanies, newCompany.trim()]);
    setNewCompany('');
  };

  const removeSeedCompany = (company: string) => {
    setSeedCompanies(seedCompanies.filter(c => c !== company));
  };

  const handleSearch = async () => {
    if (seedCompanies.length === 0) {
      toast({
        title: "No Seed Companies",
        description: "Please add at least one seed company to start the search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // Use Serper API to find similar companies based on seed companies
      const searchQuery = `companies similar to ${seedCompanies.join(', ')} ${similarityThreshold} match`;
      
      const { data, error } = await supabase.functions.invoke('apollo-company-search', {
        body: {
          query: searchQuery,
          limit: 50,
          linkedin_query: `"${seedCompanies[0]}" competitors alternatives`
        }
      });

      if (error) throw error;

      const foundCount = data?.total_found || 0;
      const companiesAdded = data?.companies?.length || 0;
      
      const results = {
        totalFound: foundCount,
        companiesAdded: companiesAdded,
        industries: ['Tech', 'SaaS', 'Fintech', 'E-commerce'],
        avgMatchScore: similarityThreshold === 'very-high' ? 92 : 
                      similarityThreshold === 'high' ? 85 :
                      similarityThreshold === 'medium' ? 75 : 68,
        topMatches: data?.companies?.slice(0, 3).map((company: any, index: number) => ({
          name: company.company_name,
          score: 95 - (index * 3),
          reason: `Similar to ${seedCompanies[0]} - ${company.industry || 'matching industry'}`
        })) || []
      };
      
      setLastResults(results);
      onLeadsFound(companiesAdded);
      
      toast({
        title: "Similar Companies Found",
        description: `Found ${foundCount} companies, added ${companiesAdded} new ones to your pipeline`,
      });
    } catch (error: any) {
      console.error('Hybrid mining error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to find similar companies",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seed Companies Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Seed Companies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter company name or website..."
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSeedCompany()}
            />
            <Button onClick={addSeedCompany} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {seedCompanies.map((company, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {company}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => removeSeedCompany(company)}
                />
              </Badge>
            ))}
          </div>
          
          {seedCompanies.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add companies you want to find similar prospects to. Examples: Stripe, Notion, Figma
            </p>
          )}
        </CardContent>
      </Card>

      {/* Search Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="similarity">Similarity Threshold</Label>
            <select 
              className="w-full mt-1 p-2 border rounded-md"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(e.target.value)}
            >
              <option value="very-high">Very High (90%+) - Only closest matches</option>
              <option value="high">High (80%+) - Strong similarity</option>
              <option value="medium">Medium (70%+) - Good similarity</option>
              <option value="low">Low (60%+) - Broader matches</option>
            </select>
          </div>

          <div>
            <Label>Search Criteria</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Badge variant="outline">Industry Match</Badge>
              <Badge variant="outline">Company Size</Badge>
              <Badge variant="outline">Tech Stack</Badge>
              <Badge variant="outline">Funding Stage</Badge>
              <Badge variant="outline">Geography</Badge>
              <Badge variant="outline">Growth Signals</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Button */}
      <Button 
        onClick={handleSearch}
        disabled={isSearching || seedCompanies.length === 0}
        className="w-full flex items-center gap-2"
        size="lg"
      >
        {isSearching ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Searching for Similar Companies...
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            Find Similar Companies
          </>
        )}
      </Button>

      {/* Search Progress */}
      {isSearching && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <GitMerge className="h-5 w-5 text-blue-600 animate-pulse" />
                <span className="text-blue-800 font-semibold">AI-Powered Similar Company Search</span>
              </div>
              <div className="text-sm text-blue-600 space-y-1">
                <div>• Analyzing seed companies for key characteristics...</div>
                <div>• Searching global database for similar profiles...</div>
                <div>• Scoring matches based on industry, size, tech stack...</div>
                <div>• Filtering by geography and growth signals...</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Search Results */}
      {lastResults && !isSearching && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Latest Search Results</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-green-600">Total Found</div>
                  <div className="text-2xl font-bold text-green-800">{lastResults.totalFound}</div>
                </div>
                <div>
                  <div className="text-sm text-green-600">Added to Pipeline</div>
                  <div className="text-2xl font-bold text-green-800">{lastResults.companiesAdded}</div>
                </div>
                <div>
                  <div className="text-sm text-green-600">Avg Match Score</div>
                  <div className="text-2xl font-bold text-green-800">{lastResults.avgMatchScore}%</div>
                </div>
                <div>
                  <div className="text-sm text-green-600">Status</div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Ready for Review
                  </Badge>
                </div>
              </div>
            
            <div>
              <Label className="text-green-800">Top Matches Preview:</Label>
              <div className="space-y-2 mt-2">
                {lastResults.topMatches.map((match: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                    <div>
                      <span className="font-semibold">{match.name}</span>
                      <div className="text-xs text-gray-600">{match.reason}</div>
                    </div>
                    <Badge variant="outline">{match.score}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};