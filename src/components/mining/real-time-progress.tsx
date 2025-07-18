
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { supabase } from '@/integrations/supabase/client';

interface RealTimeProgressProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onComplete?: (results: any) => void;
}

interface ProgressRecord {
  session_id: string;
  current_step: string;
  progress_percentage: number;
  results_so_far: number;
  status: string;
  error_message: string | null;
  updated_at: string;
}

export function RealTimeProgress({ open, onOpenChange, sessionId, onComplete }: RealTimeProgressProps) {
  const [progressData, setProgressData] = useState<ProgressRecord | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Poll for progress updates
  useEffect(() => {
    if (!open || !sessionId) return;

    let pollInterval: NodeJS.Timeout;

    const pollProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('mining_progress')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (error) {
          console.error('Error fetching progress:', error);
          return;
        }

        if (data) {
          setProgressData(data);
          
          // Add new log entry if step changed
          if (data.current_step) {
            const timestamp = new Date().toLocaleTimeString();
            const logMessage = `[${timestamp}] ${data.current_step}`;
            
            setLogs(prev => {
              const lastLog = prev[prev.length - 1];
              if (!lastLog || !lastLog.includes(data.current_step)) {
                return [...prev, logMessage].slice(-20); // Keep last 20 logs
              }
              return prev;
            });
          }

          // Check completion status
          if (data.status === 'completed') {
            setIsCompleted(true);
            clearInterval(pollInterval);
            
            // Trigger completion callback
            setTimeout(() => {
              onComplete?.({ 
                sessionId: data.session_id, 
                totalResults: data.results_so_far,
                completedAt: data.updated_at 
              });
            }, 1000);
          } else if (data.status === 'error') {
            setHasError(true);
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    };

    // Initial poll
    pollProgress();
    
    // Poll every 2 seconds
    pollInterval = setInterval(pollProgress, 2000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [open, sessionId, onComplete]);

  // Real-time subscription for instant updates
  useEffect(() => {
    if (!open || !sessionId) return;

    const channel = supabase
      .channel('mining-progress')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mining_progress',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newData = payload.new as ProgressRecord;
          setProgressData(newData);
          
          if (newData.current_step) {
            const timestamp = new Date().toLocaleTimeString();
            const logMessage = `[${timestamp}] ${newData.current_step}`;
            
            setLogs(prev => {
              const lastLog = prev[prev.length - 1];
              if (!lastLog || !lastLog.includes(newData.current_step)) {
                return [...prev, logMessage].slice(-20);
              }
              return prev;
            });
          }

          if (newData.status === 'completed') {
            setIsCompleted(true);
          } else if (newData.status === 'error') {
            setHasError(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, sessionId]);

  const getStatusIcon = () => {
    if (hasError) return <XCircle className="h-5 w-5 text-red-500" />;
    if (isCompleted) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
  };

  const getStatusBadge = () => {
    if (hasError) return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    if (isCompleted) return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
  };

  const progress = progressData?.progress_percentage || 0;
  const currentStep = progressData?.current_step || 'Initializing...';
  const totalResults = progressData?.results_so_far || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Enhanced Lead Mining Progress
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="text-sm text-muted-foreground">{currentStep}</div>
          </div>

          {/* Results Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{totalResults}</div>
                  <div className="text-sm text-muted-foreground">Results Found</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {progressData?.status === 'completed' ? '4/4' : 
                     progressData?.status === 'error' ? 'Failed' : 
                     `${Math.floor(progress / 25)}/4`}
                  </div>
                  <div className="text-sm text-muted-foreground">Steps Completed</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mining Steps */}
            <div className="space-y-4">
              <h3 className="font-semibold">Mining Steps</h3>
              <div className="space-y-3">
                {[
                  { name: 'Web Search', description: 'Finding company websites', icon: <Search className="h-4 w-4" />, range: [0, 25] },
                  { name: 'LinkedIn Discovery', description: 'Extracting LinkedIn profiles', icon: <Building className="h-4 w-4" />, range: [25, 50] },
                  { name: 'AI Enrichment', description: 'Filling data gaps with AI', icon: <Brain className="h-4 w-4" />, range: [50, 85] },
                  { name: 'Contact Discovery', description: 'Finding key decision makers', icon: <Users className="h-4 w-4" />, range: [85, 100] }
                ].map((step, index) => {
                  const isActive = progress >= step.range[0] && progress < step.range[1];
                  const isCompleted = progress >= step.range[1];
                  const isError = hasError && isActive;
                  
                  return (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          {step.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{step.name}</span>
                            <Badge className={
                              isError ? 'bg-red-100 text-red-800' :
                              isCompleted ? 'bg-green-100 text-green-800' :
                              isActive ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-600'
                            }>
                              {isError ? 'error' : isCompleted ? 'completed' : isActive ? 'running' : 'pending'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {step.description}
                          </div>
                          {isActive && !isError && (
                            <Progress value={((progress - step.range[0]) / (step.range[1] - step.range[0])) * 100} className="h-1" />
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {isError ? <XCircle className="h-4 w-4 text-red-500" /> :
                           isCompleted ? <CheckCircle className="h-4 w-4 text-green-500" /> :
                           isActive ? <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> :
                           <Clock className="h-4 w-4 text-gray-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Logs */}
            <div className="space-y-4">
              <h3 className="font-semibold">Live Activity Log</h3>
              <ScrollArea className="h-64">
                <div className="space-y-1 font-mono text-xs">
                  {logs.length === 0 ? (
                    <div className="p-2 bg-muted/50 rounded text-muted-foreground">
                      Waiting for updates...
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="p-2 bg-muted/50 rounded text-muted-foreground">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Error Message */}
          {hasError && progressData?.error_message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Mining Failed</span>
              </div>
              <div className="text-xs text-red-600 mt-1">
                {progressData.error_message}
              </div>
            </div>
          )}

          {/* Warning/Info Messages */}
          {!isCompleted && !hasError && (
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
