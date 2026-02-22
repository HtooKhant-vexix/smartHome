# Smart Home Backend Server Requirements

## Overview

This document outlines the backend server requirements for the Smart Home mobile application. The current codebase is a React Native/Expo app with local authentication and MQTT integration for device control.

## Current Architecture

### Frontend (React Native/Expo)

- **Authentication**: Local AsyncStorage-based auth with demo account
- **Device Management**: Rooms, devices, and configurations stored locally
- **MQTT Integration**: WebSocket-based MQTT client for real-time device control
- **Scheduling**: Device automation with time-based triggers
- **UI Components**: Modern React Native UI with device cards, controls, and settings

### Key Features Implemented

- ✅ User authentication (login/register)
- ✅ Room and device management
- ✅ Real-time device control via MQTT
- ✅ Device scheduling and automation
- ✅ MQTT sensor data integration
- ✅ Responsive UI design

## Backend Server Requirements

### 1. Authentication & User Management

#### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- User sessions table (for JWT tokens)
CREATE TABLE user_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### API Endpoints

```typescript
// Authentication APIs
POST /api/auth/login          // Email/password login
POST /api/auth/register       // User registration
POST /api/auth/logout         // Logout user
GET  /api/auth/me            // Get current user info
POST /api/auth/refresh       // Refresh JWT token

// User Management APIs
GET  /api/users              // Get all users (admin only)
PUT  /api/users/:id          // Update user profile
DELETE /api/users/:id        // Delete user (admin only)
```

### 2. Device Management

#### Database Schema

```sql
-- Rooms table
CREATE TABLE rooms (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Devices table
CREATE TABLE devices (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  room_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('smart-light', 'smart-ac', 'smart-tv', 'air-purifier') NOT NULL,
  device_id VARCHAR(255) NOT NULL, -- Hardware device identifier
  wifi_config JSON, -- WiFi credentials and settings
  is_active BOOLEAN DEFAULT FALSE,
  last_connected TIMESTAMP NULL,
  status VARCHAR(50) DEFAULT 'offline',
  settings JSON, -- Device-specific settings (AC settings, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Device schedules table
CREATE TABLE device_schedules (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  output_number INT NOT NULL,
  action ENUM('on', 'off') NOT NULL,
  arm_mode ENUM('disarm', 'arm') DEFAULT 'arm',
  repeat_mode ENUM('once', 'repeat') DEFAULT 'repeat',
  time_type ENUM('custom', 'sunrise', 'sunset') DEFAULT 'custom',
  time_value TIME, -- For custom times
  sunrise_time TIME, -- Calculated sunrise time
  sunset_time TIME,  -- Calculated sunset time
  days_of_week JSON, -- Array of enabled days
  mqtt_topic VARCHAR(255), -- MQTT topic for this output
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);
```

#### API Endpoints

```typescript
// Room Management APIs
GET    /api/rooms                    // Get user's rooms
POST   /api/rooms                    // Create new room
PUT    /api/rooms/:id                // Update room
DELETE /api/rooms/:id                // Delete room

// Device Management APIs
GET    /api/devices                  // Get all user's devices
GET    /api/rooms/:roomId/devices    // Get devices in specific room
POST   /api/devices                  // Add device to room
PUT    /api/devices/:id              // Update device
DELETE /api/devices/:id              // Remove device
POST   /api/devices/:id/setup        // Setup device WiFi/config

// Device Control APIs
POST   /api/devices/:id/toggle       // Toggle device on/off
POST   /api/devices/:id/brightness   // Set brightness (for lights)
POST   /api/devices/:id/color        // Set RGB color (for RGB lights)
POST   /api/devices/:id/ac/control    // Control AC (temp, mode, fan speed)

// Device Scheduling APIs
GET    /api/devices/:id/schedules    // Get device schedules
POST   /api/schedules                // Create schedule
PUT    /api/schedules/:id            // Update schedule
DELETE /api/schedules/:id            // Delete schedule
```

### 3. MQTT Broker Integration

#### MQTT Topics Structure

```javascript
// Device Control Topics
const TOPIC_BASE = {
  location: 'local/room1', // Can be dynamic per room
  controller: 'light_control',
  acBase: 'local/room1/ac',
};

// Switch Control Topics
-`${location}/${controller}/light_switch/set` - // ON/OFF commands
  `${location}/${controller}/light_switch/state` - // Current state
  `${location}/${controller}/AC_switch/set` -
  `${location}/${controller}/socket_switch/set` -
  `${location}/${controller}/rgb_light/set` -
  // AC Control Topics
  `${acBase}/cmnd/POWER` - // ON/OFF
  `${acBase}/cmnd/TEMPERATURE` - // Temperature setting
  `${acBase}/cmnd/MODE` - // AC mode (cool/heat/auto/dry/fan)
  `${acBase}/cmnd/FAN` - // Fan speed
  `${acBase}/cmnd/SWINGV` - // Vertical swing
  `${acBase}/cmnd/SWINGH` - // Horizontal swing
  // Status Topics
  `${acBase}/stat/RESULT` - // Full AC status
  `${acBase}/tele/STATE` - // AC state updates
  `${acBase}/tele/LWT` - // Last Will Testament (online/offline)
  `${acBase}/tele/SENSOR`; // Temperature/humidity sensor data
```

#### Backend MQTT Handler Requirements

```typescript
// MQTT Message Handler Interface
interface MQTTMessageHandler {
  onDeviceStateChange(topic: string, payload: string): void;
  onACStatusUpdate(topic: string, payload: string): void;
  onSensorDataUpdate(topic: string, payload: string): void;
  onDeviceConnection(topic: string, payload: string): void;
}

// Device State Management
- Track device online/offline status
- Store current device states (on/off, brightness, temperature, etc.)
- Handle device configuration updates
- Process sensor data from devices
```

