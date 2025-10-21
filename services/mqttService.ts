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

// Circuit Breaker States
export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

// Broker Health Information
export interface BrokerHealth {
  state: CircuitBreakerState;
  failureCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  nextRetryTime: number;
}

// Error Classification
export enum MqttErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface MqttError {
  type: MqttErrorType;
  message: string;
  timestamp: number;
  brokerType: BrokerType;
  retryable: boolean;
}

// Centralized MQTT Service
export interface MqttServiceAPI {
  getConfig(): MqttConfig;
  getBrokerConfigs(): BrokerConfigurations;
  getBrokerHealth(): Record<BrokerType, BrokerHealth>;
  resetCircuitBreaker(brokerType?: BrokerType): void;
  getConnectionStatus(): {
    isConnected: boolean;
    currentBroker: BrokerType;
    status: MqttBridgeStatus;
    brokerHealth: Record<BrokerType, BrokerHealth>;
    reconnectAttempts: number;
  };
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

// Circuit Breaker Configuration
const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3, // Open circuit after 3 failures
  recoveryTimeout: 60000, // Wait 60 seconds before half-open
  monitoringPeriod: 300000, // Reset failure count after 5 minutes of success
};

function createService(
  initialConfig: MqttConfig = DEFAULT_MQTT_CONFIG
): MqttServiceAPI {
  let client: Paho.Client | null = null;
  let brokerConfigs: BrokerConfigurations = { ...BROKER_CONFIGS };
  let currentBroker: BrokerType = brokerConfigs.current;
  let config: MqttConfig = { ...brokerConfigs[currentBroker] };
  let status: MqttBridgeStatus = 'disconnected';

  // Enhanced reconnection with exponential backoff
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 8; // Increased for better reliability
  const baseReconnectInterval = 1000; // Start with 1 second
  const maxReconnectInterval = 30000; // Max 30 seconds

  // Circuit breaker state for each broker
  const brokerHealth: Record<BrokerType, BrokerHealth> = {
    local: {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      nextRetryTime: 0,
    },
    cloud: {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: 0,
      lastSuccessTime: 0,
      nextRetryTime: 0,
    },
  };

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

  // Circuit breaker utility functions
  const updateCircuitBreaker = (brokerType: BrokerType, success: boolean) => {
    const health = brokerHealth[brokerType];
    const now = Date.now();

    if (success) {
      health.failureCount = 0;
      health.lastSuccessTime = now;
      health.state = 'closed';

      // Reset failure count after monitoring period of success
      if (
        now - health.lastSuccessTime >
        CIRCUIT_BREAKER_CONFIG.monitoringPeriod
      ) {
        health.failureCount = 0;
      }
    } else {
      health.failureCount++;
      health.lastFailureTime = now;

      if (health.failureCount >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
        health.state = 'open';
        health.nextRetryTime = now + CIRCUIT_BREAKER_CONFIG.recoveryTimeout;
      }
    }
  };

  const canAttemptConnection = (brokerType: BrokerType): boolean => {
    const health = brokerHealth[brokerType];
    const now = Date.now();

    switch (health.state) {
      case 'closed':
        return true;
      case 'open':
        if (now >= health.nextRetryTime) {
          health.state = 'half-open';
          return true;
        }
        return false;
      case 'half-open':
        return true;
      default:
        return false;
    }
  };

  // Enhanced structured logging utility
  const logMqttEvent = (
    level: 'info' | 'warn' | 'error',
    event: string,
    data?: any
  ) => {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      service: 'MQTT',
      event,
      currentBroker,
      status,
      reconnectAttempts,
      ...(data && { data }),
    };

    switch (level) {
      case 'info':
        console.log(`📡 MQTT [${timestamp}] ${event}`, logData);
        break;
      case 'warn':
        console.warn(`⚠️ MQTT [${timestamp}] ${event}`, logData);
        break;
      case 'error':
        console.error(`❌ MQTT [${timestamp}] ${event}`, logData);
        break;
    }
  };

  // Classify MQTT errors for better handling
  const classifyMqttError = (error: any, brokerType: BrokerType): MqttError => {
    let type = MqttErrorType.UNKNOWN_ERROR;
    let retryable = true;

    const errorMessage = error?.errorMessage || error?.message || String(error);

    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out')
    ) {
      type = MqttErrorType.TIMEOUT;
      retryable = true;
    } else if (
      errorMessage.includes('authentication') ||
      errorMessage.includes('unauthorized')
    ) {
      type = MqttErrorType.AUTHENTICATION_FAILED;
      retryable = false;
    } else if (
      errorMessage.includes('network') ||
      errorMessage.includes('unreachable')
    ) {
      type = MqttErrorType.NETWORK_UNAVAILABLE;
      retryable = true;
    } else if (
      errorMessage.includes('protocol') ||
      errorMessage.includes('invalid')
    ) {
      type = MqttErrorType.PROTOCOL_ERROR;
      retryable = false;
    } else {
      type = MqttErrorType.CONNECTION_FAILED;
      retryable = true;
    }

    return {
      type,
      message: errorMessage,
      timestamp: Date.now(),
      brokerType,
      retryable,
    };
  };

  // Calculate exponential backoff delay
  const getReconnectDelay = (attemptNumber: number): number => {
    const delay = baseReconnectInterval * Math.pow(2, attemptNumber - 1);
    return Math.min(delay, maxReconnectInterval);
  };

  // Reset circuit breaker for a specific broker or all brokers
  const resetCircuitBreaker = (brokerType?: BrokerType) => {
    if (brokerType) {
      console.log(`🔄 Resetting circuit breaker for ${brokerType} broker`);
      brokerHealth[brokerType] = {
        state: 'closed',
        failureCount: 0,
        lastFailureTime: 0,
        lastSuccessTime: 0,
        nextRetryTime: 0,
      };
    } else {
      console.log('🔄 Resetting all circuit breakers');
      Object.keys(brokerHealth).forEach((type) => {
        const bt = type as BrokerType;
        brokerHealth[bt] = {
          state: 'closed',
          failureCount: 0,
          lastFailureTime: 0,
          lastSuccessTime: 0,
          nextRetryTime: 0,
        };
      });
    }
  };

  // Get comprehensive connection status for debugging
  const getConnectionStatus = () => {
    return {
      isConnected: isConnected(),
      currentBroker,
      status,
      brokerHealth: { ...brokerHealth },
      reconnectAttempts,
    };
  };

  const attemptReconnect = () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setStatus('error');
      const error = new Error(
        `Max reconnection attempts (${maxReconnectAttempts}) reached`
      );
      logMqttEvent('error', 'Max reconnection attempts reached', {
        maxAttempts: maxReconnectAttempts,
      });
      emitter.emit('error', error);
      return;
    }

    setStatus('connecting');
    const delay = getReconnectDelay(reconnectAttempts + 1);

    logMqttEvent('info', 'Scheduling reconnection attempt', {
      attempt: reconnectAttempts + 1,
      maxAttempts: maxReconnectAttempts,
      delay,
    });

    setTimeout(() => {
      if (status === 'connecting') {
        api.connect().catch((error) => {
          const mqttError = classifyMqttError(error, currentBroker);
          logMqttEvent('error', 'Reconnection attempt failed', {
            attempt: reconnectAttempts + 1,
            error: mqttError,
          });

          // Update circuit breaker
          updateCircuitBreaker(currentBroker, false);

          emitter.emit('error', error);
        });
      }
    }, delay);
  };

  // Test connection to a specific broker with circuit breaker
  const testBrokerConnection = async (
    brokerType: BrokerType
  ): Promise<boolean> => {
    // Check circuit breaker state
    if (!canAttemptConnection(brokerType)) {
      const health = brokerHealth[brokerType];
      logMqttEvent('warn', 'Circuit breaker blocking connection attempt', {
        brokerType,
        state: health.state,
        nextRetryTime: new Date(health.nextRetryTime).toISOString(),
      });
      return false;
    }

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
          timeout: 5, // Increased timeout for better reliability
          onSuccess: () => {
            clearTimeout(timeoutId);
            testClient.disconnect();
            updateCircuitBreaker(brokerType, true);
            logMqttEvent('info', 'Broker test successful', { brokerType });
            resolve(true);
          },
          onFailure: (error) => {
            clearTimeout(timeoutId);
            const mqttError = classifyMqttError(error, brokerType);
            logMqttEvent('warn', 'Broker test failed', {
              brokerType,
              error: mqttError,
            });
            updateCircuitBreaker(brokerType, false);
            resolve(false);
          },
          userName: brokerConfig.username,
          password: brokerConfig.password,
          useSSL: brokerConfig.useSSL,
          cleanSession: true,
        };

        // Set a timeout to ensure we don't wait too long
        timeoutId = setTimeout(() => {
          const timeoutError = new Error(
            `Broker test timeout for ${brokerType}`
          );
          const mqttError = classifyMqttError(timeoutError, brokerType);
          logMqttEvent('warn', 'Broker test timeout', {
            brokerType,
            error: mqttError,
          });
          updateCircuitBreaker(brokerType, false);
          resolve(false);
        }, 6000); // 6 second timeout

        testClient.connect(testOptions);
      } catch (error) {
        const mqttError = classifyMqttError(error, brokerType);
        logMqttEvent('error', 'Broker test error', {
          brokerType,
          error: mqttError,
        });
        updateCircuitBreaker(brokerType, false);
        resolve(false);
      }
    });
  };

  // Switch to a different broker with enhanced error handling
  const switchToBroker = async (brokerType: BrokerType): Promise<boolean> => {
    if (currentBroker === brokerType) {
      return isConnected();
    }

    logMqttEvent('info', 'Switching brokers', {
      from: currentBroker,
      to: brokerType,
    });
    setStatus('switching');

    try {
      // Disconnect current connection gracefully
      if (client && client.isConnected()) {
        client.disconnect();
        // Wait a moment for disconnect to complete
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Update configuration
      currentBroker = brokerType;
      config = { ...brokerConfigs[brokerType] };

      // Test new broker availability first
      logMqttEvent('info', 'Testing broker availability', { brokerType });
      const isReachable = await testBrokerConnection(brokerType);

      if (!isReachable) {
        logMqttEvent('warn', 'Broker not reachable but attempting connection', {
          brokerType,
        });
      }

      // Attempt connection to new broker
      logMqttEvent('info', 'Attempting broker connection', { brokerType });
      const connected = await api.connect();

      if (connected) {
        logMqttEvent('info', 'Successfully switched brokers', { brokerType });
        return true;
      } else {
        logMqttEvent('error', 'Failed to connect to broker', { brokerType });
        setStatus('error');
        return false;
      }
    } catch (error) {
      const mqttError = classifyMqttError(error, brokerType);
      logMqttEvent('error', 'Error switching brokers', {
        brokerType,
        error: mqttError,
      });
      setStatus('error');

      // Update circuit breaker for the target broker
      updateCircuitBreaker(brokerType, false);

      return false;
    }
  };

  // Auto-detect best available broker with enhanced error handling and graceful fallback
  const detectBestBroker = async (): Promise<BrokerType> => {
    console.log('🔍 Detecting best available MQTT broker...');

    // Import network detector to check if we're on the same subnet
    const { networkDetector } = require('../utils/networkDetection');
    const networkInfo = await networkDetector.getNetworkInfo();

    console.log('📡 Network info:', networkInfo);

    const brokersToTest: BrokerType[] = [];
    let selectedBroker: BrokerType = 'cloud'; // Default fallback
    let allBrokersFailed = true;

    // Always prioritize local broker first (default behavior)
    console.log('🏠 Prioritizing local broker first...');
    brokersToTest.unshift('local'); // Test local first

    // Always test cloud as fallback
    brokersToTest.push('cloud');

    // Test brokers in priority order with graceful fallback
    for (const brokerType of brokersToTest) {
      const health = brokerHealth[brokerType];

      console.log(
        `🔍 Testing ${brokerType} broker (state: ${health.state}, failures: ${health.failureCount})...`
      );

      // Skip if circuit breaker is open and not ready for retry
      // But allow testing during initial broker detection (more permissive)
      if (!canAttemptConnection(brokerType)) {
        // For initial broker detection, be more permissive
        // Only skip if circuit breaker has been open for more than 2 minutes
        const now = Date.now();
        if (health.state === 'open' && now - health.lastFailureTime > 120000) {
          console.warn(
            `⛔ Skipping ${brokerType} broker - circuit breaker is ${health.state} (open > 2min)`
          );
          continue;
        } else if (health.state === 'open') {
          console.log(
            `🔄 Attempting ${brokerType} broker despite circuit breaker (recent failure)`
          );
          // Reset to half-open for testing
          health.state = 'half-open';
        }
      }

      try {
        const isAvailable = await testBrokerConnection(brokerType);

        if (isAvailable) {
          console.log(`✅ ${brokerType} broker is available and healthy`);
          selectedBroker = brokerType;
          allBrokersFailed = false;
          break; // Found a working broker
        } else {
          console.warn(`❌ ${brokerType} broker is not available`);
        }
      } catch (error) {
        const mqttError = classifyMqttError(error, brokerType);
        console.error(`🚨 Error testing ${brokerType} broker:`, mqttError);
      }
    }

    // Implement graceful fallback strategies
    if (allBrokersFailed) {
      console.error('🚨 All brokers failed - implementing graceful fallback');

      // Try to reset circuit breakers for half-open state
      Object.keys(brokerHealth).forEach((brokerType) => {
        const health = brokerHealth[brokerType as BrokerType];
        if (health.state === 'open') {
          const now = Date.now();
          if (now >= health.nextRetryTime) {
            console.log(
              `🔄 Resetting circuit breaker for ${brokerType} to half-open`
            );
            health.state = 'half-open';
          }
        }
      });

      // If network is unstable, wait longer before retry
      if (!networkDetector.isNetworkStable()) {
        console.warn('📡 Network is unstable - extending retry delays');
        // Extend circuit breaker recovery time when network is unstable
        Object.keys(brokerHealth).forEach((brokerType) => {
          const health = brokerHealth[brokerType as BrokerType];
          if (health.state !== 'closed') {
            health.nextRetryTime =
              Date.now() + CIRCUIT_BREAKER_CONFIG.recoveryTimeout * 2;
          }
        });
      }

      // Return the broker with the least failures as last resort
      const bestFallback = Object.entries(brokerHealth).reduce(
        (best, [brokerType, health]) => {
          if (health.failureCount < best.health.failureCount) {
            return { brokerType: brokerType as BrokerType, health };
          }
          return best;
        },
        { brokerType: 'cloud' as BrokerType, health: brokerHealth.cloud }
      );

      console.warn(
        `🛟 Using ${bestFallback.brokerType} as last resort fallback`
      );
      selectedBroker = bestFallback.brokerType;
    } else {
      console.log(`🎯 Selected ${selectedBroker} broker`);
    }

    return selectedBroker;
  };

  const api: MqttServiceAPI = {
    getConfig: () => ({ ...config }),
    getBrokerConfigs: () => ({ ...brokerConfigs }),
    getBrokerHealth: () => ({ ...brokerHealth }),
    resetCircuitBreaker,
    getConnectionStatus,
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
              console.log(
                `✅ MQTT Connected successfully to ${currentBroker} broker`
              );
              setStatus('connected');
              reconnectAttempts = 0;

              // Update circuit breaker on successful connection
              updateCircuitBreaker(currentBroker, true);

              emitter.emit('connected');
              subscribedTopics.forEach((topic) => client?.subscribe(topic));
              resolve(true);
            },
            onFailure: (error: Paho.ErrorWithInvocationContext) => {
              const mqttError = classifyMqttError(error, currentBroker);
              console.error('❌ MQTT Connection failed:', mqttError);

              // Update circuit breaker
              updateCircuitBreaker(currentBroker, false);

              // If this was a local broker connection attempt and it failed,
              // immediately try cloud broker as fallback
              if (currentBroker === 'local' && mqttError.retryable) {
                console.log(
                  '🔄 Local broker failed, attempting cloud broker fallback...'
                );
                setTimeout(async () => {
                  try {
                    const cloudSuccess = await switchToBroker('cloud');
                    if (cloudSuccess) {
                      console.log('✅ Successfully switched to cloud broker');
                    } else {
                      console.error('❌ Cloud broker fallback also failed');
                      setStatus('error');
                      emitter.emit('error', error);
                      reject(
                        new Error(
                          `MQTT Connection failed: ${
                            error.errorMessage || 'Unknown error'
                          }`
                        )
                      );
                    }
                  } catch (switchError) {
                    console.error(
                      '❌ Error during cloud broker fallback:',
                      switchError
                    );
                    setStatus('error');
                    emitter.emit('error', error);
                    reject(error);
                  }
                }, 1000); // Small delay before attempting fallback
                return; // Don't immediately fail, wait for fallback attempt
              }

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
              const mqttError = classifyMqttError(
                responseObject,
                currentBroker
              );
              console.warn('📡 MQTT Connection lost:', mqttError);

              // Update circuit breaker
              updateCircuitBreaker(currentBroker, false);

              setStatus('disconnected');
              emitter.emit('disconnected');

              // If we're on local broker and connection was lost, try cloud fallback
              if (currentBroker === 'local' && mqttError.retryable) {
                console.log(
                  '🔄 Local broker connection lost, attempting cloud fallback...'
                );
                setTimeout(async () => {
                  try {
                    const cloudSuccess = await switchToBroker('cloud');
                    if (cloudSuccess) {
                      console.log(
                        '✅ Successfully switched to cloud broker after connection loss'
                      );
                    } else {
                      console.warn(
                        '⚠️ Cloud broker fallback failed, will retry local connection'
                      );
                      // Continue with normal reconnection attempts
                      if (reconnectAttempts < maxReconnectAttempts) {
                        attemptReconnect();
                      } else {
                        setStatus('error');
                        emitter.emit(
                          'error',
                          new Error('Max reconnection attempts reached')
                        );
                      }
                    }
                  } catch (switchError) {
                    console.error(
                      '❌ Error during cloud fallback after connection loss:',
                      switchError
                    );
                    // Continue with normal reconnection attempts
                    if (reconnectAttempts < maxReconnectAttempts) {
                      attemptReconnect();
                    }
                  }
                }, 2000); // Wait 2 seconds before attempting fallback
                return; // Don't immediately start reconnection, wait for fallback attempt
              }

              // Only attempt reconnection if we haven't exceeded max attempts
              if (reconnectAttempts < maxReconnectAttempts) {
                console.log(
                  `🔄 Attempting MQTT reconnection (${
                    reconnectAttempts + 1
                  }/${maxReconnectAttempts})`
                );
                attemptReconnect();
              } else {
                console.error('❌ MQTT max reconnection attempts reached');
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
            const mqttError = classifyMqttError(error, currentBroker);
            console.error('🚨 MQTT connection setup error:', mqttError);

            // Update circuit breaker
            updateCircuitBreaker(currentBroker, false);

            setStatus('error');
            emitter.emit('error', error);
            reject(error);
          }
        });
      } catch (error) {
        const mqttError = classifyMqttError(error, currentBroker);
        console.error('🚨 MQTT connection error:', mqttError);

        // Update circuit breaker
        updateCircuitBreaker(currentBroker, false);

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
