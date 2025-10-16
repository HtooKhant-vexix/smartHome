# MQTT Bridge Setup Guide

This guide explains how to set up MQTT message bridging between your local and cloud brokers to enable seamless communication.

## 🔧 **Local Broker Bridge Configuration**

### **1. Install Mosquitto (if not already installed)**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mosquitto mosquitto-clients

# Start and enable service
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
```

### **2. Create Bridge Configuration**

Create a bridge configuration file:

```bash
sudo nano /etc/mosquitto/conf.d/bridge.conf
```

Add this configuration:

```conf
# Local broker configuration
listener 1883
persistence true
persistence_location /mosquitto/data/

allow_anonymous false
password_file /mosquitto/config/passwd

# WebSocket configuration
listener 9001
protocol websockets

# Bridge to HiveMQ Cloud
connection cloud-bridge
address f6ce8c16ab1f4b958a2179d249d62bf3.s2.eu.hivemq.cloud:8883

clientid local-bridge-01
cleansession false
start_type automatic
try_private false
restart_timeout 10

remote_username smart
remote_password Asdffdsa-4580

bridge_cafile /etc/ssl/certs/ca-certificates.crt

# Topics to bridge (bidirectional forwarding)
topic room1/# out 1
topic cloud/room1/# in 1

log_type all
```

### **3. Restart Mosquitto Service**

```bash
sudo systemctl restart mosquitto
sudo systemctl status mosquitto
```

### **4. Check Bridge Status**

```bash
# Check mosquitto logs
sudo journalctl -u mosquitto -f

# Test local broker
mosquitto_pub -h 192.168.0.100 -p 1883 -t "room1/test" -m "Hello from local"
mosquitto_sub -h 192.168.0.100 -p 1883 -t "room1/+" -v
```

## 🧪 **Testing the Bridge**

### **Using the App**

1. Open the app and go to **Settings**
2. Scroll to the **MQTT Bridge** section
3. Click **Test Bridge** button
4. The test will:
   - Publish to cloud broker and check if message arrives locally
   - Publish to local broker and check if message arrives on cloud
   - Show results with ✅/❌ indicators

### **Manual Testing**

#### **Test Cloud → Local**

```bash
# Subscribe to local broker
mosquitto_sub -h 192.168.0.100 -p 1883 -t "room1/light_control/+" -v

# In another terminal, publish to cloud (using your app or another client)
# The message should appear in the local subscription
```

#### **Test Local → Cloud**

```bash
# Publish to local broker
mosquitto_pub -h 192.168.0.100 -p 1883 -t "room1/light_control/bridge/test" -m "Hello from local"

# Check if message appears on cloud broker (using HiveMQ WebSocket client or another client)
```

## 🔍 **Troubleshooting**

### **Common Issues**

1. **Bridge not connecting to cloud**

   - Check internet connection
   - Verify cloud broker credentials
   - Check firewall settings (port 8883)

2. **Messages not bridging**

   - Verify topic patterns in bridge config
   - Check mosquitto logs: `sudo journalctl -u mosquitto -f`
   - Ensure both brokers are running

3. **SSL/TLS errors**
   - Update CA certificates: `sudo apt update && sudo apt upgrade ca-certificates`
   - Check if `bridge_insecure false` is set

### **Debug Commands**

```bash
# Check mosquitto status
sudo systemctl status mosquitto

# View mosquitto logs
sudo journalctl -u mosquitto -f

# Test local broker connectivity
mosquitto_pub -h 192.168.0.100 -p 1883 -t "room1/test" -m "hello"

# Check bridge configuration
mosquitto -c /etc/mosquitto/mosquitto.conf -v
```

## 📱 **App Configuration**

The app is configured with:

- **Local Broker**: `192.168.0.100:1883` (Standard MQTT)
- **Cloud Broker**: `f6ce8c16ab1f4b958a2179d249d62bf3.s2.eu.hivemq.cloud:8883`
- **Credentials**: `smart` / `Asdffdsa-4580`

### **Topic Structure**

The bridge is configured to forward topics matching:

- `room1/#` (all room1 topics out to cloud)
- `cloud/room1/#` (cloud topics in to local)

**Topic Structure**: The app uses different topic patterns based on which broker it's connected to.

This covers all your device control topics like:

#### **When Connected to Local Broker:**

- `room1/light_control/light_switch/set` (Light 1)
- `room1/light_control/AC_switch/set` (AC Power Switch)
- `room1/light_control/socket_switch/set` (Socket)
- `room1/light_control/rgb_light/set` (RGB Light)
- `room1/light_control/light_switch/state` (Light states)