### 4. Real-time Data & WebSocket Support

#### WebSocket API for Real-time Updates

```typescript
// WebSocket Events
interface WebSocketEvents {
  // Device updates
  'device:state:changed': { deviceId: string; state: any };
  'device:connected': { deviceId: string; timestamp: string };
  'device:disconnected': { deviceId: string; timestamp: string };

  // Sensor data
  'sensor:temperature': { deviceId: string; value: number; timestamp: string };
  'sensor:humidity': { deviceId: string; value: number; timestamp: string };

  // Schedule execution
  'schedule:executed': { scheduleId: string; deviceId: string; action: string };

  // User notifications
  'notification:new': { type: string; message: string; data?: any };
}
```

#### API Endpoints for Real-time Data

```typescript
// Real-time Data APIs
GET  /api/realtime/status          // Get current system status
GET  /api/devices/:id/history      // Get device state history
GET  /api/sensors/history          // Get sensor data history
GET  /api/schedules/executions     // Get schedule execution logs

// WebSocket Connection
WS /api/realtime                   // WebSocket endpoint for real-time updates
```

### 6. Sensor Data Management

#### Database Schema for Sensor Data

```sql
-- Sensor readings table
CREATE TABLE sensor_readings (
  id VARCHAR(255) PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  sensor_type ENUM('temperature', 'humidity', 'motion', 'light', 'air_quality') NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  INDEX idx_device_timestamp (device_id, timestamp),
  INDEX idx_sensor_type (sensor_type, timestamp),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Aggregated sensor data (for analytics)
CREATE TABLE sensor_aggregates (
  id VARCHAR(255) PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  sensor_type ENUM('temperature', 'humidity', 'motion', 'light', 'air_quality') NOT NULL,
  period_type ENUM('hourly', 'daily', 'weekly', 'monthly') NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  avg_value DECIMAL(10,2),
  min_value DECIMAL(10,2),
  max_value DECIMAL(10,2),
  count_readings INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_period (device_id, sensor_type, period_type, period_start),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);
```

#### Sensor Data APIs

```typescript
// Sensor Data APIs
GET  /api/sensors/data              // Get latest sensor readings
GET  /api/sensors/:type/data        // Get specific sensor type data
GET  /api/sensors/history           // Get historical sensor data
GET  /api/sensors/analytics         // Get sensor analytics
POST /api/sensors/alerts            // Configure sensor alerts
```

### 7. Analytics & Reporting

#### Database Schema for Analytics

```sql
-- Device usage statistics
CREATE TABLE device_usage_stats (
  id VARCHAR(255) PRIMARY KEY,
  device_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  total_on_time_minutes INT DEFAULT 0,
  energy_consumption_kwh DECIMAL(10,3) DEFAULT 0,
  interactions_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_date (device_id, date),
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- System analytics
CREATE TABLE system_analytics (
  id VARCHAR(255) PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  metric_unit VARCHAR(20),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_metric_name (metric_name, recorded_at)
);
```

#### Analytics APIs

```typescript
// Analytics APIs
GET / api / analytics / devices; // Device usage analytics
GET / api / analytics / energy; // Energy consumption data
GET / api / analytics / schedules; // Schedule effectiveness
GET / api / analytics / system; // Overall system metrics
GET / api / analytics / reports; // Generate reports
```

### 8. Notification System

#### Database Schema for Notifications

```sql
-- Notifications table
CREATE TABLE notifications (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type ENUM('device', 'schedule', 'system', 'security') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON, -- Additional notification data
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notification settings
CREATE TABLE notification_settings (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  settings JSON, -- Type-specific settings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Notification APIs

```typescript
// Notification APIs
GET    /api/notifications              // Get user notifications
PUT    /api/notifications/:id/read     // Mark notification as read
DELETE /api/notifications/:id          // Delete notification
GET    /api/notifications/settings     // Get notification settings
PUT    /api/notifications/settings     // Update notification settings
POST   /api/notifications/test         // Send test notification
```

## Implementation Technologies

### Security Considerations

- **JWT authentication** with proper expiration
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **CORS configuration** for web clients
- **Database encryption** for sensitive data
- **API versioning** for backward compatibility

### Deployment Architecture

```bash
# Production Deployment
- Docker containers for all services
- Load balancer (nginx) for API distribution
- Redis cluster for session management
- PostgreSQL with replication
- MQTT broker cluster for scalability
- Monitoring with Prometheus/Grafana
```

## Migration from Current Demo

### Current Demo Limitations

- **Local authentication** only (AsyncStorage)
- **No persistent data** across app reinstalls
- **No real device control** (MQTT topics not connected to hardware)
- **No user management** beyond demo account
- **No analytics** or historical data

### Migration Steps

1. **Set up backend infrastructure** (database, MQTT broker, etc.)
2. **Implement user authentication** with proper password hashing
3. **Create device registration system** for hardware devices
4. **Implement real MQTT device control** with hardware integration
5. **Add sensor data collection** and storage
6. **Implement scheduling execution** on backend
7. **Add analytics and reporting** features

## API Response Formats

### Standard Response Format

```typescript
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    details: string;
  };
  timestamp: string;
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code:
      | 'VALIDATION_ERROR'
      | 'AUTHENTICATION_ERROR'
      | 'NOT_FOUND'
      | 'SERVER_ERROR';
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

## Testing Requirements

### Unit Tests

- API endpoint testing
- Database operation testing
- MQTT message handling testing
- Authentication flow testing

### Integration Tests

- Full user registration/login flow
- Device setup and configuration
- MQTT communication with mock devices
- Real-time data updates

### End-to-End Tests

- Complete user journey from registration to device control
- Multi-device scenarios
- Error handling and recovery
