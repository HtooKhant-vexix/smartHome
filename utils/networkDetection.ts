import NetInfo from '@react-native-community/netinfo';

export interface NetworkInfo {
  isConnected: boolean;
  isLocalNetwork: boolean;
  networkType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  ssid?: string;
  ipAddress?: string;
}

export class NetworkDetector {
  private static instance: NetworkDetector;
  private currentNetwork: NetworkInfo | null = null;
  private listeners: ((network: NetworkInfo) => void)[] = [];

  static getInstance(): NetworkDetector {
    if (!NetworkDetector.instance) {
      NetworkDetector.instance = new NetworkDetector();
    }
    return NetworkDetector.instance;
  }

  constructor() {
    this.initializeNetworkMonitoring();
  }

  private async initializeNetworkMonitoring() {
    // Get initial network state
    const state = await NetInfo.fetch();
    this.updateNetworkInfo(state);

    // Listen for network changes
    NetInfo.addEventListener((state) => {
      this.updateNetworkInfo(state);
    });
  }

  private updateNetworkInfo(state: any) {
    const isConnected = state.isConnected && state.isInternetReachable;
    const networkType = state.type || 'unknown';
    const ssid = state.details?.ssid;
    const ipAddress = state.details?.ipAddress;

    // Determine if we're on local network
    const isLocalNetwork = this.isLocalNetwork(ipAddress, ssid);

    const networkInfo: NetworkInfo = {
      isConnected,
      isLocalNetwork,
      networkType,
      ssid,
      ipAddress,
    };

    this.currentNetwork = networkInfo;

    // Notify listeners
    this.listeners.forEach((listener) => listener(networkInfo));
  }

  private isLocalNetwork(ipAddress?: string, ssid?: string): boolean {
    if (!ipAddress) return false;

    // Check if IP is in the same subnet as the MQTT broker (192.168.0.x)
    const brokerIP = '192.168.0.100';
    const isSameSubnet = this.isSameSubnet(ipAddress, brokerIP);

    // Check if SSID indicates local network (you can customize this)
    const localSSIDs = ['YourHomeWiFi', 'HomeNetwork', 'SmartHome']; // Add your actual SSIDs
    const isLocalSSID =
      ssid &&
      localSSIDs.some((localSSID) =>
        ssid.toLowerCase().includes(localSSID.toLowerCase())
      );

    return isSameSubnet || isLocalSSID;
  }

  private isSameSubnet(ip1: string, ip2: string): boolean {
    try {
      const parts1 = ip1.split('.').map(Number);
      const parts2 = ip2.split('.').map(Number);

      // Check if first 3 octets match (same subnet)
      return (
        parts1[0] === parts2[0] &&
        parts1[1] === parts2[1] &&
        parts1[2] === parts2[2]
      );
    } catch {
      return false;
    }
  }

  getCurrentNetwork(): NetworkInfo | null {
    return this.currentNetwork;
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected && state.isInternetReachable;
    const networkType = state.type || 'unknown';
    const ssid = state.details?.ssid;
    const ipAddress = state.details?.ipAddress;
    const isLocalNetwork = this.isLocalNetwork(ipAddress, ssid);

    return {
      isConnected,
      isLocalNetwork,
      networkType,
      ssid,
      ipAddress,
    };
  }

  addNetworkListener(listener: (network: NetworkInfo) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  isOnLocalNetwork(): boolean {
    return this.currentNetwork?.isLocalNetwork || false;
  }

  isConnected(): boolean {
    return this.currentNetwork?.isConnected || false;
  }
}

// Export singleton instance
export const networkDetector = NetworkDetector.getInstance();
