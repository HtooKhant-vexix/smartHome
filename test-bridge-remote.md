# Testing MQTT Bridge from External Network

## 🧪 **Remote Bridge Testing Guide**

This guide helps you test the MQTT bridge functionality when you're not on your local network.

### **Prerequisites**

- Your local MQTT broker with bridge is running
- Bridge is configured to forward `room1/#` in both directions
- Your app is connected to the cloud broker

### **Testing Steps**

#### **1. Connect to Cloud Broker**

1. Open your app
2. Go to **Settings** → **MQTT Bridge**
3. Click **Switch to Cloud** to connect to the cloud broker
4. Verify status shows "Connected" to cloud broker

#### **2. Test Device Control**

1. Go to **Home** → **Rooms** → Select your room
2. Try toggling devices (lights, AC, etc.)
3. Check if commands are sent to `room1/light_control/...` topics (same for both brokers)
4. Verify devices respond (if bridge is working)

#### **3. Test Bridge Functionality**

1. In Settings, click **Test Bridge**
2. The test will:
   - Publish to `room1/bridge/test` on local broker
   - Publish to `room1/bridge/test` on cloud broker (bridge forwards both directions)
   - Check if messages are bridged between brokers

#### **4. Expected Results**

**✅ Bridge Working:**

- Local → Cloud: ✅ Working
- Cloud → Local: ✅ Working
- Overall: Success

**❌ Bridge Not Working:**

- Local → Cloud: ❌ Failed
- Cloud → Local: ❌ Failed
- Overall: Failed
- Error: "Bridge test timeout - messages not received"

### **Troubleshooting**

#### **If Bridge Test Fails:**

1. **Check Local Broker Bridge Status:**

   ```bash
   # SSH into your local broker
   sudo journalctl -u mosquitto -f
   ```

2. **Verify Bridge Configuration:**

   ```bash
   # Check if bridge is connected
   mosquitto_sub -h localhost -t '$SYS/broker/connection/+/state' -v
   ```

3. **Test Manual Bridge:**

   ```bash
   # On local broker, publish to local topic
   mosquitto_pub -h localhost -t "room1/test" -m "hello from local"

   # Check if it appears on cloud broker (should be forwarded by bridge)
   # (Use HiveMQ WebSocket client or another MQTT client)
   ```

#### **If Device Control Doesn't Work:**

1. **Check Topic Patterns:**

   - Commands should go to `room1/light_control/...` (same for both brokers)
   - States should come from `room1/light_control/...` (same for both brokers)

2. **Verify Bridge Topics:**

   - Bridge should forward `room1/#` → cloud
   - Bridge should forward `room1/#` → local (both directions use same pattern)

3. **Check Device Connectivity:**
   - Ensure devices are connected to local broker
   - Verify devices are subscribed to correct topics

### **Topic Structure**

**Bridge Configuration**: `room1/#` forwarding in both directions

**Same topics used for both brokers:**

- Commands: `room1/light_control/light_switch/set`
- States: `room1/light_control/light_switch/state`
- AC Commands: `room1/ac/cmnd/POWER`
- AC States: `room1/ac/stat/RESULT`

**Bridge Message Flow:**

1. App publishes to `room1/light_control/AC_switch/set` → `ON`
2. Cloud broker receives message
3. Bridge forwards to local broker: `room1/light_control/AC_switch/set` → `ON`
4. Device receives and responds: `room1/light_control/AC_switch/state` → `ON`
5. Bridge forwards back to cloud: `room1/light_control/AC_switch/state` → `ON`
6. App receives state update

### **Success Indicators**

✅ **App shows "Connected" to cloud broker**
✅ **Bridge test shows both directions working**
✅ **Device controls work from external network**
✅ **Device states update in real-time**
✅ **No timeout errors in bridge test**

### **Next Steps**

Once bridge testing is successful:

1. Your app will work from anywhere via cloud broker
2. Local network will use local broker for faster response
3. External networks will use cloud broker with bridge
4. All device states will stay synchronized
