import { Platform, PermissionsAndroid } from 'react-native';
import { Buffer } from 'buffer';

// Safe import for react-native-ble-plx
let BleManager: any, Device: any, State: any, Characteristic: any;

try {
  const bleModule = require('react-native-ble-plx');
  BleManager = bleModule.BleManager;
  Device = bleModule.Device;
  State = bleModule.State;
  Characteristic = bleModule.Characteristic;
} catch (error) {
  console.warn('react-native-ble-plx not available:', error);
  // Fallback values for Expo Go
  BleManager = class MockBleManager {
    constructor() {}
    async state() {
      return 'Unknown';
    }
    async startDeviceScan() {}
    stopDeviceScan() {}
    async connectToDevice() {
      return null;
    }
    async cancelDeviceConnection() {}
  };
  Device = class MockDevice {};
  State = 'Unknown';
  Characteristic = class MockCharacteristic {};
}

// Safe import for react-native-permissions
let request: any, PERMISSIONS: any, RESULTS: any, check: any;

try {
  const permissionsModule = require('react-native-permissions');
  request = permissionsModule.request;
  PERMISSIONS = permissionsModule.PERMISSIONS;
  RESULTS = permissionsModule.RESULTS;
  check = permissionsModule.check;
} catch (error) {
  console.warn('react-native-permissions not available:', error);
  // Fallback values
  request = () => Promise.resolve('unavailable');
  PERMISSIONS = { IOS: {}, ANDROID: {} };
  RESULTS = { GRANTED: 'granted' };
  check = () => Promise.resolve('unavailable');
}

interface WriteCharacteristic {
  device: any;
  serviceUUID: string;
  characteristicUUID: string;
  withResponse: boolean;
}

interface ReadCharacteristic {
  device: any;
  serviceUUID: string;
  characteristicUUID: string;
}

interface WifiConfig {
  ssid: string;
  password: string;
  port?: number;
}

interface WifiConfigData {
  wifiConfig: WifiConfig;
}

class BluetoothService {
  private bleManager: any;
  private connectedDevices: Map<string, any> = new Map();
  private isConnecting: Map<string, boolean> = new Map();
  private connectionRetries: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds
  private isScanning: boolean = false;
  private devices: Map<string, any> = new Map();
  private writeCharacteristics: Map<string, WriteCharacteristic> = new Map();
  private readCharacteristics: Map<string, ReadCharacteristic> = new Map();

  // Update UUIDs based on actual device characteristics
  private readonly SERVICE_UUID = '12345678-1234-5678-9abc-123456789abc'; // Custom service UUID
  private readonly WRITE_CHARACTERISTIC_UUID =
    '00002b29-0000-1000-8000-00805f9b34fb';
  private readonly READ_CHARACTERISTIC_UUID =
    '00002b3a-0000-1000-8000-00805f9b34fb';

  constructor() {
    this.bleManager = new BleManager();
  }

  async requestPermissions(): Promise<boolean> {
    try {
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
      } else if (Platform.OS === 'ios') {
        try {
          // Check if permissions module is available
          if (!PERMISSIONS.IOS || !PERMISSIONS.IOS.BLUETOOTH_SCAN) {
            console.warn(
              'iOS permissions module not properly loaded, skipping permission requests'
            );
            return true; // Allow the app to continue without permissions for now
          }

          // Check current permission status first
          const bluetoothScanStatus = await check(
            PERMISSIONS.IOS.BLUETOOTH_SCAN
          );
          const bluetoothConnectStatus = await check(
            PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL
          );
          const locationStatus = await check(
            PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          );

          console.log('Current iOS Permission Status:', {
            bluetoothScan: bluetoothScanStatus,
            bluetoothConnect: bluetoothConnectStatus,
            location: locationStatus,
          });

          // Request permissions if not already granted
          const bluetoothScanResult =
            bluetoothScanStatus === RESULTS.GRANTED
              ? bluetoothScanStatus
              : await request(PERMISSIONS.IOS.BLUETOOTH_SCAN);

          const bluetoothConnectResult =
            bluetoothConnectStatus === RESULTS.GRANTED
              ? bluetoothConnectStatus
              : await request(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);

          const locationResult =
            locationStatus === RESULTS.GRANTED
              ? locationStatus
              : await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);

          console.log('iOS Permission Results:', {
            bluetoothScan: bluetoothScanResult,
            bluetoothConnect: bluetoothConnectResult,
            location: locationResult,
          });

          return (
            bluetoothScanResult === RESULTS.GRANTED &&
            bluetoothConnectResult === RESULTS.GRANTED &&
            locationResult === RESULTS.GRANTED
          );
        } catch (error) {
          console.error('Error requesting iOS permissions:', error);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error in requestPermissions:', error);
      return false;
    }
  }

