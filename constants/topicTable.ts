import {
  TOPIC_BASE_LOCATION,
  TOPIC_BASE_CLOUD_LOCATION,
  TOPIC_CONTROLLER,
  TOPIC_AC_BASE,
} from '@env';

export const topics: Record<string, number> = {
  'relay/1': 0x0001,
  'sensor/temp': 0x0002,
  'client/status': 0x0003,
  'alert/buzzer': 0x0004,
  'office/ac/control': 0x0005,
  'tcp/test': 0x0006,
};

// Centralized topic helpers for MQTT scheme
// Bridge configuration: topic local/room1/# out 1 and topic cloud/room1/# in 1
// This means local broker uses local/room1/... and cloud broker uses cloud/room1/...
export const TOPIC_BASE = {
  location: TOPIC_BASE_LOCATION,
  cloudLocation: TOPIC_BASE_CLOUD_LOCATION,
  controller: TOPIC_CONTROLLER,
  acBase: TOPIC_AC_BASE,
} as const;

export const topicHelpers = {
  switchSet: (
    deviceKey: 'light_switch' | 'AC_switch' | 'socket_switch' | 'rgb_light',
    useCloud = false
  ) =>
    useCloud
      ? `${TOPIC_BASE.cloudLocation}/${TOPIC_BASE.controller}/${deviceKey}/set`
      : `${TOPIC_BASE.location}/${TOPIC_BASE.controller}/${deviceKey}/set`,
  switchState: (
    deviceKey: 'light_switch' | 'AC_switch' | 'socket_switch' | 'rgb_light',
    useCloud = false
  ) =>
    useCloud
      ? `${TOPIC_BASE.cloudLocation}/${TOPIC_BASE.controller}/${deviceKey}/state`
      : `${TOPIC_BASE.location}/${TOPIC_BASE.controller}/${deviceKey}/state`,
  acCmnd: (suffix: string, useCloud = false) =>
    useCloud
      ? `cloud/${TOPIC_BASE.acBase}/cmnd/${suffix}`
      : `${TOPIC_BASE.acBase}/cmnd/${suffix}`,
  acStat: (suffix: string, useCloud = false) =>
    useCloud
      ? `cloud/${TOPIC_BASE.acBase}/stat/${suffix}`
      : `${TOPIC_BASE.acBase}/stat/${suffix}`,
  acTele: (suffix: string, useCloud = false) =>
    useCloud
      ? `cloud/${TOPIC_BASE.acBase}/tele/${suffix}`
      : `${TOPIC_BASE.acBase}/tele/${suffix}`,
};
