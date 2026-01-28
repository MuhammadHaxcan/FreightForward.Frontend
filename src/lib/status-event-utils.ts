import { StatusEventType } from '@/services/api/shipment';

export interface EventTypeOption {
  value: StatusEventType;
  label: string;
  icon: string;
  color: string;
  showVesselFields: boolean;
}

export const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { value: 'GateOutEmpty', label: 'Gate Out Empty', icon: 'Package', color: 'text-blue-500', showVesselFields: false },
  { value: 'GateIn', label: 'Gate In', icon: 'Package', color: 'text-blue-600', showVesselFields: false },
  { value: 'LoadOnVessel', label: 'Load on Vessel', icon: 'Ship', color: 'text-cyan-500', showVesselFields: true },
  { value: 'VesselDeparture', label: 'Vessel Departure', icon: 'Ship', color: 'text-cyan-600', showVesselFields: true },
  { value: 'VesselArrival', label: 'Vessel Arrival', icon: 'Ship', color: 'text-cyan-700', showVesselFields: true },
  { value: 'Discharge', label: 'Discharge', icon: 'Ship', color: 'text-teal-500', showVesselFields: true },
  { value: 'OnRail', label: 'On Rail', icon: 'Train', color: 'text-orange-500', showVesselFields: false },
  { value: 'OffRail', label: 'Off Rail', icon: 'Train', color: 'text-orange-600', showVesselFields: false },
  { value: 'CustomsClearance', label: 'Customs Clearance', icon: 'FileCheck', color: 'text-purple-500', showVesselFields: false },
  { value: 'Delivered', label: 'Delivered', icon: 'CheckCircle', color: 'text-green-500', showVesselFields: false },
  { value: 'EmptyContainerReturn', label: 'Empty Container Return', icon: 'Truck', color: 'text-gray-500', showVesselFields: false },
  { value: 'Other', label: 'Other', icon: 'Clock', color: 'text-gray-600', showVesselFields: false },
];

export const getEventTypeOption = (eventType: StatusEventType): EventTypeOption | undefined => {
  return EVENT_TYPE_OPTIONS.find(opt => opt.value === eventType);
};

export const getEventTypeLabel = (eventType: StatusEventType): string => {
  return getEventTypeOption(eventType)?.label ?? eventType;
};

export const getEventTypeIcon = (eventType: StatusEventType): string => {
  return getEventTypeOption(eventType)?.icon ?? 'Clock';
};

export const getEventTypeColor = (eventType: StatusEventType): string => {
  return getEventTypeOption(eventType)?.color ?? 'text-gray-500';
};

export const shouldShowVesselFields = (eventType: StatusEventType): boolean => {
  return getEventTypeOption(eventType)?.showVesselFields ?? false;
};

export const formatEventDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatEventDateOnly = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatEventTimeOnly = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
