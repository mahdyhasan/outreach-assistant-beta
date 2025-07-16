import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Plus, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ManualImportProps {
  onLeadsAdded: (count: number) => void;
}

export const ManualImport = ({ onLeadsAdded }: ManualImportProps) => {
  const [companyList, setCompanyList] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Parse CSV data
      const companies = lines.slice(1).map(line => {
        const fields = line.split(',').map(field => field.trim().replace(/"/g, ''));
        return {
          company_name: fields[0] || '',
          website: fields[1] || '',
          industry: fields[2] || 'Unknown',
          location: fields[3] || 'Unknown'
        };
      }).filter(company => company.company_name);

      if (companies.length === 0) {
        throw new Error('No valid companies found in file');
      }

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      onLeadsAdded(companies.length);
      toast.success(`${companies.length} companies processed and queued for enrichment`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!companyList.trim()) return;

    setIsProcessing(true);
    const companies = companyList.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const isUrl = line.includes('http') || line.includes('www.');
        return {
          company_name: isUrl ? '' : line.trim(),
          website: isUrl ? line.trim() : '',
          industry: 'Unknown',
          location: 'Unknown'
        };
      });
    
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      onLeadsAdded(companies.length);
      toast.success(`${companies.length} companies queued for enrichment`);
      setCompanyList('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to process companies');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `Company Name,Website,Industry,Location
TechCorp Solutions,https://techcorp.com,Software,San Francisco
StartupXYZ,https://startupxyz.com,Marketing,Austin
Enterprise Corp,https://enterprise.com,Finance,New York`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* CSV Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-upload">Upload CSV File</Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Supported formats: CSV, Excel (.xlsx, .xls)
            </p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Manual Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company-list">Company Names/Websites</Label>
            <Textarea
              id="company-list"
              placeholder={`Enter company names or websites (one per line):
TechCorp Solutions
https://startupxyz.com
Enterprise Corp
https://example.com`}
              value={companyList}
              onChange={(e) => setCompanyList(e.target.value)}
              disabled={isProcessing}
              rows={8}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter one company name or website per line
            </p>
          </div>
          
          <Button 
            onClick={handleManualSubmit}
            disabled={!companyList.trim() || isProcessing}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {isProcessing ? 'Processing...' : 'Add Companies'}
          </Button>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
              <span className="text-orange-800">
                Processing companies and enriching lead data...
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};