import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface MiningProgressProps {
  sessionId: string;
  operationType: string;
  onComplete?: (results: any) => void;
}

interface ProgressData {
  id: string;
  status: string;
  progress_percentage: number;
  current_step: string;
  total_steps: number;
  results_so_far: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export function MiningProgressTracker({ sessionId, operationType, onComplete }: MiningProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('mining_progress')
          .select('*')
          .eq('session_id', sessionId)
          .eq('operation_type', operationType)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching progress:', error);
          return;
        }

        if (data) {
          setProgress(data);
          setIsLoading(false);

          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
            if (data.status === 'completed' && onComplete) {
              onComplete({ 
                sessionId, 
                results: data.results_so_far,
                completedAt: data.completed_at 
              });
            }
          }
        }
      } catch (error) {
        console.error('Progress fetch error:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchProgress();

    // Set up polling for real-time updates
    interval = setInterval(fetchProgress, 2000);

    // Set up real-time subscription
    const subscription = supabase
      .channel('mining_progress_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mining_progress',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Progress update received:', payload);
          if (payload.new) {
            setProgress(payload.new as ProgressData);
            setIsLoading(false);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [sessionId, operationType, onComplete]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s`;
    const diffMins = Math.floor(diffSecs / 60);
    return `${diffMins}m ${diffSecs % 60}s`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            No progress data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getStatusIcon(progress.status)}
            {operationType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </CardTitle>
          <Badge className={getStatusColor(progress.status)}>
            {progress.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress.progress_percentage}%</span>
          </div>
          <Progress value={progress.progress_percentage} className="h-2" />
        </div>

        {/* Current Step */}
        {progress.current_step && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Current Step:</div>
            <div className="text-sm text-muted-foreground">{progress.current_step}</div>
          </div>
        )}

        {/* Results and Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">Results Found</div>
            <div className="text-2xl font-bold text-primary">{progress.results_so_far}</div>
          </div>
          {progress.total_steps > 0 && (
            <div>
              <div className="font-medium">Steps</div>
              <div className="text-muted-foreground">
                {Math.floor((progress.progress_percentage / 100) * progress.total_steps)} / {progress.total_steps}
              </div>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Duration:</span>
          <span>{formatDuration(progress.started_at, progress.completed_at)}</span>
        </div>

        {/* Error Message */}
        {progress.error_message && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm font-medium text-red-800">Error:</div>
            <div className="text-sm text-red-600 mt-1">{progress.error_message}</div>
          </div>
        )}

        {/* Completion Message */}
        {progress.status === 'completed' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm font-medium text-green-800">
              ✅ Operation completed successfully!
            </div>
            <div className="text-sm text-green-600 mt-1">
              Found {progress.results_so_far} results in {formatDuration(progress.started_at, progress.completed_at)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}