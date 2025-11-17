import {
  LOCAL_MQTT_HOST,
  LOCAL_MQTT_PORT,
  LOCAL_MQTT_USERNAME,
  LOCAL_MQTT_PASSWORD,
  LOCAL_MQTT_CLIENT_ID_PREFIX,
  LOCAL_MQTT_USE_SSL,
  LOCAL_MQTT_KEEP_ALIVE,
  CLOUD_MQTT_HOST,
  CLOUD_MQTT_PORT,
  CLOUD_MQTT_USERNAME,
  CLOUD_MQTT_PASSWORD,
  CLOUD_MQTT_CLIENT_ID_PREFIX,
  CLOUD_MQTT_USE_SSL,
  CLOUD_MQTT_KEEP_ALIVE,
  LOCAL_BROKER_IP,
  LOCAL_NETWORK_SSIDS,
  LOCAL_NETWORK_SUBNETS,
  TOPIC_BASE_LOCATION,
  TOPIC_BASE_CLOUD_LOCATION,
  TOPIC_CONTROLLER,
  TOPIC_AC_BASE,
  APP_NAME,
  APP_VERSION,
  STORAGE_KEY,
  DEBUG_MQTT,
  DEBUG_NETWORK,
} from '@env';

// MQTT Configuration
export const mqttConfig = {
  local: {
    host: LOCAL_MQTT_HOST,
    port: parseInt(LOCAL_MQTT_PORT, 10),
    username: LOCAL_MQTT_USERNAME,
    password: LOCAL_MQTT_PASSWORD,
    clientIdPrefix: LOCAL_MQTT_CLIENT_ID_PREFIX,
    useSSL: LOCAL_MQTT_USE_SSL === 'true',
    keepAlive: parseInt(LOCAL_MQTT_KEEP_ALIVE, 10),
  },
  cloud: {
    host: CLOUD_MQTT_HOST,
    port: parseInt(CLOUD_MQTT_PORT, 10),
    username: CLOUD_MQTT_USERNAME,
    password: CLOUD_MQTT_PASSWORD,
    clientIdPrefix: CLOUD_MQTT_CLIENT_ID_PREFIX,
    useSSL: CLOUD_MQTT_USE_SSL === 'true',
    keepAlive: parseInt(CLOUD_MQTT_KEEP_ALIVE, 10),
  },
};

// Network Configuration
export const networkConfig = {
  localBrokerIP: LOCAL_BROKER_IP,
  localNetworkSSIDs: LOCAL_NETWORK_SSIDS.split(',').map((s) => s.trim()),
  localNetworkSubnets: LOCAL_NETWORK_SUBNETS.split(',').map((s) => s.trim()),
};

// Topic Configuration
export const topicConfig = {
  baseLocation: TOPIC_BASE_LOCATION,
  baseCloudLocation: TOPIC_BASE_CLOUD_LOCATION,
  controller: TOPIC_CONTROLLER,
  acBase: TOPIC_AC_BASE,
};

// App Configuration
export const appConfig = {
  name: APP_NAME,
  version: APP_VERSION,
  storageKey: STORAGE_KEY,
};

// Debug Configuration
export const debugConfig = {
  mqtt: DEBUG_MQTT === 'true',
  network: DEBUG_NETWORK === 'true',
};
