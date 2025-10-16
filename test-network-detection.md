# Network Detection Test Guide

## 🧪 **Testing Network Detection Logic**

This guide helps you verify that the network detection is working correctly for your specific setup.

### **Network Detection Logic**

The app now detects networks based on:

1. **Home Network**: IP address in `192.168.0.x` subnet (same as MQTT broker at 192.168.0.100)
2. **External Network**: Any other IP address or network

### **Expected Behavior**

#### **When on Home Network (192.168.0.x):**

- **Network Indicator**: 🏠 "Home Network (WiFiName)"
- **IP Display**: "IP: 192.168.0.XXX (Home Network)"
- **Broker Selection**: Tries local broker (192.168.0.100:9001) first
- **Fallback**: If local broker fails, switches to cloud broker

#### **When on External Network:**

- **Network Indicator**: 🌐 "External Network (WiFiName)"
- **IP Display**: "IP: XXX.XXX.XXX.XXX"
- **Broker Selection**: Uses cloud broker directly
- **No Local Attempts**: Skips local broker to prevent connection errors

### **Test Scenarios**

#### **Scenario 1: Home WiFi (192.168.0.x)**

1. Connect to your home WiFi
2. Check Settings → MQTT Bridge → Network Status
3. Should show: 🏠 "Home Network (YourWiFiName)"
4. Should show: "IP: 192.168.0.XXX (Home Network)"
5. MQTT should connect to local broker first

#### **Scenario 2: Mobile Data**

1. Turn off WiFi, use mobile data
2. Check Settings → MQTT Bridge → Network Status
3. Should show: 🌐 "External Network"
4. Should show: "IP: XXX.XXX.XXX.XXX"
5. MQTT should connect to cloud broker directly

#### **Scenario 3: Different WiFi (not 192.168.0.x)**

1. Connect to office WiFi or different network
2. Check Settings → MQTT Bridge → Network Status
3. Should show: 🌐 "External Network (OfficeWiFi)"
4. Should show: "IP: XXX.XXX.XXX.XXX"
5. MQTT should connect to cloud broker directly

### **Debug Information**

The app logs network detection information:

```
Network info: {
  isConnected: true,
  isLocalNetwork: true,
  networkType: 'wifi',
  ssid: 'YourWiFiName',
  ipAddress: '192.168.0.50'
}
```

### **Troubleshooting**

#### **If Home Network Not Detected:**

1. Check if your IP is actually `192.168.0.x`
2. Verify your router's subnet is `192.168.0.x`
3. Check if MQTT broker is at `192.168.0.100`

#### **If External Network Not Detected:**

1. Check if IP is different from `192.168.0.x`
2. Verify you're not on the same subnet as broker
3. Check mobile data or different WiFi network

### **Customization**

To customize the detection logic, edit `utils/networkDetection.ts`:

```typescript
// Change broker IP if different
const brokerIP = '192.168.0.100';

// Add your WiFi names for additional detection
const localSSIDs = ['YourHomeWiFi', 'HomeNetwork', 'SmartHome'];
```

### **Success Indicators**

✅ **Home Network**: Shows green home icon with "Home Network"
✅ **External Network**: Shows blue globe icon with "External Network"
✅ **IP Display**: Shows current IP address
✅ **Broker Selection**: Correct broker chosen based on network
✅ **No Connection Errors**: No attempts to connect to unreachable brokers