#### **When Connected to Cloud Broker:**

- `cloud/room1/light_control/light_switch/set` (Light 1)
- `cloud/room1/light_control/AC_switch/set` (AC Power Switch)
- `cloud/room1/light_control/socket_switch/set` (Socket)
- `cloud/room1/light_control/rgb_light/set` (RGB Light)
- `cloud/room1/light_control/light_switch/state` (Light states)

#### **AC Control Topics:**

**When Connected to Local Broker:**

- `room1/ac/cmnd/POWER` (Power on/off)
- `room1/ac/cmnd/TEMPERATURE` (Temperature setting)
- `room1/ac/cmnd/MODE` (Cool/Heat/Auto/Dry/Fan)
- `room1/ac/cmnd/FAN` (Fan speed)
- `room1/ac/cmnd/SWINGV` (Vertical swing)
- `room1/ac/cmnd/SWINGH` (Horizontal swing)

**When Connected to Cloud Broker:**

- `cloud/room1/ac/cmnd/POWER` (Power on/off)
- `cloud/room1/ac/cmnd/TEMPERATURE` (Temperature setting)
- `cloud/room1/ac/cmnd/MODE` (Cool/Heat/Auto/Dry/Fan)
- `cloud/room1/ac/cmnd/FAN` (Fan speed)
- `cloud/room1/ac/cmnd/SWINGV` (Vertical swing)
- `cloud/room1/ac/cmnd/SWINGH` (Horizontal swing)

**State Topics (Same for both brokers):**

- `room1/ac/stat/RESULT` (AC status)
- `room1/ac/tele/STATE` (AC telemetry)
- `room1/ac/tele/SENSOR` (Temperature/humidity sensors)

### **Message Flow**

#### **From External Network (Cloud Mode):**

**Light Control Example:**

1. App publishes to: `cloud/room1/light_control/AC_switch/set` → `ON`
2. Cloud broker receives message
3. Bridge forwards to local broker: `room1/light_control/AC_switch/set` → `ON`
4. Device receives command and responds: `room1/light_control/AC_switch/state` → `ON`
5. Bridge forwards back to cloud: `cloud/room1/light_control/AC_switch/state` → `ON`
6. App receives state update

**AC Control Example:**

1. App publishes to: `cloud/room1/ac/cmnd/POWER` → `ON`
2. Cloud broker receives message
3. Bridge forwards to local broker: `room1/ac/cmnd/POWER` → `ON`
4. AC receives command and responds: `room1/ac/stat/RESULT` → `{"power": true, ...}`
5. Bridge forwards back to cloud: `cloud/room1/ac/stat/RESULT` → `{"power": true, ...}`
6. App receives state update

#### **From Home Network (Local Mode):**

**Light Control Example:**

1. App publishes directly to: `room1/light_control/AC_switch/set` → `ON`
2. Local broker receives message
3. Device receives command and responds: `room1/light_control/AC_switch/state` → `ON`
4. App receives state update

**AC Control Example:**

1. App publishes directly to: `room1/ac/cmnd/POWER` → `ON`
2. Local broker receives message
3. AC receives command and responds: `room1/ac/stat/RESULT` → `{"power": true, ...}`
4. App receives state update

## ✅ **Verification**

Once set up correctly, you should see:

1. **App Settings**: MQTT Bridge section shows both brokers as reachable
2. **Bridge Test**: Both "Local → Cloud" and "Cloud → Local" show ✅ with `room1/#` topics
3. **Real-time Control**: Devices can be controlled from anywhere via cloud broker
4. **Local Fallback**: When on local network, app automatically uses local broker for faster response
5. **Topic Consistency**: Same topic structure (`room1/...`) used for both brokers
6. **No Cloud Prefix**: Topics don't have "cloud/" prefix when connected to cloud broker

## 🚀 **Benefits**

- **Seamless Control**: Control devices from anywhere via cloud broker + bridge
- **Local Performance**: Fast local control when on home network (direct connection)
- **Automatic Switching**: App automatically chooses best available broker based on network
- **Reliability**: Fallback to cloud when local network is unavailable
- **Real-time Sync**: All devices stay in sync regardless of connection method
- **Simple Configuration**: Same topic structure for both brokers (no conditional logic)
- **Bridge Compatibility**: Perfect match with your `room1/#` bridge configuration
