# Environment Variables Setup

This project uses environment variables to manage sensitive configuration data like MQTT credentials, network settings, and other app-specific configurations.

## Setup Instructions

1. **Copy the example file:**

   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file** with your actual values:
   ```bash
   nano .env  # or use your preferred editor
   ```

## Environment Variables

> **Expo Router Compatibility:** Expo CLI only exposes variables prefixed with
> `EXPO_PUBLIC_`. Define each key below in your `.env` as
> `EXPO_PUBLIC_<KEY>` (for example, `EXPO_PUBLIC_LOCAL_MQTT_HOST`). The app
> automatically strips the prefix when reading values.

### MQTT Configuration

#### Local MQTT Broker

- `LOCAL_MQTT_HOST`: IP address of your local MQTT broker
- `LOCAL_MQTT_PORT`: Port number for local MQTT broker
- `LOCAL_MQTT_USERNAME`: Username for local MQTT broker
- `LOCAL_MQTT_PASSWORD`: Password for local MQTT broker
- `LOCAL_MQTT_CLIENT_ID_PREFIX`: Prefix for MQTT client IDs
- `LOCAL_MQTT_USE_SSL`: Whether to use SSL (true/false)
- `LOCAL_MQTT_KEEP_ALIVE`: Keep alive interval in seconds

#### Cloud MQTT Broker

- `CLOUD_MQTT_HOST`: Hostname of your cloud MQTT broker
- `CLOUD_MQTT_PORT`: Port number for cloud MQTT broker
- `CLOUD_MQTT_USERNAME`: Username for cloud MQTT broker
- `CLOUD_MQTT_PASSWORD`: Password for cloud MQTT broker
- `CLOUD_MQTT_CLIENT_ID_PREFIX`: Prefix for MQTT client IDs
- `CLOUD_MQTT_USE_SSL`: Whether to use SSL (true/false)
- `CLOUD_MQTT_KEEP_ALIVE`: Keep alive interval in seconds

### Network Detection

- `LOCAL_BROKER_IP`: IP address of your local MQTT broker for network detection
- `LOCAL_NETWORK_SSIDS`: Comma-separated list of local network SSIDs
- `LOCAL_NETWORK_SUBNETS`: Comma-separated list of local network subnets

### MQTT Topics

- `TOPIC_BASE_LOCATION`: Base topic for local broker
- `TOPIC_BASE_CLOUD_LOCATION`: Base topic for cloud broker
- `TOPIC_CONTROLLER`: Controller topic segment
- `TOPIC_AC_BASE`: AC device base topic

### App Configuration

- `APP_NAME`: Application name
- `APP_VERSION`: Application version
- `STORAGE_KEY`: Key for AsyncStorage persistence

### Debug Settings

- `DEBUG_MQTT`: Enable MQTT debug logging (true/false)
- `DEBUG_NETWORK`: Enable network debug logging (true/false)

## Security Notes

- **Never commit the .env file** - it's already in .gitignore
- **Use .env.example** as a template for team members
- **Rotate credentials regularly** for production environments
- **Use different credentials** for development, staging, and production

## Development vs Production

### Development

- Use local MQTT broker for testing
- Enable debug logging
- Use development-specific credentials

### Production

- Use cloud MQTT broker for reliability
- Disable debug logging
- Use production credentials
- Ensure SSL is enabled for cloud broker

## Troubleshooting

### Common Issues

1. **Environment variables not loading:**

   - Ensure babel.config.js is properly configured
   - Restart the development server
   - Check that .env file exists and has correct format

2. **MQTT connection issues:**

   - Verify MQTT broker credentials
   - Check network connectivity
   - Ensure ports are not blocked

3. **Network detection not working:**
   - Verify LOCAL_BROKER_IP matches your actual broker IP
   - Check LOCAL_NETWORK_SSIDS includes your network name
   - Ensure LOCAL_NETWORK_SUBNETS includes your subnet

### Debug Mode

Enable debug logging by setting:

```
DEBUG_MQTT=true
DEBUG_NETWORK=true
```

This will provide detailed logs for troubleshooting MQTT and network detection issues.
