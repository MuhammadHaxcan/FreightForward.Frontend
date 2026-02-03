import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { officesApi } from '../../services/api/systemAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Loader2, FileText, CheckCircle2, XCircle } from 'lucide-react';
import type { OfficeAuditLog, OfficeListItem } from '../../types/auth';
import SystemLayout from '../../components/system/SystemLayout';

export default function AuditLogsList() {
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('all');
  const [limit, setLimit] = useState<number>(100);

  const { data: offices } = useQuery({
    queryKey: ['offices'],
    queryFn: async () => {
      const result = await officesApi.getAll();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', selectedOfficeId, limit],
    queryFn: async () => {
      const officeId = selectedOfficeId !== 'all' ? parseInt(selectedOfficeId) : undefined;
      const result = await officesApi.getAuditLogs(officeId, limit);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (action.includes('Created') || action.includes('Success')) return 'default';
    if (action.includes('Failed') || action.includes('Deleted')) return 'destructive';
    if (action.includes('Deactivated')) return 'secondary';
    return 'outline';
  };

  const formatAction = (action: string): string => {
    // Convert PascalCase to Title Case with spaces
    return action.replace(/([A-Z])/g, ' $1').trim();
  };

  if (isLoading) {
    return (
      <SystemLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </SystemLayout>
    );
  }

  return (
    <SystemLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">Track system activity and changes</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by office" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Offices</SelectItem>
                {offices?.map((office: OfficeListItem) => (
                  <SelectItem key={office.id} value={office.id.toString()}>
                    {office.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 logs</SelectItem>
                <SelectItem value="100">100 logs</SelectItem>
                <SelectItem value="250">250 logs</SelectItem>
                <SelectItem value="500">500 logs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <CardDescription>
              {auditLogs?.length || 0} log entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs?.map((log: OfficeAuditLog) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.isSuccess ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="truncate" title={log.description}>
                          {log.description}
                        </div>
                        {log.errorMessage && (
                          <div className="text-xs text-red-600 mt-1 truncate" title={log.errorMessage}>
                            Error: {log.errorMessage}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.officeName || (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>{log.performedBy}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SystemLayout>
  );
}
