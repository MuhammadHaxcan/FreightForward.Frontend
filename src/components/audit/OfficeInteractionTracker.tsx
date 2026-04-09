import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { interactionAuditApi } from '../../services/api/interactionAudit';
import type { OfficeInteractionAuditEventRequest, OfficeInteractionEventType } from '../../types/auth';

interface OfficeInteractionTrackerProps {
  isAuthenticated: boolean;
  officeSlug: string | null;
}

interface DialogAuditStateDetail {
  open: boolean;
  title?: string;
}

const SESSION_STORAGE_KEY = 'ff_office_interaction_audit_session_id';

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function getSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const next = createId();
  sessionStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

function sanitize(value: string | null | undefined, maxLength: number): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.slice(0, maxLength);
}

function normalizeTargetId(value: string | null | undefined): string | undefined {
  const sanitized = sanitize(value, 120);
  if (!sanitized) {
    return undefined;
  }

  const tabIdMatch = sanitized.match(/-trigger-([a-z0-9-]+)$/i);
  if (tabIdMatch?.[1]) {
    return sanitize(tabIdMatch[1], 120);
  }

  if (sanitized.startsWith('radix-') || /^:r[a-z0-9]+:/i.test(sanitized)) {
    return undefined;
  }

  return sanitized;
}

function getElementLabel(element: HTMLElement): string | undefined {
  const custom = element.getAttribute('data-audit-label');
  if (custom) return sanitize(custom, 300);

  const aria = element.getAttribute('aria-label');
  if (aria) return sanitize(aria, 300);

  return sanitize(element.textContent, 300);
}

function buildRoute(pathname: string, search: string): string {
  return sanitize(`${pathname}${search}`, 500) ?? pathname;
}

function getRouteEntity(route: string): { entityType?: string; entityId?: string } {
  const shipmentMatch = route.match(/^\/shipments\/(\d+)/i);
  if (shipmentMatch?.[1]) {
    return {
      entityType: 'Shipment',
      entityId: shipmentMatch[1],
    };
  }

  const customerMatch = route.match(/^\/master-customers\/(\d+)/i);
  if (customerMatch?.[1]) {
    return {
      entityType: 'Customer',
      entityId: customerMatch[1],
    };
  }

  const payrollMatch = route.match(/^\/hr\/payroll\/(\d+)/i);
  if (payrollMatch?.[1]) {
    return {
      entityType: 'Payroll',
      entityId: payrollMatch[1],
    };
  }

  const quotationMatch = route.match(/^\/sales\/quotations\/(\d+)/i);
  if (quotationMatch?.[1]) {
    return {
      entityType: 'Quotation',
      entityId: quotationMatch[1],
    };
  }

  return {};
}

function inferEntityType(element: HTMLElement, targetLabel?: string): string | undefined {
  const explicit = sanitize(element.getAttribute('data-audit-entity'), 120);
  if (explicit) {
    return explicit;
  }

  const label = (targetLabel ?? '').toLowerCase();
  if (label.includes('party')) return 'ShipmentParty';
  if (label.includes('costing')) return 'ShipmentCosting';
  if (label.includes('invoice')) return 'ShipmentInvoice';
  if (label.includes('container')) return 'ShipmentContainer';

  return undefined;
}

function inferEventType(element: HTMLElement): OfficeInteractionEventType {
  const role = element.getAttribute('role');
  const trackType = element.getAttribute('data-audit-track');
  const tag = element.tagName.toLowerCase();
  const inNavigation = !!element.closest('nav, [role="navigation"], [data-audit-track="nav"]');
  const isMenuInteraction = role === 'menuitem' || role === 'menuitemcheckbox' || role === 'menuitemradio';

  if (role === 'tab' || trackType === 'tab') {
    return 'TabOpened';
  }

  if (trackType === 'nav' || tag === 'a' || inNavigation || isMenuInteraction) {
    return 'NavigationClicked';
  }

  if (trackType === 'action') {
    return 'ActionAttempted';
  }

  return 'ButtonClicked';
}

