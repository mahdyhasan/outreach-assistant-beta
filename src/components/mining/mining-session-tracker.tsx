
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, Play, Trash2 } from 'lucide-react';

interface MiningSession {
  session_id: string;
  operation_type: string;
  status: string;
  progress_percentage: number;
  current_step: string;
  results_so_far: number;
  error_message: string | null;
  started_at: string;
  updated_at: string;
}

export function MiningSessionTracker() {
  const [sessions, setSessions] = useState<MiningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('mining_progress')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupOldSessions = async () => {
    try {
      const { error } = await supabase
        .from('mining_progress')
        .delete()
        .lt('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error cleaning up sessions:', error);
        toast({
          title: "Error",
          description: "Failed to cleanup old sessions",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Old sessions cleaned up successfully",
      });
      
      fetchSessions();
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('mining-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mining_progress'
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mining Sessions</CardTitle>
          <CardDescription>Recent mining operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading sessions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mining Sessions</CardTitle>
            <CardDescription>Recent mining operations and their status</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={cleanupOldSessions}>
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup Old
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No mining sessions found
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.session_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(session.status)}
                      <span className="font-medium text-sm">
                        {session.session_id.split('_')[1] ? 
                          new Date(parseInt(session.session_id.split('_')[1])).toLocaleString() :
                          'Unknown'
                        }
                      </span>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress: {session.progress_percentage}%</span>
                      <span>Results: {session.results_so_far}</span>
                    </div>
                    
                    <Progress value={session.progress_percentage} className="h-1" />
                    
                    <div className="text-xs text-muted-foreground">
                      {session.current_step || 'No current step'}
                    </div>
                    
                    {session.error_message && (
                      <div className="text-xs text-red-600 bg-red-50 p-1 rounded">
                        {session.error_message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
