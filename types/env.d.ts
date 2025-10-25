declare module '@env' {
  export const LOCAL_MQTT_HOST: string;
  export const LOCAL_MQTT_PORT: string;
  export const LOCAL_MQTT_USERNAME: string;
  export const LOCAL_MQTT_PASSWORD: string;
  export const LOCAL_MQTT_CLIENT_ID_PREFIX: string;
  export const LOCAL_MQTT_USE_SSL: string;
  export const LOCAL_MQTT_KEEP_ALIVE: string;

  export const CLOUD_MQTT_HOST: string;
  export const CLOUD_MQTT_PORT: string;
  export const CLOUD_MQTT_USERNAME: string;
  export const CLOUD_MQTT_PASSWORD: string;
  export const CLOUD_MQTT_CLIENT_ID_PREFIX: string;
  export const CLOUD_MQTT_USE_SSL: string;
  export const CLOUD_MQTT_KEEP_ALIVE: string;

  export const LOCAL_BROKER_IP: string;
  export const LOCAL_NETWORK_SSIDS: string;
  export const LOCAL_NETWORK_SUBNETS: string;

  export const TOPIC_BASE_LOCATION: string;
  export const TOPIC_BASE_CLOUD_LOCATION: string;
  export const TOPIC_CONTROLLER: string;
  export const TOPIC_AC_BASE: string;

  export const APP_NAME: string;
  export const APP_VERSION: string;
  export const STORAGE_KEY: string;

  export const DEBUG_MQTT: string;
  export const DEBUG_NETWORK: string;
}
