# Debug Device Control Issue

## 🔍 **Debugging Steps**

The MQTT connection is working, but device control isn't working. Let's debug this step by step.

### **Step 1: Test Device Control with Logging**

1. **Open your app** and go to a room with a light
2. **Try to toggle a light switch**
3. **Check the console logs** - you should see:

```
Device control - Broker: cloud, UseCloud: true
Publishing to topic: cloud/room1/light_control/light_switch/set, message: ON
📤 Publishing MQTT message - Topic: cloud/room1/light_control/light_switch/set, Message: ON, QoS: 1
✅ MQTT message sent successfully
```

### **Step 2: Check What Topics Are Being Used**

The app should be publishing to **cloud topics** when connected to cloud broker:

- **Light Control**: `cloud/room1/light_control/light_switch/set`
- **AC Control**: `cloud/room1/ac/cmnd/POWER`

### **Step 3: Verify MQTT Bridge is Working**

#### **3.1 Test Bridge Functionality**

1. Go to **Settings → MQTT Bridge**
2. Click **"Test Bridge"** button
3. **Expected Results**:
   - **Local Broker**: ❌ Failed (not reachable from external network)
   - **Cloud Broker**: ✅ Reachable
   - **Cloud → Local**: ✅ Working (via bridge)
   - **Local → Cloud**: ✅ Working (via bridge)

#### **3.2 If Bridge Test Fails**

The issue is likely that your MQTT bridge isn't working properly. Check:

- Is the MQTT bridge running on your local network?
- Is the bridge configured correctly?
- Are the bridge topics configured properly?

### **Step 4: Check Bridge Configuration**

Your bridge should be configured to forward messages between:

- **Outgoing**: `room1/#` → `cloud/room1/#`
- **Incoming**: `cloud/room1/#` → `room1/#`

### **Step 5: Test Message Flow**

#### **5.1 Expected Message Flow**

1. **App publishes**: `cloud/room1/light_control/light_switch/set` → `ON`
2. **Bridge receives**: Message from cloud broker
3. **Bridge forwards**: `room1/light_control/light_switch/set` → `ON`
4. **Device receives**: Command from local broker
5. **Device responds**: `room1/light_control/light_switch/state` → `ON`
6. **Bridge forwards**: `cloud/room1/light_control/light_switch/state` → `ON`
7. **App receives**: State update

#### **5.2 Check for Received Messages**

Look for logs like:

```
📥 Received MQTT message - Topic: cloud/room1/light_control/light_switch/state, Message: ON
```

### **Step 6: Common Issues**

#### **Issue 1: Bridge Not Running**

- **Symptom**: Bridge test fails
- **Solution**: Start MQTT bridge on local network

#### **Issue 2: Bridge Configuration Wrong**

- **Symptom**: Messages sent but not received
- **Solution**: Check bridge topic configuration

#### **Issue 3: Device Not Connected**

- **Symptom**: Messages sent but device doesn't respond
- **Solution**: Check if device is connected to local broker

#### **Issue 4: Wrong Topics**

- **Symptom**: Messages sent to wrong topics
- **Solution**: Verify topic patterns match device expectations

### **Step 7: Manual Testing**

#### **7.1 Test with MQTT Client**

Use an MQTT client to test the bridge manually:

1. **Connect to Cloud Broker**: `f6ce8c16ab1f4b958a2179d249d62bf3.s2.eu.hivemq.cloud:8884`
2. **Subscribe to**: `cloud/room1/light_control/light_switch/state`
3. **Publish to**: `cloud/room1/light_control/light_switch/set` → `ON`
4. **Check if**: You receive the state update

#### **7.2 Test Local Broker**

1. **Connect to Local Broker**: `192.168.0.100:9001` (from home network)
2. **Subscribe to**: `room1/light_control/light_switch/state`
3. **Publish to**: `room1/light_control/light_switch/set` → `ON`
4. **Check if**: Device responds

### **Step 8: Debug Information**

#### **8.1 Check App Logs**

Look for these logs when testing:

```
Device control - Broker: cloud, UseCloud: true
Publishing to topic: cloud/room1/light_control/light_switch/set, message: ON
📤 Publishing MQTT message - Topic: cloud/room1/light_control/light_switch/set, Message: ON, QoS: 1
✅ MQTT message sent successfully
```

#### **8.2 Check for Errors**

Look for any error messages:

```
❌ Error publishing MQTT message: [error details]
MQTT not connected. Cannot publish message.
```

### **Step 9: Next Steps**

1. **Test device control** and check console logs
2. **Run bridge test** to verify bridge functionality
3. **Check bridge configuration** if bridge test fails
4. **Verify device connection** to local broker
5. **Test message flow** manually if needed

The most likely issue is that the MQTT bridge isn't working properly or isn't configured correctly to forward messages between the cloud and local brokers.

