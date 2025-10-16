import Paho from 'paho-mqtt';
import { EventEmitter } from 'eventemitter3';

// MQTT Broker Types
export type BrokerType = 'local' | 'cloud';

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
  type: BrokerType;
}

// Broker Configurations
export interface BrokerConfigurations {
  local: MqttConfig;
  cloud: MqttConfig;
  current: BrokerType;
}

// Broker Configurations
const BROKER_CONFIGS: BrokerConfigurations = {
  local: {
    host: '192.168.0.100', // Local broker with bridge
    port: 9001, // MQTT port (listener 1883)
    clientId: `smart-home-${Math.random().toString(16).substr(2, 8)}`,
    username: 'detpos',
    password: 'asdffdsa',
    useSSL: false,
    keepAlive: 60,
    cleanSession: true,
    type: 'local',
  },
  cloud: {
    host: 'f6ce8c16ab1f4b958a2179d249d62bf3.s2.eu.hivemq.cloud',
    port: 8884, // MQTT over SSL (matches bridge config)
    clientId: `smart-home-${Math.random().toString(16).substr(2, 8)}`,
    username: 'smart',
    password: 'Asdffdsa-4580',
    useSSL: true,
    keepAlive: 60,
    cleanSession: true,
    type: 'cloud',
  },
  current: 'local', // Default to local, will be switched based on availability
};

// Default MQTT Configuration (for backward compatibility)
const DEFAULT_MQTT_CONFIG: MqttConfig = { ...BROKER_CONFIGS.local };

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

// MQTT Bridge Status
export type MqttBridgeStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'switching'
  | 'error';

// Centralized MQTT Service
export interface MqttServiceAPI {
  getConfig(): MqttConfig;
  getBrokerConfigs(): BrokerConfigurations;
  updateConfig(newConfig: Partial<MqttConfig>): void;
  switchToBroker(brokerType: BrokerType): Promise<boolean>;
  getCurrentBroker(): BrokerType;
  getStatus(): MqttBridgeStatus;
  isConnected(): boolean;
  connect(): Promise<boolean>;
  disconnect(): void;
  testConnection(host?: string, port?: number): Promise<boolean>;
  testBrokerConnection(brokerType: BrokerType): Promise<boolean>;
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
  let brokerConfigs: BrokerConfigurations = { ...BROKER_CONFIGS };
  let currentBroker: BrokerType = brokerConfigs.current;
  let config: MqttConfig = { ...brokerConfigs[currentBroker] };
  let status: MqttBridgeStatus = 'disconnected';
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectInterval = 5000;
  const subscribedTopics = new Set<string>();
  const emitter = new EventEmitter<MqttServiceEvents>();

  const setStatus = (newStatus: MqttBridgeStatus) => {
    if (status !== newStatus) {
      status = newStatus;
      emitter.emit('statusChanged', status as any);
    }
  };

  const isConnected = () =>
    status === 'connected' && (client?.isConnected() || false);

