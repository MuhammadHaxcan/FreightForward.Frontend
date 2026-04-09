import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { officesApi } from '../../services/api/systemAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Loader2, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type {
  OfficeAuditLog,
  OfficeInteractionAuditLog,
  OfficeListItem,
  OfficeInteractionEventType,
  OfficeInteractionOutcomeStatus,
} from '../../types/auth';
import SystemLayout from '../../components/system/SystemLayout';

const INTERACTION_EVENT_TYPES: OfficeInteractionEventType[] = [
  'RouteOpened',
  'NavigationClicked',
  'ButtonClicked',
  'TabOpened',
  'ModalOpened',
  'ModalClosed',
  'ActionAttempted',
];

const OUTCOME_FILTERS: Array<OfficeInteractionOutcomeStatus> = [
  'Succeeded',
  'Failed',
  'ValidationFailed',
  'Unauthorized',
  'Canceled',
];

const ROUTE_PREFIX_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Modules' },
  { value: '/shipments', label: 'Shipments' },
  { value: '/accounts', label: 'Accounts' },
  { value: '/hr', label: 'HR' },
  { value: '/sales', label: 'Sales' },
  { value: '/master-customers', label: 'Master Customer' },
];

function formatAction(action: string): string {
  return action.replace(/([A-Z])/g, ' $1').trim();
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function toIso(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function normalizeTargetId(targetId?: string): string | undefined {
  if (!targetId) {
    return undefined;
  }

  const trimmed = targetId.trim();
  if (!trimmed) {
    return undefined;
  }

  const tabIdMatch = trimmed.match(/-trigger-([a-z0-9-]+)$/i);
  if (tabIdMatch?.[1]) {
    return tabIdMatch[1];
  }

  if (trimmed.startsWith('radix-') || /^:r[a-z0-9]+:/i.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function formatTarget(log: OfficeInteractionAuditLog): string {
  const targetId = normalizeTargetId(log.targetId);
  return [log.targetType, log.targetLabel, targetId].filter(Boolean).join(' | ') || '-';
}

function getOutcomeBadgeVariant(outcome?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const normalized = (outcome ?? '').toLowerCase();
  if (normalized === 'failed' || normalized === 'validationfailed') {
    return 'destructive';
  }

  if (normalized === 'unauthorized' || normalized === 'canceled') {
    return 'outline';
  }

  return 'secondary';
}

export default function AuditLogsList() {
  const [activeTab, setActiveTab] = useState<'master' | 'office'>('master');

  const [masterOfficeId, setMasterOfficeId] = useState<string>('all');
  const [masterLimit, setMasterLimit] = useState<number>(100);

  const [interactionOfficeId, setInteractionOfficeId] = useState<string>('none');
  const [interactionEventType, setInteractionEventType] = useState<string>('all');
  const [interactionOutcomeStatus, setInteractionOutcomeStatus] = useState<string>('all');
  const [interactionRoutePrefix, setInteractionRoutePrefix] = useState<string>('all');
  const [interactionUsername, setInteractionUsername] = useState<string>('');
  const [interactionFrom, setInteractionFrom] = useState<string>('');
  const [interactionTo, setInteractionTo] = useState<string>('');
  const [interactionPageNumber, setInteractionPageNumber] = useState<number>(1);
  const [interactionPageSize, setInteractionPageSize] = useState<number>(50);
  const [selectedInteraction, setSelectedInteraction] = useState<OfficeInteractionAuditLog | null>(null);

  const { data: offices } = useQuery({
    queryKey: ['offices'],
    queryFn: async () => {
      const result = await officesApi.getAll();
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
  });

  const { data: masterLogs, isLoading: masterLoading } = useQuery({
    queryKey: ['audit-logs-master', masterOfficeId, masterLimit],
    queryFn: async () => {
      const officeId = masterOfficeId !== 'all' ? parseInt(masterOfficeId, 10) : undefined;
      const result = await officesApi.getAuditLogs(officeId, masterLimit);
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
  });

  const interactionEnabled = interactionOfficeId !== 'none';
  const interactionOfficeNumericId = interactionEnabled ? parseInt(interactionOfficeId, 10) : 0;
  const interactionEventTypeFilter = interactionEventType !== 'all' ? interactionEventType : undefined;
  const interactionOutcomeStatusFilter = interactionOutcomeStatus !== 'all' ? interactionOutcomeStatus : undefined;
  const interactionRoutePrefixFilter = interactionRoutePrefix !== 'all' ? interactionRoutePrefix : undefined;
  const interactionUsernameFilter = interactionUsername.trim() || undefined;
  const interactionFromIso = toIso(interactionFrom);
  const interactionToIso = toIso(interactionTo);

  const { data: interactionLogsPage, isLoading: interactionLoading } = useQuery({
    queryKey: [
      'audit-logs-office-interaction',
      interactionOfficeId,
      interactionEventTypeFilter,
      interactionOutcomeStatusFilter,
      interactionRoutePrefixFilter,
      interactionUsernameFilter,
      interactionFromIso,
      interactionToIso,
      interactionPageNumber,
      interactionPageSize,
    ],
    enabled: interactionEnabled,
    queryFn: async () => {
      const result = await officesApi.getOfficeInteractionLogs({
        officeId: interactionOfficeNumericId,
        pageNumber: interactionPageNumber,
        pageSize: interactionPageSize,
        eventType: interactionEventTypeFilter,
        outcomeStatus: interactionOutcomeStatusFilter,
        routePrefix: interactionRoutePrefixFilter,
        username: interactionUsernameFilter,
        from: interactionFromIso,
        to: interactionToIso,
      });

      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  const officeNameById = useMemo(() => {
    const map = new Map<number, string>();
    (offices ?? []).forEach((office: OfficeListItem) => map.set(office.id, office.name));
    return map;
  }, [offices]);

  const selectedOfficeName = interactionEnabled
    ? officeNameById.get(interactionOfficeNumericId) ?? `Office #${interactionOfficeNumericId}`
    : undefined;

  const resetInteractionPage = () => setInteractionPageNumber(1);

  return (
    <SystemLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Master activity and deep office interaction timeline</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'master' | 'office')}>
          <TabsList className="grid w-full grid-cols-2 max-w-xl">
            <TabsTrigger value="master">Master Activity</TabsTrigger>
            <TabsTrigger value="office">Office Interaction</TabsTrigger>
          </TabsList>

          <TabsContent value="master" className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={masterOfficeId} onValueChange={setMasterOfficeId}>
                <SelectTrigger className="w-[220px]">
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

              <Select
                value={masterLimit.toString()}
                onValueChange={(value) => setMasterLimit(parseInt(value, 10))}
              >
                <SelectTrigger className="w-[140px]">
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Master Activity
                </CardTitle>
                <CardDescription>{masterLogs?.length ?? 0} log entries</CardDescription>
              </CardHeader>
              <CardContent>
                {masterLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
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
                      {(masterLogs ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No master audit logs found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        (masterLogs ?? []).map((log: OfficeAuditLog) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {log.isSuccess ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{formatAction(log.action)}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[320px]">
                              <div className="truncate" title={log.description}>{log.description}</div>
                              {log.errorMessage && (
                                <div className="text-xs text-red-600 mt-1 truncate" title={log.errorMessage}>
                                  Error: {log.errorMessage}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{log.officeName ?? <span className="text-muted-foreground">System</span>}</TableCell>
                            <TableCell>{log.performedBy}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDateTime(log.timestamp)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="office" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Office Interaction
                </CardTitle>
                <CardDescription>
                  Deep interaction events per office schema. Select an office to load data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-8 gap-3">
                  <Select
                    value={interactionOfficeId}
                    onValueChange={(value) => {
                      setInteractionOfficeId(value);
                      setSelectedInteraction(null);
                      resetInteractionPage();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select office" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select office</SelectItem>
                      {offices?.map((office: OfficeListItem) => (
                        <SelectItem key={office.id} value={office.id.toString()}>
                          {office.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={interactionEventType}
                    onValueChange={(value) => {
                      setInteractionEventType(value);
                      resetInteractionPage();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {INTERACTION_EVENT_TYPES.map((eventType) => (
                        <SelectItem key={eventType} value={eventType}>
                          {formatAction(eventType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={interactionOutcomeStatus}
                    onValueChange={(value) => {
                      setInteractionOutcomeStatus(value);
                      resetInteractionPage();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Outcomes</SelectItem>
                      {OUTCOME_FILTERS.map((outcomeStatus) => (
                        <SelectItem key={outcomeStatus} value={outcomeStatus}>
                          {formatAction(outcomeStatus)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={interactionRoutePrefix}
                    onValueChange={(value) => {
                      setInteractionRoutePrefix(value);
                      resetInteractionPage();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Module" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTE_PREFIX_FILTERS.map((entry) => (
                        <SelectItem key={entry.value} value={entry.value}>
                          {entry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Username"
                    value={interactionUsername}
                    onChange={(event) => {
                      setInteractionUsername(event.target.value);
                      resetInteractionPage();
                    }}
                  />

                  <Input
                    type="datetime-local"
                    value={interactionFrom}
                    onChange={(event) => {
                      setInteractionFrom(event.target.value);
                      resetInteractionPage();
                    }}
                  />

                  <Input
                    type="datetime-local"
                    value={interactionTo}
                    onChange={(event) => {
                      setInteractionTo(event.target.value);
                      resetInteractionPage();
                    }}
                  />

                  <Select
                    value={interactionPageSize.toString()}
                    onValueChange={(value) => {
                      setInteractionPageSize(parseInt(value, 10));
                      resetInteractionPage();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Page size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                      <SelectItem value="100">100 / page</SelectItem>
                      <SelectItem value="250">250 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!interactionEnabled ? (
                  <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                    Select a specific office to load interaction audit events.
                  </div>
                ) : interactionLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">
                      {(interactionLogsPage?.totalCount ?? 0).toLocaleString()} events for {selectedOfficeName}
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Outcome</TableHead>
                          <TableHead>Occurred At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(interactionLogsPage?.items ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No interaction logs found for the selected filters.
                            </TableCell>
                          </TableRow>
                        ) : (
                          (interactionLogsPage?.items ?? []).map((log) => (
                            <TableRow
                              key={log.id}
                              className="cursor-pointer"
                              onClick={() => setSelectedInteraction(log)}
                            >
                              <TableCell>
                                <Badge variant="outline">{formatAction(log.eventType)}</Badge>
                              </TableCell>
                              <TableCell className="max-w-[280px]">
                                <div className="truncate" title={log.route}>{log.route}</div>
                              </TableCell>
                              <TableCell className="max-w-[220px]">
                                <div className="truncate" title={formatTarget(log)}>
                                  {formatTarget(log)}
                                </div>
                              </TableCell>
                              <TableCell>{log.username}</TableCell>
                              <TableCell>
                                {log.outcome ? (
                                  <div className="space-y-1">
                                    <Badge variant={getOutcomeBadgeVariant(log.outcome)}>
                                      {log.outcome}
                                    </Badge>
                                    {log.outcomeMessage && (
                                      <div className="max-w-[200px] truncate text-xs text-muted-foreground" title={log.outcomeMessage}>
                                        {log.outcomeMessage}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{formatDateTime(log.occurredAt)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Page {interactionLogsPage?.pageNumber ?? interactionPageNumber} of {interactionLogsPage?.totalPages ?? 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={(interactionLogsPage?.pageNumber ?? interactionPageNumber) <= 1}
                          onClick={() => setInteractionPageNumber((current) => Math.max(1, current - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={(interactionLogsPage?.hasNextPage ?? false) === false}
                          onClick={() => setInteractionPageNumber((current) => current + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {selectedInteraction && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                  <CardDescription>Read-only metadata for selected interaction event</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Event:</span> {formatAction(selectedInteraction.eventType)}</div>
                    <div><span className="text-muted-foreground">User:</span> {selectedInteraction.username}</div>
                    <div><span className="text-muted-foreground">Route:</span> {selectedInteraction.route}</div>
                    <div><span className="text-muted-foreground">Target:</span> {formatTarget(selectedInteraction)}</div>
                    <div><span className="text-muted-foreground">Outcome:</span> {selectedInteraction.outcome ?? '-'}</div>
                    <div><span className="text-muted-foreground">Occurred:</span> {formatDateTime(selectedInteraction.occurredAt)}</div>
                  </div>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                    {JSON.stringify(selectedInteraction, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SystemLayout>
  );
}
