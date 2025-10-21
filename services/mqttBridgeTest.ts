import { mqttService, BrokerType } from './mqttService';

export interface BridgeTestResult {
  localBroker: {
    reachable: boolean;
    responseTime: number;
    error?: string;
  };
  cloudBroker: {
    reachable: boolean;
    responseTime: number;
    error?: string;
  };
  bridgeTest: {
    localToCloud: boolean;
  cloudToLocal: boolean;
    error?: string;
  };
  overall: 'success' | 'partial' | 'failed';
}

export class MqttBridgeTester {
  private testResults: BridgeTestResult | null = null;

  async runFullBridgeTest(): Promise<BridgeTestResult> {
    console.log('🔍 Starting MQTT Bridge Test...');

    const result: BridgeTestResult = {
      localBroker: { reachable: false, responseTime: 0 },
      cloudBroker: { reachable: false, responseTime: 0 },
      bridgeTest: { localToCloud: false, cloudToLocal: false },
      overall: 'failed',
    };

    try {
      // Test local broker
      console.log('Testing local broker...');
      const localStart = Date.now();
      const localReachable = await mqttService.testBrokerConnection('local');
      result.localBroker = {
        reachable: localReachable,
        responseTime: Date.now() - localStart,
        error: localReachable ? undefined : 'Local broker not reachable',
      };

      // Test cloud broker
      console.log('Testing cloud broker...');
      const cloudStart = Date.now();
      const cloudReachable = await mqttService.testBrokerConnection('cloud');
      result.cloudBroker = {
        reachable: cloudReachable,
        responseTime: Date.now() - cloudStart,
        error: cloudReachable ? undefined : 'Cloud broker not reachable',
      };

      // Test bridge functionality if both brokers are reachable
      if (localReachable && cloudReachable) {
        console.log('Testing bridge functionality...');
        await this.testBridgeFunctionality(result);
      }

      // Determine overall status
      if (
        result.localBroker.reachable &&
        result.cloudBroker.reachable &&
        result.bridgeTest.localToCloud &&
        result.bridgeTest.cloudToLocal
      ) {
        result.overall = 'success';
      } else if (result.localBroker.reachable || result.cloudBroker.reachable) {
        result.overall = 'partial';
      }

      this.testResults = result;
      console.log('✅ Bridge test completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Bridge test failed:', error);
      result.bridgeTest.error =
        error instanceof Error ? error.message : 'Unknown error';
      this.testResults = result;
      return result;
    }
  }

  private async testBridgeFunctionality(
    result: BridgeTestResult
  ): Promise<void> {
    return new Promise((resolve) => {
      const localTestTopic = 'room1/bridge/test';
      const cloudTestTopic = 'cloud/room1/bridge/test'; // Bridge forwards cloud/room1/# to local
      const testMessage = `bridge-test-${Date.now()}`;
      let localToCloudReceived = false;
      let cloudToLocalReceived = false;
      let timeout: ReturnType<typeof setTimeout>;

      // Set up message listener
      const messageHandler = (topic: string, payload: string) => {
        console.log(`📨 Bridge test message received: ${topic} -> ${payload}`);

        if (payload === testMessage) {
          // Check if message came from cloud to local (cloud topic received on local broker)
          if (
            topic === cloudTestTopic &&
            mqttService.getCurrentBroker() === 'local'
          ) {
            cloudToLocalReceived = true;
            console.log('✅ Cloud → Local bridge working');
          }
          // Check if message came from local to cloud (local topic received on cloud broker)
          else if (
            topic === localTestTopic &&
            mqttService.getCurrentBroker() === 'cloud'
          ) {
            localToCloudReceived = true;
            console.log('✅ Local → Cloud bridge working');
          }
        }

        // Check if both directions are working
        if (localToCloudReceived && cloudToLocalReceived) {
          clearTimeout(timeout);
          mqttService.off('message', messageHandler);
          result.bridgeTest.localToCloud = true;
          result.bridgeTest.cloudToLocal = true;
          resolve();
        }
      };

      mqttService.on('message', messageHandler);

      // Test local to cloud
      const testLocalToCloud = async () => {
        try {
      await mqttService.switchToBroker('local');
          mqttService.publish(localTestTopic, testMessage);
          console.log(
            '📤 Published to local broker (room1/bridge/test), waiting for cloud...'
          );
        } catch (error) {
          console.error('Failed to test local to cloud:', error);
        }
      };

      // Test cloud to local
      const testCloudToLocal = async () => {
        try {
          await mqttService.switchToBroker('cloud');
          mqttService.publish(cloudTestTopic, testMessage);
          console.log(
            '📤 Published to cloud broker (cloud/room1/bridge/test), waiting for local...'
          );
        } catch (error) {
          console.error('Failed to test cloud to local:', error);
        }
      };

      // Start tests
      testLocalToCloud();
      setTimeout(testCloudToLocal, 2000);

      // Timeout after 10 seconds
      timeout = setTimeout(() => {
        mqttService.off('message', messageHandler);
        result.bridgeTest.error = 'Bridge test timeout - messages not received';
        resolve();
      }, 10000);
    });
  }

  getLastTestResults(): BridgeTestResult | null {
    return this.testResults;
  }

  async testBrokerOnly(brokerType: BrokerType): Promise<boolean> {
    try {
      return await mqttService.testBrokerConnection(brokerType);
    } catch (error) {
      console.error(`Failed to test ${brokerType} broker:`, error);
      return false;
    }
  }

  async testConnection(host: string, port: number): Promise<boolean> {
    try {
      return await mqttService.testConnection(host, port);
    } catch (error) {
      console.error(`Failed to test connection to ${host}:${port}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const mqttBridgeTester = new MqttBridgeTester();
