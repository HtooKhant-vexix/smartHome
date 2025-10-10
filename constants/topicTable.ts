export const topics: Record<string, number> = {
  'relay/1': 0x0001,
  'sensor/temp': 0x0002,
  'client/status': 0x0003,
  'alert/buzzer': 0x0004,
  'office/ac/control': 0x0005,
  'tcp/test': 0x0006,
};

// Centralized topic helpers for MQTT scheme
export const TOPIC_BASE = {
  location: 'room1',
  controller: 'light_control',
  acBase: 'room1/ac',
} as const;

export const topicHelpers = {
  switchSet: (
    deviceKey: 'light_switch' | 'AC_switch' | 'socket_switch' | 'rgb_light'
  ) => `${TOPIC_BASE.location}/${TOPIC_BASE.controller}/${deviceKey}/set`,
  switchState: (
    deviceKey: 'light_switch' | 'AC_switch' | 'socket_switch' | 'rgb_light'
  ) => `${TOPIC_BASE.location}/${TOPIC_BASE.controller}/${deviceKey}/state`,
  acCmnd: (suffix: string) => `${TOPIC_BASE.acBase}/cmnd/${suffix}`,
  acStat: (suffix: string) => `${TOPIC_BASE.acBase}/stat/${suffix}`,
  acTele: (suffix: string) => `${TOPIC_BASE.acBase}/tele/${suffix}`,
};
