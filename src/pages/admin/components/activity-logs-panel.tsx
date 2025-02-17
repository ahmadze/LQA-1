import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ActivityLog } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ActivityLogsPanel() {
  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/admin/activity-logs"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Activity Logs</h2>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.timestamp), "PPp")}
                  </TableCell>
                  <TableCell>{log.userId || "System"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.entityType}
                    {log.entityId ? ` (#${log.entityId})` : ""}
                  </TableCell>
                  <TableCell>
                    <pre className="text-xs whitespace-pre-wrap">
                      {log.metadata ? JSON.stringify(log.metadata, null, 2) : "N/A"}
                    </pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
