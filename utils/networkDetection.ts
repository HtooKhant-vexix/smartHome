import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export interface NetworkInfo {
  isConnected: boolean;
  isLocalNetwork: boolean;
  networkType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  ssid?: string;
  ipAddress?: string;
}

// Enhanced error types for better error handling
export enum NetworkErrorType {
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface NetworkError {
  type: NetworkErrorType;
  message: string;
  timestamp: number;
  retryCount: number;
}

export interface NetworkStabilityInfo {
  isStable: boolean;
  lastError?: NetworkError;
  errorCount: number;
  lastSuccessfulCheck: number;
  consecutiveFailures: number;
}

export class NetworkDetector {
  private static instance: NetworkDetector;
  private currentNetwork: NetworkInfo | null = null;
  private listeners: ((network: NetworkInfo) => void)[] = [];
  private stabilityInfo: NetworkStabilityInfo = {
    isStable: true,
    errorCount: 0,
    lastSuccessfulCheck: Date.now(),
    consecutiveFailures: 0,
  };
  private networkCheckInterval: ReturnType<typeof setInterval> | null = null;
  private readonly STABILITY_THRESHOLD = 3; // consecutive failures before marking unstable
  private readonly CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_CONSECUTIVE_FAILURES = 5;

  static getInstance(): NetworkDetector {
    if (!NetworkDetector.instance) {
      NetworkDetector.instance = new NetworkDetector();
    }
    return NetworkDetector.instance;
  }

  constructor() {
    this.initializeNetworkMonitoring();
    this.startStabilityMonitoring();
  }

  private async initializeNetworkMonitoring() {
    try {
      // Get initial network state
      const state = await NetInfo.fetch();
      this.updateNetworkInfo(state);
    } catch (error) {
      this.handleNetworkError(
        NetworkErrorType.UNKNOWN_ERROR,
        `Failed to fetch initial network state: ${error}`
      );
    }

    // Listen for network changes
    NetInfo.addEventListener((state) => {
      this.updateNetworkInfo(state);
    });
  }

  private startStabilityMonitoring() {
    this.networkCheckInterval = setInterval(async () => {
      try {
        await this.performStabilityCheck();
      } catch (error) {
        console.warn('Network stability check failed:', error);
      }
    }, this.CHECK_INTERVAL);
  }

  private async performStabilityCheck() {
    try {
      const state = await NetInfo.fetch();
      const wasConnected = this.currentNetwork?.isConnected ?? false;
      const isConnected = Boolean(
        state.isConnected && state.isInternetReachable
      );

      if (wasConnected && !isConnected) {
        this.handleNetworkError(
          NetworkErrorType.NETWORK_UNAVAILABLE,
          'Network connectivity lost'
        );
      } else if (!wasConnected && isConnected) {
        // Network recovered
        this.resetStabilityInfo();
      }

      this.updateNetworkInfo(state);
    } catch (error) {
      this.handleNetworkError(
        NetworkErrorType.TIMEOUT,
        `Network check timeout: ${error}`
      );
    }
  }

  private handleNetworkError(type: NetworkErrorType, message: string) {
    const error: NetworkError = {
      type,
      message,
      timestamp: Date.now(),
      retryCount: this.stabilityInfo.consecutiveFailures,
    };

    this.stabilityInfo.errorCount++;
    this.stabilityInfo.consecutiveFailures++;
    this.stabilityInfo.lastError = error;

    if (this.stabilityInfo.consecutiveFailures >= this.STABILITY_THRESHOLD) {
      this.stabilityInfo.isStable = false;
    }

    console.warn(`Network Error [${type}]: ${message}`, {
      errorCount: this.stabilityInfo.errorCount,
      consecutiveFailures: this.stabilityInfo.consecutiveFailures,
      isStable: this.stabilityInfo.isStable,
    });
  }

  private resetStabilityInfo() {
    this.stabilityInfo.isStable = true;
    this.stabilityInfo.errorCount = 0;
    this.stabilityInfo.consecutiveFailures = 0;
    this.stabilityInfo.lastSuccessfulCheck = Date.now();
    this.stabilityInfo.lastError = undefined;
  }

