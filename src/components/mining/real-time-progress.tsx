
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
  AlertTriangle,
  StopCircle,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useErrorRecovery } from '@/hooks/use-error-recovery';
import { useAPIRateLimiter } from '@/hooks/use-api-rate-limiter';

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
  const [isCancelling, setIsCancelling] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  
  const { toast } = useToast();
  const { recoverSession, cleanupOldSessions, retryAttempts, isRecovering: errorRecovering } = useErrorRecovery();
  const { getAPIHealth, apiUsage } = useAPIRateLimiter();

  // Real-time subscription for instant updates
  useEffect(() => {
    if (!open || !sessionId) return;

    console.log('Setting up real-time subscription for session:', sessionId);

    const channel = supabase
      .channel(`mining-progress-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mining_progress',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          const newData = payload.new as ProgressRecord;
          
          if (newData) {
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
              setTimeout(() => {
                onComplete?.({ 
                  sessionId: newData.session_id, 
                  totalResults: newData.results_so_far,
                  completedAt: newData.updated_at 
                });
              }, 1000);
            } else if (newData.status === 'failed' || newData.status === 'error') {
              setHasError(true);
            } else if (newData.status === 'cancelled') {
              setIsCancelling(false);
              setHasError(true);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [open, sessionId, onComplete]);

  // Poll for progress updates as backup
  useEffect(() => {
    if (!open || !sessionId) return;

    let pollInterval: NodeJS.Timeout;

    const pollProgress = async () => {
      try {
        console.log('Polling progress for session:', sessionId);
        
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
          console.log('Polled progress data:', data);
          setProgressData(data);
          
          // Add new log entry if step changed
          if (data.current_step) {
            const timestamp = new Date().toLocaleTimeString();
            const logMessage = `[${timestamp}] ${data.current_step}`;
            
            setLogs(prev => {
              const lastLog = prev[prev.length - 1];
              if (!lastLog || !lastLog.includes(data.current_step)) {
                return [...prev, logMessage].slice(-20);
              }
              return prev;
            });
          }

          // Check completion status
          if (data.status === 'completed') {
            setIsCompleted(true);
            clearInterval(pollInterval);
            
            setTimeout(() => {
              onComplete?.({ 
                sessionId: data.session_id, 
                totalResults: data.results_so_far,
                completedAt: data.updated_at 
              });
            }, 1000);
          } else if (data.status === 'failed' || data.status === 'error') {
            setHasError(true);
            clearInterval(pollInterval);
          } else if (data.status === 'cancelled') {
            setIsCancelling(false);
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

    // Set up timeout for mining sessions (10 minutes max)
    const timeoutTimer = setTimeout(() => {
      if (!isCompleted && !hasError) {
        console.warn(`[${sessionId}] Mining session timed out after 10 minutes`);
        setSessionTimeout(true);
        setHasError(true);
        clearInterval(pollInterval);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutTimer);
    };
  }, [open, sessionId, onComplete, isCompleted, hasError]);

  // Cancel mining session
  const handleCancelMining = async () => {
    if (isCancelling || isCompleted || hasError) return;

    setIsCancelling(true);
    
    try {
      console.log(`Cancelling mining session: ${sessionId}`);
      
      const { error } = await supabase
        .from('mining_progress')
        .update({ 
          status: 'cancelled',
          error_message: 'Cancelled by user',
          current_step: 'Mining cancelled by user',
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('Error cancelling mining session:', error);
        toast({
          title: "Cancellation Failed",
          description: "Could not cancel the mining session. Please try again.",
          variant: "destructive",
        });
        setIsCancelling(false);
      } else {
        toast({
          title: "Mining Cancelled",
          description: "The mining session has been cancelled successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to cancel mining:', error);
      toast({
        title: "Cancellation Error", 
        description: "An unexpected error occurred while cancelling.",
        variant: "destructive",
      });
      setIsCancelling(false);
    }
  };

  // Recover stuck session
  const handleRecoverSession = async () => {
    setIsRecovering(true);
    
    try {
      const success = await recoverSession(sessionId);
      
      if (success) {
        toast({
          title: "Session Recovered",
          description: "The stuck mining session has been reset successfully.",
        });
        
        // Reset state to allow new mining
        setHasError(false);
        setSessionTimeout(false);
        setProgressData(null);
        setLogs([]);
      } else {
        toast({
          title: "Recovery Failed",
          description: "Could not recover the session. Please try starting a new mining operation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Session recovery error:', error);
      toast({
        title: "Recovery Error",
        description: "An error occurred while recovering the session.",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  // Cleanup old sessions on component mount
  useEffect(() => {
    if (open) {
      cleanupOldSessions();
    }
  }, [open, cleanupOldSessions]);

  const getStatusIcon = () => {
    if (hasError) return <XCircle className="h-5 w-5 text-red-500" />;
    if (isCompleted) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (isCancelling) return <StopCircle className="h-5 w-5 text-orange-500" />;
    return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
  };

  const getStatusBadge = () => {
    if (sessionTimeout) return <Badge className="bg-orange-100 text-orange-800">Timeout</Badge>;
    if (progressData?.status === 'cancelled') return <Badge className="bg-orange-100 text-orange-800">Cancelled</Badge>;
    if (hasError) return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    if (isCompleted) return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    if (isCancelling) return <Badge className="bg-orange-100 text-orange-800">Cancelling</Badge>;
    return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
  };

  const progress = progressData?.progress_percentage || 0;
  const currentStep = progressData?.current_step || 'Waiting for updates...';
  const totalResults = progressData?.results_so_far || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              Enhanced Lead Mining Progress
              {getStatusBadge()}
            </div>
            {!isCompleted && !hasError && !isCancelling && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelMining}
                className="text-red-600 hover:text-red-700"
              >
                <StopCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Info */}
          <div className="text-xs text-muted-foreground font-mono">
            Session ID: {sessionId}
          </div>

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
                  { name: 'LinkedIn Discovery', description: 'Enhanced LinkedIn profile search', icon: <Building className="h-4 w-4" />, range: [25, 65] },
                  { name: 'AI Enrichment', description: 'Filling data gaps with AI', icon: <Brain className="h-4 w-4" />, range: [65, 85] },
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
                      Waiting for updates from session {sessionId}...
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

          {/* Error/Status Messages */}
          {hasError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center justify-between text-red-800">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {sessionTimeout ? 'Mining Timed Out' : 
                     progressData?.status === 'cancelled' ? 'Mining Cancelled' : 'Mining Failed'}
                  </span>
                </div>
                {(sessionTimeout || progressData?.status === 'failed') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecoverSession}
                    disabled={isRecovering}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    {isRecovering ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Recovering...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Recover Session
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="text-xs text-red-600 mt-1">
                {sessionTimeout ? 'The mining session exceeded the 10-minute limit and was stopped.' :
                 progressData?.error_message || 'An unexpected error occurred during mining.'}
              </div>
              {retryAttempts[sessionId] > 0 && (
                <div className="text-xs text-red-500 mt-1 font-mono">
                  Retry attempts: {retryAttempts[sessionId]}
                </div>
              )}
            </div>
          )}

          {isCancelling && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-center gap-2 text-orange-800">
                <StopCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Cancelling Mining Session...</span>
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Please wait while we stop the mining process safely.
              </div>
            </div>
          )}

          {/* Warning/Info Messages */}
          {!isCompleted && !hasError && !isCancelling && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 text-blue-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Mining in progress - do not close this window
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-1">
                This process may take 2-5 minutes depending on the number of results and API response times.
                You can cancel the process at any time using the Cancel button above.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
