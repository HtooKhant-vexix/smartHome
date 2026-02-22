type MaybeString = string | undefined | null;

const safeGetEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const readEnv = (key: string, fallback?: string): string => {
  const expoKey = `EXPO_PUBLIC_${key}`;
  const candidates: MaybeString[] = [
    safeGetEnv(expoKey),
    safeGetEnv(key),
    // Fallbacks for web/metro globals
    (globalThis as any)?.[expoKey],
    (globalThis as any)?.[key],
  ];

  const value = candidates.find(
    (candidate) =>
      candidate !== undefined && candidate !== null && candidate !== ''
  );

  if (value !== undefined && value !== null) {
    return String(value);
  }

  if (fallback !== undefined) {
    return fallback;
  }

  console.warn(
    `[env] Missing value for ${expoKey}. Set it in your .env file or provide a fallback.`
  );
  return '';
};

const toNumber = (value: string, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string, fallback = false): boolean => {
  if (value === '') {
    return fallback;
  }
  return value.toLowerCase() === 'true';
};

const toList = (value: string, fallback: string[] = []): string[] => {
  if (!value) {
    return fallback;
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const rawEnv = {
  LOCAL_MQTT_HOST: readEnv('LOCAL_MQTT_HOST', '192.168.0.100'),
  LOCAL_MQTT_PORT: readEnv('LOCAL_MQTT_PORT', '9001'),
  LOCAL_MQTT_USERNAME: readEnv('LOCAL_MQTT_USERNAME', 'detpos'),
  LOCAL_MQTT_PASSWORD: readEnv('LOCAL_MQTT_PASSWORD', 'asdffdsa'),
  LOCAL_MQTT_CLIENT_ID_PREFIX: readEnv(
    'LOCAL_MQTT_CLIENT_ID_PREFIX',
    'smart-home'
  ),
  LOCAL_MQTT_USE_SSL: readEnv('LOCAL_MQTT_USE_SSL', 'false'),
  LOCAL_MQTT_KEEP_ALIVE: readEnv('LOCAL_MQTT_KEEP_ALIVE', '30'),
  CLOUD_MQTT_HOST: readEnv(
    'CLOUD_MQTT_HOST',
    'f6ce8c16ab1f4b958a2179d249d62bf3.s2.eu.hivemq.cloud'
  ),
  CLOUD_MQTT_PORT: readEnv('CLOUD_MQTT_PORT', '8884'),
  CLOUD_MQTT_USERNAME: readEnv('CLOUD_MQTT_USERNAME', 'smart'),
  CLOUD_MQTT_PASSWORD: readEnv('CLOUD_MQTT_PASSWORD', 'Asdffdsa-4580'),
  CLOUD_MQTT_CLIENT_ID_PREFIX: readEnv(
    'CLOUD_MQTT_CLIENT_ID_PREFIX',
    'smart-home'
  ),
  CLOUD_MQTT_USE_SSL: readEnv('CLOUD_MQTT_USE_SSL', 'true'),
  CLOUD_MQTT_KEEP_ALIVE: readEnv('CLOUD_MQTT_KEEP_ALIVE', '30'),
  LOCAL_BROKER_IP: readEnv('LOCAL_BROKER_IP', '192.168.0.100'),
  LOCAL_NETWORK_SSIDS: readEnv(
    'LOCAL_NETWORK_SSIDS',
    'POS_SERVER_OLD,pos_server_old,POS_SERVER,home,local'
  ),
  LOCAL_NETWORK_SUBNETS: readEnv(
    'LOCAL_NETWORK_SUBNETS',
    '192.168.0,10.0,172.16'
  ),
  TOPIC_BASE_LOCATION: readEnv('TOPIC_BASE_LOCATION', 'local/room1'),
  TOPIC_BASE_CLOUD_LOCATION: readEnv(
    'TOPIC_BASE_CLOUD_LOCATION',
    'cloud/room1'
  ),
  TOPIC_CONTROLLER: readEnv('TOPIC_CONTROLLER', 'light_control'),
  TOPIC_AC_BASE: readEnv('TOPIC_AC_BASE', 'local/room1/ac'),
  APP_NAME: readEnv('APP_NAME', 'Sixth Kendra Smart Home App'),
  APP_VERSION: readEnv('APP_VERSION', '1.0.0'),
  STORAGE_KEY: readEnv('STORAGE_KEY', 'smart-home-storage'),
  DEBUG_MQTT: readEnv('DEBUG_MQTT', 'false'),
  DEBUG_NETWORK: readEnv('DEBUG_NETWORK', 'false'),
};

export const env = rawEnv;

// MQTT Configuration
export const mqttConfig = {
  local: {
    host: rawEnv.LOCAL_MQTT_HOST,
    port: toNumber(rawEnv.LOCAL_MQTT_PORT, 9001),
    username: rawEnv.LOCAL_MQTT_USERNAME || undefined,
    password: rawEnv.LOCAL_MQTT_PASSWORD || undefined,
    clientIdPrefix: rawEnv.LOCAL_MQTT_CLIENT_ID_PREFIX,
    useSSL: toBoolean(rawEnv.LOCAL_MQTT_USE_SSL),
    keepAlive: toNumber(rawEnv.LOCAL_MQTT_KEEP_ALIVE, 30),
  },
  cloud: {
    host: rawEnv.CLOUD_MQTT_HOST,
    port: toNumber(rawEnv.CLOUD_MQTT_PORT, 8884),
    username: rawEnv.CLOUD_MQTT_USERNAME || undefined,
    password: rawEnv.CLOUD_MQTT_PASSWORD || undefined,
    clientIdPrefix: rawEnv.CLOUD_MQTT_CLIENT_ID_PREFIX,
    useSSL: toBoolean(rawEnv.CLOUD_MQTT_USE_SSL, true),
    keepAlive: toNumber(rawEnv.CLOUD_MQTT_KEEP_ALIVE, 30),
  },
} as const;

// Network Configuration
export const networkConfig = {
  localBrokerIP: rawEnv.LOCAL_BROKER_IP,
  localNetworkSSIDs: toList(rawEnv.LOCAL_NETWORK_SSIDS),
  localNetworkSubnets: toList(rawEnv.LOCAL_NETWORK_SUBNETS),
} as const;

// Topic Configuration
export const topicConfig = {
  baseLocation: rawEnv.TOPIC_BASE_LOCATION,
  baseCloudLocation: rawEnv.TOPIC_BASE_CLOUD_LOCATION,
  controller: rawEnv.TOPIC_CONTROLLER,
  acBase: rawEnv.TOPIC_AC_BASE,
} as const;

// App Configuration
export const appConfig = {
  name: rawEnv.APP_NAME,
  version: rawEnv.APP_VERSION,
  storageKey: rawEnv.STORAGE_KEY,
} as const;

// Debug Configuration
export const debugConfig = {
  mqtt: toBoolean(rawEnv.DEBUG_MQTT),
  network: toBoolean(rawEnv.DEBUG_NETWORK),
} as const;