export default function OfficeInteractionTracker({
  isAuthenticated,
  officeSlug,
}: OfficeInteractionTrackerProps) {
  const location = useLocation();
  const previousRouteRef = useRef<string>('');
  const sessionId = useMemo(() => getSessionId(), []);

  const postEvent = (payload: OfficeInteractionAuditEventRequest) => {
    void interactionAuditApi.postOfficeInteractionEvent(payload);
  };

  useEffect(() => {
    if (!isAuthenticated || !officeSlug) {
      return;
    }

    const route = buildRoute(location.pathname, location.search);
    if (previousRouteRef.current === route) {
      return;
    }

    previousRouteRef.current = route;
    postEvent({
      eventType: 'RouteOpened',
      route,
      targetType: 'route',
      targetLabel: sanitize(document.title, 300),
      sessionId,
      correlationId: createId(),
    });
  }, [isAuthenticated, location.pathname, location.search, officeSlug, sessionId]);

  useEffect(() => {
    if (!isAuthenticated || !officeSlug) {
      return;
    }

    const onClick = (event: MouseEvent) => {
      const node = event.target as HTMLElement | null;
      if (!node) {
        return;
      }

      const element = node.closest<HTMLElement>(
        'button, a, [role="button"], [role="tab"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [data-audit-track]',
      );
      if (!element) {
        return;
      }

      if (element.getAttribute('data-audit-ignore') === 'true') {
        return;
      }

      const route = buildRoute(location.pathname, location.search);
      const eventType = inferEventType(element);
      const tag = element.tagName.toLowerCase();
      const href = tag === 'a' ? (element.getAttribute('href') ?? undefined) : undefined;
      const targetLabel = getElementLabel(element);
      const inferredEntityType = inferEntityType(element, targetLabel);
      const routeEntity = getRouteEntity(route);

      postEvent({
        eventType,
        route,
        targetType: sanitize(element.getAttribute('data-audit-track') ?? element.getAttribute('role') ?? tag, 40),
        targetId: normalizeTargetId(
          element.getAttribute('data-audit-id')
            ?? element.id
            ?? element.getAttribute('name')
            ?? element.getAttribute('aria-controls')
            ?? href,
        ),
        targetLabel,
        entityType: inferredEntityType ?? routeEntity.entityType,
        entityId: routeEntity.entityId,
        entityReference: inferredEntityType ? targetLabel : undefined,
        sessionId,
        correlationId: createId(),
      });
    };

    const onSubmit = (event: Event) => {
      const submitEvent = event as SubmitEvent;
      const form = submitEvent.target as HTMLFormElement | null;
      if (!form) {
        return;
      }

      const submitter = submitEvent.submitter as HTMLElement | null;
      const route = buildRoute(location.pathname, location.search);
      const routeEntity = getRouteEntity(route);
      const submitLabel = submitter ? getElementLabel(submitter) : undefined;

      postEvent({
        eventType: 'ActionAttempted',
        route,
        targetType: 'form',
        targetId: normalizeTargetId(
          form.getAttribute('data-audit-id')
            ?? form.id
            ?? form.getAttribute('name')
            ?? submitter?.getAttribute('data-audit-id')
            ?? submitter?.id
            ?? submitter?.getAttribute('name'),
        ),
        targetLabel: sanitize(
          form.getAttribute('data-audit-label')
            ?? submitLabel
            ?? form.getAttribute('aria-label')
            ?? 'Form Submit',
          300,
        ),
        entityType: routeEntity.entityType,
        entityId: routeEntity.entityId,
        sessionId,
        correlationId: createId(),
      });
    };

    const onDialogState = (event: Event) => {
      const custom = event as CustomEvent<DialogAuditStateDetail>;
      const detail = custom.detail;
      if (!detail) {
        return;
      }

      const route = buildRoute(location.pathname, location.search);
      const currentTitle = sanitize(
        detail.title ?? document.querySelector('[data-audit-dialog-title]')?.textContent ?? undefined,
        300,
      );

      postEvent({
        eventType: detail.open ? 'ModalOpened' : 'ModalClosed',
        route,
        targetType: 'modal',
        targetLabel: currentTitle,
        sessionId,
        correlationId: createId(),
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const node = event.target as HTMLElement | null;
      if (!node) {
        return;
      }

      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
        return;
      }

      const tabElement = node.closest<HTMLElement>('[role="tab"], [data-audit-track="tab"]');
      if (!tabElement) {
        return;
      }

      const route = buildRoute(location.pathname, location.search);
      postEvent({
        eventType: 'TabOpened',
        route,
        targetType: sanitize(tabElement.getAttribute('data-audit-track') ?? tabElement.getAttribute('role') ?? 'tab', 40),
        targetId: sanitize(
          tabElement.getAttribute('data-audit-id')
            ?? tabElement.id
            ?? tabElement.getAttribute('name')
            ?? tabElement.getAttribute('aria-controls'),
          120,
        ),
        targetLabel: getElementLabel(tabElement),
        sessionId,
        correlationId: createId(),
      });
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('ff:dialog-state', onDialogState as EventListener);

    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('ff:dialog-state', onDialogState as EventListener);
    };
  }, [isAuthenticated, location.pathname, location.search, officeSlug, sessionId]);

  return null;
}
