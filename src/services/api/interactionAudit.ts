import { fetchApi } from './base';
import type { OfficeInteractionAuditEventRequest } from '../../types/auth';

export const interactionAuditApi = {
  postOfficeInteractionEvent: (payload: OfficeInteractionAuditEventRequest) =>
    fetchApi<void>('/audit/interactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
