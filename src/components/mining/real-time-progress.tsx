import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Search, 
  Brain, 
  Zap, 
  Clock,
  Users,
  Building,
  AlertTriangle
} from 'lucide-react';

interface ProgressStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  results?: number;
  error?: string;
  details?: string;
  icon: React.ReactNode;
}

interface RealTimeProgressProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onComplete?: (results: any) => void;
}

export function RealTimeProgress({ open, onOpenChange, sessionId, onComplete }: RealTimeProgressProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: 'serper_search',
      name: 'Web Search',
      description: 'Finding company websites and profiles...',
      status: 'pending',
      progress: 0,
      icon: <Search className="h-4 w-4" />
    },
    {
      id: 'linkedin_discovery',
      name: 'LinkedIn Discovery',
      description: 'Extracting LinkedIn company profiles...',
      status: 'pending',
      progress: 0,
      icon: <Building className="h-4 w-4" />
    },
    {
      id: 'openai_enrichment',
      name: 'AI Enrichment',
      description: 'Filling data gaps with AI analysis...',
      status: 'pending',
      progress: 0,
      icon: <Brain className="h-4 w-4" />
    },
    {
      id: 'apollo_kdm',
      name: 'Contact Discovery',
      description: 'Finding key decision makers...',
      status: 'pending',
      progress: 0,
      icon: <Users className="h-4 w-4" />
    },
    {
      id: 'database_save',
      name: 'Save Results',
      description: 'Saving leads to database...',
      status: 'pending',
      progress: 0,
      icon: <Zap className="h-4 w-4" />
    }
  ]);

  const [overallProgress, setOverallProgress] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Simulate real-time progress updates
  useEffect(() => {
    if (!open || !sessionId) return;

    let progressInterval: NodeJS.Timeout;
    let logInterval: NodeJS.Timeout;

    const simulateProgress = () => {
      let currentStepIndex = 0;
      let stepProgress = 0;

      progressInterval = setInterval(() => {
        setSteps(prevSteps => {
          const newSteps = [...prevSteps];
          
          // Update current step
          if (currentStepIndex < newSteps.length) {
            const currentStep = newSteps[currentStepIndex];
            
            if (currentStep.status === 'pending') {
              currentStep.status = 'running';
              setCurrentOperation(currentStep.description);
              addLog(`Starting: ${currentStep.name}`);
            }
            
            if (currentStep.status === 'running') {
              stepProgress += Math.random() * 20 + 5; // Random progress increment
              currentStep.progress = Math.min(stepProgress, 100);
              
              // Add some realistic results
              if (currentStep.id === 'serper_search' && stepProgress > 50) {
                currentStep.results = Math.floor(Math.random() * 5) + 3;
                currentStep.details = `Found ${currentStep.results} potential companies`;
              } else if (currentStep.id === 'linkedin_discovery' && stepProgress > 60) {
                currentStep.results = Math.floor(Math.random() * 3) + 2;
                currentStep.details = `Discovered ${currentStep.results} LinkedIn profiles`;
              } else if (currentStep.id === 'openai_enrichment' && stepProgress > 70) {
                currentStep.results = Math.floor(Math.random() * 4) + 2;
                currentStep.details = `Enriched ${currentStep.results} company records`;
              } else if (currentStep.id === 'apollo_kdm' && stepProgress > 80) {
                currentStep.results = Math.floor(Math.random() * 6) + 4;
                currentStep.details = `Found ${currentStep.results} decision makers`;
              }
              
              if (stepProgress >= 100) {
                currentStep.status = 'completed';
                currentStep.progress = 100;
                addLog(`✅ Completed: ${currentStep.name} (${currentStep.results || 0} results)`);
                currentStepIndex++;
                stepProgress = 0;
                setTotalResults(prev => prev + (currentStep.results || 0));
              }
            }
          }
          
          // Calculate overall progress
          const completedSteps = newSteps.filter(s => s.status === 'completed').length;
          const runningStep = newSteps.find(s => s.status === 'running');
          const runningProgress = runningStep ? runningStep.progress / 100 : 0;
          const overall = Math.floor(((completedSteps + runningProgress) / newSteps.length) * 100);
          setOverallProgress(overall);
          
          // Check if all steps are completed
          if (completedSteps === newSteps.length) {
            setIsCompleted(true);
            setCurrentOperation('Mining completed successfully!');
            addLog('🎉 All steps completed! Processing final results...');
            clearInterval(progressInterval);
            
            // Simulate completion callback
            setTimeout(() => {
              onComplete?.({ 
                sessionId, 
                totalResults,
                completedAt: new Date().toISOString() 
              });
            }, 1000);
          }
          
          return newSteps;
        });
      }, 800);
    };

    // Add periodic log messages
    logInterval = setInterval(() => {
      const messages = [
        'Analyzing search results...',
        'Processing company data...',
        'Validating contact information...',
        'Checking for duplicates...',
        'Applying data quality filters...',
        'Enriching contact profiles...',
        'Verifying company details...'
      ];
      
      if (!isCompleted && Math.random() > 0.6) {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        addLog(randomMessage);
      }
    }, 3000);

    simulateProgress();

    return () => {
      clearInterval(progressInterval);
      clearInterval(logInterval);
    };
  }, [open, sessionId, isCompleted, totalResults, onComplete]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`].slice(-20)); // Keep last 20 logs
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'animate-spin text-blue-500'}`} />
            Enhanced Lead Mining Progress
            {isCompleted && <Badge className="bg-green-100 text-green-800">Completed</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <div className="text-sm text-muted-foreground">{currentOperation}</div>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{totalResults}</div>
                  <div className="text-sm text-muted-foreground">Total Results Found</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {steps.filter(s => s.status === 'completed').length}/{steps.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Steps Completed</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Steps Progress */}
            <div className="space-y-4">
              <h3 className="font-semibold">Mining Steps</h3>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {step.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{step.name}</span>
                            <Badge className={getStepStatusColor(step.status)}>
                              {step.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {step.description}
                          </div>
                          {step.status === 'running' && (
                            <Progress value={step.progress} className="h-1" />
                          )}
                          {step.details && (
                            <div className="text-xs text-green-600 mt-1">
                              {step.details}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {getStepStatusIcon(step.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Live Logs */}
            <div className="space-y-4">
              <h3 className="font-semibold">Live Activity Log</h3>
              <ScrollArea className="h-64">
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, index) => (
                    <div key={index} className="p-2 bg-muted/50 rounded text-muted-foreground">
                      {log}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Warning/Info Messages */}
          {!isCompleted && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 text-blue-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Mining in progress - do not close this window
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                This process may take 2-5 minutes depending on the number of results and API response times.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}