  private updateNetworkInfo(state: any) {
    try {
      const isConnected = Boolean(
        state.isConnected && state.isInternetReachable
      );
      const networkType =
        state.type === 'wifi' ||
        state.type === 'cellular' ||
        state.type === 'ethernet'
          ? state.type
          : 'unknown';
      const ssid = (state.details as any)?.ssid;
      const ipAddress = (state.details as any)?.ipAddress;

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

      // Reset stability info on successful network detection
      if (isConnected) {
        this.resetStabilityInfo();
      }

      // Notify listeners
      this.listeners.forEach((listener) => {
        try {
          listener(networkInfo);
        } catch (error) {
          console.error('Error in network listener:', error);
        }
      });
    } catch (error) {
      this.handleNetworkError(
        NetworkErrorType.UNKNOWN_ERROR,
        `Failed to update network info: ${error}`
      );
    }
  }

  private isLocalNetwork(ipAddress?: string, ssid?: string): boolean {
    if (!ipAddress) return false;

    // Check if IP is in the same subnet as the MQTT broker (192.168.0.x)
    const brokerIP = '192.168.0.100';
    const isSameSubnet = this.isSameSubnet(ipAddress, brokerIP);

    // Check if SSID indicates local network (you can customize this)
    const localSSIDs = [
      'POS_SERVER_OLD',
      'pos_server_old',
      'POS_SERVER',
      'home',
      'local',
    ]; // Add your actual SSIDs
    const isLocalSSID = Boolean(
      ssid &&
        localSSIDs.some((localSSID) =>
          ssid.toLowerCase().includes(localSSID.toLowerCase())
        )
    );

    // Additional check for common local network patterns
    const isLikelyLocalNetwork = Boolean(
      ssid &&
        (ssid.toLowerCase().includes('pos') ||
          ssid.toLowerCase().includes('server') ||
          ssid.toLowerCase().includes('office') ||
          ssid.toLowerCase().includes('work') ||
          ipAddress?.startsWith('192.168.') ||
          ipAddress?.startsWith('10.') ||
          ipAddress?.startsWith('172.'))
    );

    // iOS-specific network detection
    const isIOSLocalNetwork =
      Platform.OS === 'ios' &&
      Boolean(
        ipAddress?.startsWith('192.168.') ||
          ipAddress?.startsWith('10.') ||
          ipAddress?.startsWith('172.') ||
          (ssid && ssid.toLowerCase().includes('pos'))
      );

    console.log(
      `🔍 Network detection: SSID="${ssid}", IP="${ipAddress}", isSameSubnet=${isSameSubnet}, isLocalSSID=${isLocalSSID}, isLikelyLocal=${isLikelyLocalNetwork}, isIOSLocal=${isIOSLocalNetwork}`
    );
    console.log(`🔍 Local SSID check:`, {
      ssid,
      localSSIDs,
      matches: localSSIDs.map((localSSID) => ({
        localSSID,
        match: ssid && ssid.toLowerCase().includes(localSSID.toLowerCase()),
      })),
    });

    return (
      isSameSubnet || isLocalSSID || isLikelyLocalNetwork || isIOSLocalNetwork
    );
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

  // Get current network stability information
  getStabilityInfo(): NetworkStabilityInfo {
    return { ...this.stabilityInfo };
  }

  // Check if network is stable (no recent failures)
  isNetworkStable(): boolean {
    return (
      this.stabilityInfo.isStable &&
      this.stabilityInfo.consecutiveFailures < this.STABILITY_THRESHOLD
    );
  }

  // Get current network info
  getCurrentNetwork(): NetworkInfo | null {
    return this.currentNetwork;
  }

  // Get fresh network info with error handling
  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      const state = await NetInfo.fetch();
      const isConnected = Boolean(
        state.isConnected && state.isInternetReachable
      );
      const networkType =
        state.type === 'wifi' ||
        state.type === 'cellular' ||
        state.type === 'ethernet'
          ? state.type
          : 'unknown';
      const ssid = (state.details as any)?.ssid;
      const ipAddress = (state.details as any)?.ipAddress;
      const isLocalNetwork = this.isLocalNetwork(ipAddress, ssid);

      return {
        isConnected,
        isLocalNetwork,
        networkType,
        ssid,
        ipAddress,
      };
    } catch (error) {
      this.handleNetworkError(
        NetworkErrorType.UNKNOWN_ERROR,
        `Failed to fetch network info: ${error}`
      );
      throw error;
    }
  }

  // Cleanup method
  destroy() {
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }
    this.listeners = [];
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
