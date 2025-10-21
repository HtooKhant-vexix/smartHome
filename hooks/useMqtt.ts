import { useEffect, useState, useCallback } from 'react';
import { mqttService, MqttConnectionStatus } from '../services/mqttService';

// Hook for easy MQTT usage in components
export const useMqtt = () => {
  const [isConnected, setIsConnected] = useState(mqttService.isConnected());
  const [status, setStatus] = useState<MqttConnectionStatus>(
    mqttService.getStatus()
  );

  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setStatus('connected');
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setStatus('disconnected');
    };

    const handleStatusChanged = (newStatus: MqttConnectionStatus) => {
      setStatus(newStatus);
      setIsConnected(newStatus === 'connected');
    };

    // Add event listeners
    mqttService.on('connected', handleConnected);
    mqttService.on('disconnected', handleDisconnected);
    mqttService.on('statusChanged', handleStatusChanged);

    return () => {
      // Remove event listeners
      mqttService.off('connected', handleConnected);
      mqttService.off('disconnected', handleDisconnected);
      mqttService.off('statusChanged', handleStatusChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      await mqttService.connect();
      return true;
    } catch (error) {
      console.error('Failed to connect to MQTT:', error);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    mqttService.disconnect();
  }, []);

  const publish = useCallback((topic: string, message: string) => {
    return mqttService.publish(topic, message);
  }, []);

  const publishJson = useCallback((topic: string, data: any) => {
    return mqttService.publishJson(topic, data);
  }, []);

  const subscribe = useCallback((topic: string) => {
    return mqttService.subscribe(topic);
  }, []);

  const unsubscribe = useCallback((topic: string) => {
    return mqttService.unsubscribe(topic);
  }, []);

  const subscribeWithCallback = useCallback(
    (topic: string, callback: (data: any) => void) => {
      return mqttService.subscribeWithCallback(topic, callback);
    },
    []
  );

  return {
    isConnected,
    status,
    connect,
    disconnect,
    publish,
    publishJson,
    subscribe,
    unsubscribe,
    subscribeWithCallback,
    mqttService, // Direct access to the service if needed
  };
};

// Hook for subscribing to specific topics with automatic cleanup
export const useMqttSubscription = (
  topic: string,
  callback: (data: any) => void
) => {
  const { subscribeWithCallback, isConnected } = useMqtt();

  useEffect(() => {
    if (isConnected && topic) {
      const success = subscribeWithCallback(topic, callback);
      if (!success) {
        console.warn(`Failed to subscribe to topic: ${topic}`);
      }
    }
  }, [isConnected, topic, callback, subscribeWithCallback]);

  // Cleanup is handled automatically by the MQTT service
};