  async startScan(): Promise<void> {
    if (this.isScanning) return;

    try {
      this.isScanning = true;
      this.devices.clear();

      await this.bleManager.startDeviceScan(
        null,
        {
          allowDuplicates: false,
        },
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            return;
          }
          if (device && device.name) {
            this.devices.set(device.id, device);
          }
        }
      );

      // Stop scanning after 10 seconds
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

  private async discoverCharacteristics(device: any): Promise<{
    write: WriteCharacteristic | null;
    read: ReadCharacteristic | null;
  }> {
    try {
      const services = await device.services();
      console.log(
        'Available services:',
        services.map((s) => s.uuid)
      );

      let writeChar: WriteCharacteristic | null = null;
      let readChar: ReadCharacteristic | null = null;

      // Look for our specific service
      const targetService = services.find((s) => s.uuid === this.SERVICE_UUID);
      if (targetService) {
        const characteristics = await targetService.characteristics();
        console.log(
          `Characteristics for service ${targetService.uuid}:`,
          characteristics.map((c) => ({
            uuid: c.uuid,
            isWritableWithResponse: c.isWritableWithResponse,
            isWritableWithoutResponse: c.isWritableWithoutResponse,
            isReadable: c.isReadable,
          }))
        );

        // Find write characteristic - look for any writable characteristic
        const writeCharacteristic = characteristics.find(
          (c) => c.isWritableWithResponse || c.isWritableWithoutResponse
        );
        if (writeCharacteristic) {
          writeChar = {
            device,
            serviceUUID: this.SERVICE_UUID,
            characteristicUUID: writeCharacteristic.uuid,
            withResponse: writeCharacteristic.isWritableWithResponse,
          };
          console.log('Found write characteristic:', writeChar);
        }

        // Find read characteristic
        const readCharacteristic = characteristics.find((c) => c.isReadable);
        if (readCharacteristic) {
          readChar = {
            device,
            serviceUUID: this.SERVICE_UUID,
            characteristicUUID: readCharacteristic.uuid,
          };
          console.log('Found read characteristic:', readChar);
        }
      }

      if (!writeChar) {
        console.warn('Write characteristic not found');
      }
      if (!readChar) {
        console.warn('Read characteristic not found');
      }

      return { write: writeChar, read: readChar };
    } catch (error) {
      console.error('Error discovering characteristics:', error);
      return { write: null, read: null };
    }
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

          // Discover characteristics
          const { write, read } = await this.discoverCharacteristics(device);

          if (write) {
            this.writeCharacteristics.set(deviceId, write);
            console.log('Found write characteristic:', write);
          } else {
            console.warn('No write characteristic found for device:', deviceId);
          }

          if (read) {
            this.readCharacteristics.set(deviceId, read);
            console.log('Found read characteristic:', read);
          } else {
            console.warn('No read characteristic found for device:', deviceId);
          }

          this.connectedDevices.set(deviceId, device);
          this.connectionRetries.set(deviceId, 0);
          return true;
        } catch (error) {
          console.error(`Connection attempt ${retries + 1} failed:`, error);
          retries++;
          this.connectionRetries.set(deviceId, retries);

          if (retries < this.MAX_RETRIES) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.RETRY_DELAY)
            );
          }
        }
      }

      throw new Error('Failed to connect after 3 attempts');
    } finally {
      this.isConnecting.set(deviceId, false);
    }
  }

  async sendData(
    deviceId: string,
    data: string | WifiConfig | WifiConfigData
  ): Promise<boolean> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      console.error('Device not connected');
      return false;
    }

    const writeChar = this.writeCharacteristics.get(deviceId);
    if (!writeChar) {
      console.error('No write characteristic found for device');
      return false;
    }

    try {
      const { serviceUUID, characteristicUUID } = writeChar;

      // Format the data as a JSON object
      let jsonData: WifiConfigData;
      if (typeof data === 'object') {
        if ('wifiConfig' in data) {
          jsonData = data as WifiConfigData;
        } else {
          const wifiConfig = data as WifiConfig;
          jsonData = {
            wifiConfig: {
              ssid: wifiConfig.ssid,
              password: wifiConfig.password,
              port: wifiConfig.port || 1883,
            },
          };
        }
      } else {
        // If it's a string, parse it as JSON
        jsonData = JSON.parse(data);
      }

      console.log('Sending JSON object:', jsonData);

      // Convert to string and encode for BLE transmission
      const jsonString = JSON.stringify(jsonData);
      const encodedData = Buffer.from(jsonString).toString('base64');
      console.log('Encoded data:', encodedData);

      // Send the encoded data
      try {
        await device.writeCharacteristicWithResponseForService(
          serviceUUID,
          characteristicUUID,
          encodedData
        );
        console.log('Data sent successfully');
        return true;
      } catch (error) {
        console.error('Failed to send data:', error);
        return false;
      }
    } catch (error) {
      console.error('Failed to send data:', error);
      return false;
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      try {
        this.isConnecting.set(deviceId, false);
        await new Promise((resolve) => setTimeout(resolve, 500));
        await this.bleManager.cancelDeviceConnection(deviceId);
        this.connectedDevices.delete(deviceId);
        this.connectionRetries.delete(deviceId);
        this.writeCharacteristics.delete(deviceId);
        this.readCharacteristics.delete(deviceId);
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
    this.isConnecting.clear();
    this.connectionRetries.clear();
    this.writeCharacteristics.clear();
    this.readCharacteristics.clear();
  }

  getConnectedDevices(): any[] {
    return Array.from(this.connectedDevices.values());
  }

  isDeviceConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  async getState(): Promise<any> {
    return await this.bleManager.state();
  }

  isDeviceConnecting(deviceId: string): boolean {
    return this.isConnecting.get(deviceId) || false;
  }

  getConnectionRetries(deviceId: string): number {
    return this.connectionRetries.get(deviceId) || 0;
  }

  getDiscoveredDevices(): any[] {
    return Array.from(this.devices.values());
  }

  async readData(deviceId: string): Promise<{ header: any; data: any } | null> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      console.error('Device not connected');
      return null;
    }

    const readChar = this.readCharacteristics.get(deviceId);
    if (!readChar) {
      console.error('No read characteristic found for device');
      return null;
    }

    try {
      const { serviceUUID, characteristicUUID } = readChar;
      console.log('Reading from service UUID:', serviceUUID);
      console.log('Reading from characteristic UUID:', characteristicUUID);

      // Read the characteristic
      const characteristic = await device.readCharacteristicForService(
        serviceUUID,
        characteristicUUID
      );

      if (!characteristic?.value) {
        return null;
      }

      // Parse the JSON data
      const data = JSON.parse(characteristic.value);
      return data;
    } catch (error) {
      console.error('Failed to read data:', error);
      return null;
    }
  }

  async monitorCharacteristic(
    deviceId: string,
    callback: (data: { header: any; data: any }) => void
  ): Promise<() => void> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      console.error('Device not connected');
      return () => {};
    }

    const readChar = this.readCharacteristics.get(deviceId);
    if (!readChar) {
      console.error('No read characteristic found for device');
      return () => {};
    }

    try {
      const { serviceUUID, characteristicUUID } = readChar;

      // Start monitoring the characteristic
      const subscription = device.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
          if (error) {
            console.error('Monitoring error:', error);
            return;
          }

          if (!characteristic?.value) {
            return;
          }

          try {
            // Decode base64 data
            const decodedData = Buffer.from(
              characteristic.value,
              'base64'
            ).toString();

            // Parse the JSON payload
            const payload = JSON.parse(decodedData);

            // Parse the data based on its type
            const parsedData =
              payload.header.type === 'json'
                ? JSON.parse(payload.data)
                : payload.data;

            callback({
              header: payload.header,
              data: parsedData,
            });
          } catch (error) {
            console.error('Error parsing monitored data:', error);
          }
        }
      );

      // Return a function to stop monitoring
      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      return () => {};
    }
  }
}

// Create a single instance
const bluetoothService = new BluetoothService();

// Export the instance
export { bluetoothService };
