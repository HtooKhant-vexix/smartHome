import Paho from 'paho-mqtt';
import { EventEmitter } from 'eventemitter3';

// Centralized MQTT Configuration
export interface MqttConfig {
  host: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  useSSL?: boolean;
  keepAlive?: number;
  cleanSession?: boolean;
}

// Default MQTT Configuration
const DEFAULT_MQTT_CONFIG: MqttConfig = {
  host: '192.168.0.100',
  // host: '192.168.1.146',
  port: 9001,
  clientId: `smart-home-${Math.random().toString(16).substr(2, 8)}`,
  username: 'detpos',
  password: 'asdffdsa',
  useSSL: false,
  keepAlive: 60,
  cleanSession: true,
};

// MQTT Message Interface
export interface MqttMessage {
  topic: string;
  payload: string;
  qos?: number;
  retained?: boolean;
}

// MQTT Connection Status
export type MqttConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

// MQTT Service Events
export interface MqttServiceEvents {
  connected: () => void;
  disconnected: () => void;
  message: (topic: string, message: string) => void;
  error: (error: any) => void;
  statusChanged: (status: MqttConnectionStatus) => void;
}

// Centralized MQTT Service
export interface MqttServiceAPI {
  getConfig(): MqttConfig;
  updateConfig(newConfig: Partial<MqttConfig>): void;
  getStatus(): MqttConnectionStatus;
  isConnected(): boolean;
  connect(): Promise<boolean>;
  disconnect(): void;
  testConnection(host?: string, port?: number): Promise<boolean>;
  publish(
    topic: string,
    message: string,
    qos?: Paho.Qos,
    retained?: boolean
  ): boolean;
  publishJson(
    topic: string,
    data: any,
    qos?: Paho.Qos,
    retained?: boolean
  ): boolean;
  subscribe(topic: string, qos?: Paho.Qos): boolean;
  unsubscribe(topic: string): boolean;
  getSubscribedTopics(): string[];
  subscribeWithCallback(
    topic: string,
    callback: (data: any) => void,
    qos?: Paho.Qos
  ): boolean;
  on<E extends keyof MqttServiceEvents>(
    event: E,
    listener: MqttServiceEvents[E]
  ): this;
  off<E extends keyof MqttServiceEvents>(
    event: E,
    listener: MqttServiceEvents[E]
  ): this;
}

