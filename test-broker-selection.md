# MQTT Broker Selection Test Guide

## 🧪 **Testing New Broker Selection Logic**

The app now **always tries the local broker first** (192.168.0.100), regardless of network type, and only switches to cloud broker if local is not reachable.

### **New Broker Selection Logic**

1. **Always Try Local First**: App attempts to connect to 192.168.0.100:9001
2. **If Local Reachable**: Use local broker (fastest response)
3. **If Local Not Reachable**: Switch to cloud broker automatically
4. **No Network Detection**: Doesn't matter if you're on home network or external

### **Expected Behavior**

#### **Scenario 1: Local Broker Available (192.168.0.100 reachable)**

- **Network Indicator**: Shows "Will try local broker first"
- **Connection**: Connects to local broker (192.168.0.100:9001)
- **Performance**: Fast local response
- **Bridge**: Not needed (direct local connection)

#### **Scenario 2: Local Broker Not Available (192.168.0.100 not reachable)**

- **Network Indicator**: Shows "Will try local broker first, then cloud"
- **Connection**: Switches to cloud broker automatically
- **Performance**: Slightly slower (cloud + bridge)
- **Bridge**: Required for device communication

### **Test Cases**

#### **Test 1: Home Network with Local Broker Running**

1. Connect to home WiFi (192.168.0.x)
2. Ensure local MQTT broker is running on 192.168.0.100:9001
3. Open app → Settings → MQTT Bridge
4. **Expected**:
   - Network Status: 🏠 "Home Network (WiFiName)"
   - Broker Info: "Will try local broker first"
   - MQTT Status: "Connected (LOCAL)"
   - Fast device control

#### **Test 2: Home Network with Local Broker Down**

1. Connect to home WiFi (192.168.0.x)
2. Turn off local MQTT broker (192.168.0.100)
3. Open app → Settings → MQTT Bridge
4. **Expected**:
   - Network Status: 🏠 "Home Network (WiFiName)"
   - Broker Info: "Will try local broker first, then cloud"
   - MQTT Status: "Connected (CLOUD)"
   - Device control via cloud + bridge

#### **Test 3: External Network**

1. Use mobile data or different WiFi
2. Open app → Settings → MQTT Bridge
3. **Expected**:
   - Network Status: 🌐 "External Network"
   - Broker Info: "Will try local broker first, then cloud"
   - MQTT Status: "Connected (CLOUD)"
   - Device control via cloud + bridge

### **Console Logs**

The app will show these logs during broker selection:

```
Detecting best available MQTT broker...
Testing local broker (192.168.0.100) first...
✅ Local broker (192.168.0.100) is reachable
```

OR

```
Detecting best available MQTT broker...
Testing local broker (192.168.0.100) first...
❌ Local broker (192.168.0.100) not reachable, switching to cloud broker...
✅ Cloud broker is available
```

### **Benefits of New Logic**

1. **Always Optimal**: Always tries fastest option (local) first
2. **Automatic Fallback**: Seamlessly switches to cloud if local unavailable
3. **No Network Dependency**: Works regardless of network type
4. **Consistent Behavior**: Same logic everywhere
5. **Better Performance**: Uses local broker whenever possible

### **Visual Indicators**

#### **Network Status Section Shows:**

- **Network Type**: Home Network vs External Network
- **IP Address**: Current device IP
- **Broker Strategy**: "Will try local broker first" or "Will try local broker first, then cloud"
- **Current Broker**: Shows which broker is actually connected

### **Troubleshooting**

#### **If Local Broker Not Detected:**

1. Check if MQTT broker is running on 192.168.0.100:9001
2. Verify firewall settings allow port 9001
3. Check if broker is accessible from device
4. Look at console logs for connection errors

#### **If Cloud Broker Not Working:**

1. Check internet connection
2. Verify cloud broker credentials
3. Check if bridge is configured correctly
4. Test bridge functionality

### **Success Indicators**

✅ **Local Broker Working**: Fast device response, "Connected (LOCAL)" status
✅ **Cloud Broker Fallback**: Device control works, "Connected (CLOUD)" status  
✅ **Automatic Switching**: No manual intervention needed
✅ **Consistent Performance**: Works on any network
✅ **Clear Indicators**: Network status shows broker strategy