  const attemptReconnect = () => {
    setStatus('connecting');
    reconnectAttempts++;
    setTimeout(() => {
      if (status === 'connecting') {
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

  // Test connection to a specific broker
  const testBrokerConnection = async (
    brokerType: BrokerType
  ): Promise<boolean> => {
    const brokerConfig = brokerConfigs[brokerType];
    return new Promise<boolean>((resolve) => {
      let timeoutId: ReturnType<typeof setTimeout>;

      try {
        const testClient = new Paho.Client(
          brokerConfig.host,
          brokerConfig.port,
          `test-${Date.now()}`
        );

        const testOptions: Paho.ConnectionOptions = {
          timeout: 3, // Reduced timeout to 3 seconds
          onSuccess: () => {
            clearTimeout(timeoutId);
            testClient.disconnect();
            resolve(true);
          },
          onFailure: (error) => {
            clearTimeout(timeoutId);
            console.log(
              `Broker test failed for ${brokerType}:`,
              error.errorMessage
            );
            resolve(false);
          },
          userName: brokerConfig.username,
          password: brokerConfig.password,
          useSSL: brokerConfig.useSSL,
          cleanSession: true,
        };

        // Set a timeout to ensure we don't wait too long
        timeoutId = setTimeout(() => {
          console.log(`Broker test timeout for ${brokerType}`);
          resolve(false);
        }, 4000); // 4 second timeout

        testClient.connect(testOptions);
      } catch (error) {
        console.error(`Broker test failed for ${brokerType}:`, error);
        resolve(false);
      }
    });
  };

  // Switch to a different broker
  const switchToBroker = async (brokerType: BrokerType): Promise<boolean> => {
    if (currentBroker === brokerType) {
      return isConnected();
    }

    console.log(`Switching from ${currentBroker} to ${brokerType} broker`);
    setStatus('switching');

    try {
      // Disconnect current connection
      if (client && client.isConnected()) {
        client.disconnect();
      }

      // Update configuration
      currentBroker = brokerType;
      config = { ...brokerConfigs[brokerType] };

      // Test new broker before switching
      const isReachable = await testBrokerConnection(brokerType);
      if (!isReachable) {
        console.warn(
          `Broker ${brokerType} is not reachable, but will attempt connection`
        );
      }

      // Attempt connection to new broker
      const connected = await api.connect();
      if (connected) {
        console.log(`Successfully switched to ${brokerType} broker`);
        return true;
      } else {
        console.error(`Failed to connect to ${brokerType} broker`);
        return false;
      }
    } catch (error) {
      console.error(`Error switching to ${brokerType} broker:`, error);
      setStatus('error');
      return false;
    }
  };

  // Auto-detect best available broker
  const detectBestBroker = async (): Promise<BrokerType> => {
    console.log('Detecting best available MQTT broker...');

    // Import network detector to check if we're on the same subnet
    const { networkDetector } = require('../utils/networkDetection');
    const networkInfo = await networkDetector.getNetworkInfo();

    console.log('Network info:', networkInfo);

    // Only try local broker if we're on the same subnet (192.168.0.x)
    if (networkInfo.isLocalNetwork) {
      console.log(
        'On home network (192.168.0.x), testing local broker first...'
      );
      const localAvailable = await testBrokerConnection('local');
      if (localAvailable) {
        console.log('✅ Local broker (192.168.0.100) is reachable');
        return 'local';
      }
      console.log(
        '❌ Local broker (192.168.0.100) not reachable, switching to cloud broker...'
      );
    } else {
      console.log(
        'On different network, skipping local broker test, using cloud broker...'
      );
    }

    // Test cloud broker as fallback
    const cloudAvailable = await testBrokerConnection('cloud');
    if (cloudAvailable) {
      console.log('✅ Cloud broker is available');
      return 'cloud';
    }

    console.warn('❌ No brokers are reachable, defaulting to cloud');
    return 'cloud';
  };

  const api: MqttServiceAPI = {
    getConfig: () => ({ ...config }),
    getBrokerConfigs: () => ({ ...brokerConfigs }),
    updateConfig: (newConfig) => {
      config = { ...config, ...newConfig };
      if (isConnected()) {
        api.disconnect();
        setTimeout(() => api.connect(), 1000);
      }
    },
    switchToBroker,
    getCurrentBroker: () => currentBroker,
    getStatus: () => status,
    isConnected,
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
            timeout: 5,
            onSuccess: () => {
              testClient.disconnect();
              resolve(true);
            },
            onFailure: () => {
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
    testBrokerConnection,
    connect: async () => {
      if (isConnected()) {
        return true;
      }

      try {
        // Detect best broker before setting status
        console.log('Starting broker detection...');
        const bestBroker = await detectBestBroker();
        console.log(
          `Selected broker: ${bestBroker}, current broker: ${currentBroker}`
        );

        if (bestBroker !== currentBroker) {
          console.log(`Auto-switching to ${bestBroker} broker`);
          await switchToBroker(bestBroker);
        }

        setStatus('connecting');
        console.log(
          `Attempting to connect to ${currentBroker} broker: ${config.host}:${config.port}`
        );

        const clientId = `${config.clientId}-${Date.now()}`;
        client = new Paho.Client(config.host, config.port, clientId);

        return new Promise<boolean>((resolve, reject) => {
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

          if (client) {
            client.onMessageArrived = (message: Paho.Message) => {
              console.log(
                `📥 Received MQTT message - Topic: ${message.destinationName}, Message: ${message.payloadString}`
              );
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
          }

          try {
            if (client) {
              client.connect(options);
            }
          } catch (error) {
            setStatus('error');
            emitter.emit('error', error);
            reject(error);
          }
        });
      } catch (error) {
        console.error('MQTT connection error:', error);
        setStatus('error');
        return false;
      }
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
        console.log(
          `📤 Publishing MQTT message - Topic: ${topic}, Message: ${message}, QoS: ${qos}`
        );
        const mqttMessage = new Paho.Message(message);
        mqttMessage.destinationName = topic;
        mqttMessage.qos = qos;
        mqttMessage.retained = retained;
        client?.send(mqttMessage);
        console.log(`✅ MQTT message sent successfully`);
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error publishing MQTT message:', error);
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