function createService(
  initialConfig: MqttConfig = DEFAULT_MQTT_CONFIG
): MqttServiceAPI {
  let client: Paho.Client | null = null;
  let config: MqttConfig = { ...DEFAULT_MQTT_CONFIG, ...initialConfig };
  let status: MqttConnectionStatus = 'disconnected';
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectInterval = 5000;
  const subscribedTopics = new Set<string>();
  const emitter = new EventEmitter<MqttServiceEvents>();

  const setStatus = (newStatus: MqttConnectionStatus) => {
    if (status !== newStatus) {
      status = newStatus;
      emitter.emit('statusChanged', status);
    }
  };

  const isConnected = () =>
    status === 'connected' && (client?.isConnected() || false);

  const attemptReconnect = () => {
    setStatus('reconnecting');
    reconnectAttempts++;
    setTimeout(() => {
      if (status === 'reconnecting') {
        api.connect().catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Reconnection attempt failed:', error);
          if (reconnectAttempts >= maxReconnectAttempts) {
            setStatus('error');
            emitter.emit(
              'error',
              new Error('Max reconnection attempts reached')
            );
          }
        });
      }
    }, reconnectInterval);
  };

  const api: MqttServiceAPI = {
    getConfig: () => ({ ...config }),
    updateConfig: (newConfig) => {
      config = { ...config, ...newConfig };
      if (isConnected()) {
        api.disconnect();
        setTimeout(() => api.connect(), 1000);
      }
    },
    getStatus: () => status,
    isConnected,
    connect: () => {
      return new Promise<boolean>((resolve, reject) => {
        if (isConnected()) {
          resolve(true);
          return;
        }
        try {
          setStatus('connecting');
          const clientId = `${config.clientId}-${Date.now()}`;
          client = new Paho.Client(config.host, config.port, clientId);

          const options: Paho.ConnectionOptions = {
            timeout: 30, // Connection timeout in seconds
            onSuccess: () => {
              setStatus('connected');
              reconnectAttempts = 0;
              emitter.emit('connected');
              subscribedTopics.forEach((topic) => client?.subscribe(topic));
              resolve(true);
            },
            onFailure: (error: Paho.ErrorWithInvocationContext) => {
              console.error(
                'MQTT Connection failed:',
                error.errorMessage || error
              );
              setStatus('error');
              emitter.emit('error', error);
              reject(
                new Error(
                  `MQTT Connection failed: ${
                    error.errorMessage || 'Unknown error'
                  }`
                )
              );
            },
            userName: config.username,
            password: config.password,
            useSSL: config.useSSL || false,
            keepAliveInterval: config.keepAlive || 60,
            cleanSession: config.cleanSession || true,
            reconnect: true, // Enable automatic reconnection
          };

          client.onMessageArrived = (message: Paho.Message) => {
            emitter.emit(
              'message',
              message.destinationName,
              message.payloadString
            );
          };

          client.onConnectionLost = (responseObject: Paho.MQTTError) => {
            console.warn(
              'MQTT Connection lost:',
              responseObject.errorMessage || 'Unknown reason'
            );
            setStatus('disconnected');
            emitter.emit('disconnected');

            // Only attempt reconnection if we haven't exceeded max attempts
            if (reconnectAttempts < maxReconnectAttempts) {
              console.log(
                `Attempting MQTT reconnection (${
                  reconnectAttempts + 1
                }/${maxReconnectAttempts})`
              );
              attemptReconnect();
            } else {
              console.error('MQTT max reconnection attempts reached');
              setStatus('error');
              emitter.emit(
                'error',
                new Error('Max reconnection attempts reached')
              );
            }
          };

          client.connect(options);
        } catch (error) {
          setStatus('error');
          emitter.emit('error', error);
          reject(error);
        }
      });
    },
    disconnect: () => {
      if (client) {
        client.disconnect();
        client = null;
      }
      setStatus('disconnected');
      reconnectAttempts = 0;
    },
    publish: (topic, message, qos: Paho.Qos = 1, retained = false) => {
      if (!isConnected()) {
        // eslint-disable-next-line no-console
        console.warn('MQTT not connected. Cannot publish message.');
        return false;
      }
      try {
        const mqttMessage = new Paho.Message(message);
        mqttMessage.destinationName = topic;
        mqttMessage.qos = qos;
        mqttMessage.retained = retained;
        client?.send(mqttMessage);
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error publishing MQTT message:', error);
        emitter.emit('error', error);
        return false;
      }
    },
    publishJson: (topic, data, qos: Paho.Qos = 1, retained = false) => {
      try {
        const jsonString = JSON.stringify(data);
        return api.publish(topic, jsonString, qos, retained);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error publishing JSON data:', error);
        emitter.emit('error', error);
        return false;
      }
    },
    subscribe: (topic, qos: Paho.Qos = 1) => {
      if (!isConnected()) {
        // eslint-disable-next-line no-console
        console.warn('MQTT not connected. Cannot subscribe to topic.');
        return false;
      }
      try {
        client?.subscribe(topic, { qos });
        subscribedTopics.add(topic);
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error subscribing to MQTT topic:', error);
        emitter.emit('error', error);
        return false;
      }
    },
    unsubscribe: (topic) => {
      if (!isConnected()) {
        // eslint-disable-next-line no-console
        console.warn('MQTT not connected. Cannot unsubscribe from topic.');
        return false;
      }
      try {
        client?.unsubscribe(topic);
        subscribedTopics.delete(topic);
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error unsubscribing from MQTT topic:', error);
        emitter.emit('error', error);
        return false;
      }
    },
    getSubscribedTopics: () => Array.from(subscribedTopics),
    subscribeWithCallback: (topic, callback, qos: Paho.Qos = 1) => {
      if (!api.subscribe(topic, qos)) {
        return false;
      }
      const messageHandler = (messageTopic: string, message: string) => {
        if (messageTopic === topic) {
          try {
            const data = JSON.parse(message);
            callback(data);
          } catch (_e) {
            callback(message);
          }
        }
      };
      emitter.on('message', messageHandler);
      return true;
    },
    // Event API passthrough
    on: (event: any, listener: any) => {
      emitter.on(event, listener as any);
      return api as any;
    },
    off: (event: any, listener: any) => {
      emitter.off(event, listener as any);
      return api as any;
    },
    testConnection: async (host?: string, port?: number) => {
      const testHost = host || config.host;
      const testPort = port || config.port;

      try {
        return new Promise<boolean>((resolve) => {
          const testClient = new Paho.Client(
            testHost,
            testPort,
            `test-${Date.now()}`
          );

          const testOptions: Paho.ConnectionOptions = {
            timeout: 5, // Short timeout for testing
            onSuccess: () => {
              testClient.disconnect();
              resolve(true);
            },
            onFailure: (error) => {
              console.warn(
                'MQTT test connection failed:',
                error.errorMessage || error
              );
              resolve(false);
            },
            cleanSession: true,
          };

          testClient.connect(testOptions);
        });
      } catch (error) {
        console.error('MQTT connection test error:', error);
        return false;
      }
    },
  };

  return api;
}

// Export singleton instance
export const mqttService = createService();

// Export utility functions
export const createMqttService = (config?: MqttConfig): MqttServiceAPI => {
  return createService(config || DEFAULT_MQTT_CONFIG);
};

// Export default configuration
export { DEFAULT_MQTT_CONFIG };
