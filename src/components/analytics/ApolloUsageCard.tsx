import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useApolloUsage } from "@/hooks/use-apollo-usage";

export function ApolloUsageCard() {
  const { usage, loading, refetch } = useApolloUsage();

  if (loading && !usage) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Apollo API Usage</CardTitle>
          <RefreshCw className="h-4 w-4 animate-spin" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading usage data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Apollo API Usage</CardTitle>
          <Button variant="ghost" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Unable to load usage data</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (usage.percentage_used > 90) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else if (usage.percentage_used > 80) {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusColor = () => {
    if (usage.percentage_used > 90) return "bg-red-500";
    if (usage.percentage_used > 80) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Apollo Contact Reveals</CardTitle>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold">
          {usage.contact_reveals_used.toLocaleString()} / {usage.contact_reveals_limit.toLocaleString()}
        </div>
        <Progress 
          value={usage.percentage_used} 
          className="w-full h-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{usage.percentage_used}% used</span>
          <span>{usage.credits_remaining.toLocaleString()} remaining</span>
        </div>
        <CardDescription>
          Monthly Apollo contact reveal usage. Each KDM discovery with verified email costs 1 credit.
        </CardDescription>
      </CardContent>
    </Card>
  );
}