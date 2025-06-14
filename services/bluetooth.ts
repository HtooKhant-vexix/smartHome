import { BleManager, Device, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

class BluetoothService {
  private bleManager: BleManager;
  private connectedDevices: Map<string, Device> = new Map();
  private isConnecting: Map<string, boolean> = new Map();
  private connectionRetries: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds
  private isScanning: boolean = false;
  private devices: Map<string, Device> = new Map();

  constructor() {
    this.bleManager = new BleManager();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const apiLevel = parseInt(Platform.Version.toString(), 10);

      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          result['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }
    return true;
  }

  async startScan(): Promise<void> {
    if (this.isScanning) return;

    try {
      this.isScanning = true;
      this.devices.clear();

      // Scan only for BLE devices
      await this.bleManager.startDeviceScan(
        null, // Scan for all services
        {
          allowDuplicates: false,
        },
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            return;
          }
          if (device) {
            this.devices.set(device.id, device);
          }
        }
      );

      // Set a timeout to stop scanning after 10 seconds
      setTimeout(() => {
        this.stopScan();
      }, 10000);
    } catch (error) {
      console.error('Error starting scan:', error);
      this.isScanning = false;
      throw error;
    }
  }

  stopScan(): void {
    if (this.isScanning) {
      this.bleManager.stopDeviceScan();
      this.isScanning = false;
    }
  }

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    if (this.isConnecting.get(deviceId)) {
      return false;
    }

    try {
      this.isConnecting.set(deviceId, true);
      let retries = this.connectionRetries.get(deviceId) || 0;

      while (retries < this.MAX_RETRIES) {
        try {
          const device = await this.bleManager.connectToDevice(deviceId);
          await device.discoverAllServicesAndCharacteristics();
          this.connectedDevices.set(deviceId, device);
          this.connectionRetries.set(deviceId, 0);
          return true;
        } catch (error) {
          console.error(`Connection attempt ${retries + 1} failed:`, error);
          retries++;
          this.connectionRetries.set(deviceId, retries);

          if (retries < this.MAX_RETRIES) {
            await this.wait(this.RETRY_DELAY);
          }
        }
      }

      throw new Error('Failed to connect after 3 attempts');
    } finally {
      this.isConnecting.set(deviceId, false);
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      try {
        // Cancel any ongoing connection attempts
        this.isConnecting.set(deviceId, false);

        // Wait a bit before disconnecting
        await this.wait(500);

        await this.bleManager.cancelDeviceConnection(deviceId);
        this.connectedDevices.delete(deviceId);
        this.connectionRetries.delete(deviceId);
      } catch (error) {
        console.error('Failed to disconnect device:', error);
      }
    }
  }

  async disconnectAllDevices(): Promise<void> {
    const disconnectPromises = Array.from(this.connectedDevices.keys()).map(
      (deviceId) => this.disconnectDevice(deviceId)
    );
    await Promise.all(disconnectPromises);

    // Clear all connection states
    this.isConnecting.clear();
    this.connectionRetries.clear();
  }

  async sendData(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    data: string
  ): Promise<boolean> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      console.error('Device not connected');
      return false;
    }

    try {
      await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        Buffer.from(data).toString('base64')
      );
      return true;
    } catch (error) {
      console.error('Failed to send data:', error);
      return false;
    }
  }

  getConnectedDevices(): Device[] {
    return Array.from(this.connectedDevices.values());
  }

  isDeviceConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  async getState(): Promise<State> {
    return await this.bleManager.state();
  }

  isDeviceConnecting(deviceId: string): boolean {
    return this.isConnecting.get(deviceId) || false;
  }

  getConnectionRetries(deviceId: string): number {
    return this.connectionRetries.get(deviceId) || 0;
  }

  getDiscoveredDevices(): Device[] {
    return Array.from(this.devices.values());
  }
}

export const bluetoothService = new BluetoothService();
