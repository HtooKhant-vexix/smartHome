import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSmartHomeStore } from '@/store/useSmartHomeStore';
import { Device } from '@/constants/defaultData';
import { 
  Camera, 
  CameraOff, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Aperture,
  Mic,
  Video
} from 'lucide-react-native';

interface SmartCameraControlsProps {
  device: Device;
}

export const SmartCameraControls = ({ device }: SmartCameraControlsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // In a real scenario, we would get the stream URL from the device attributes or a specific API
  // For now, we'll use the snapshot URL or a placeholder if not available
  // If the snapshot URL is relative (starts with /), prepend the HA URL
  const haUrl = useSmartHomeStore(state => state.haConfig?.url);
  const haToken = useSmartHomeStore(state => state.haConfig?.token);
  
  // Force use of camera_proxy_stream for video
  let streamUrl = '';
  const baseUrl = haUrl?.replace(/\/$/, '') || '';
  const isHls = device.attributes?.frontend_stream_type === 'hls';

  if (baseUrl) {
      if (isHls) {
          // Use HLS stream if available for better frame rate
          streamUrl = `${baseUrl}/api/hls/${device.id}/playlist.m3u8`;
      } else {
          // Fallback to MJPEG
          streamUrl = `${baseUrl}/api/camera_proxy_stream/${device.id}`;
      }
      
      // Use entity access token if available, otherwise try using the main token as query param
      const token = device.accessToken || haToken;
      if (token) {
          streamUrl += `?token=${token}`;
      }
  } else {
      streamUrl = device.snapshotUrl || '';
  }

  // HTML content to display the stream
  // This handles MJPEG streams better than direct URL in WebView on Android
  // For HLS, we use a video tag
  const htmlContent = `
    <html>
      <body style="margin:0;padding:0;background-color:black;display:flex;justify-content:center;align-items:center;height:100%;">
        ${isHls ? `
          <video 
            src="${streamUrl}" 
            autoplay 
            muted 
            playsinline 
            controls 
            style="width:100%;height:100%;object-fit:contain;"
            onerror="this.style.display='none'"
          ></video>
        ` : `
          <img 
            src="${streamUrl}" 
            style="width:100%;height:100%;object-fit:contain;" 
            onerror="this.style.display='none'" 
          />
        `}
      </body>
    </html>
  `;

  const handleControl = (action: string) => {
    console.log(`Action: ${action} sent to device.`);
    // haService.callService('camera', action, { entity_id: device.id });
  };

  // If no URL is available, show a placeholder
  if (!streamUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <CameraOff size={48} color="#64748b" />
          <Text style={styles.placeholderText}>No camera feed available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Camera size={24} color="#2563eb" />
        <Text style={styles.title}>Live Feed</Text>
      </View>
      
      <View style={styles.cameraContainer}>
        <WebView
          source={{ html: htmlContent, baseUrl: baseUrl }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          // For streams, onLoadEnd might not fire, so we disable loading after a short timeout
          // or rely on the fact that HTML loads quickly even if the image stream continues
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          scrollEnabled={false}
          scalesPageToFit={true}
          androidLayerType="hardware"
        />
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        )}

        {hasError && (
          <View style={styles.errorContainer}>
            <CameraOff size={32} color="#ef4444" />
            <Text style={styles.errorText}>Failed to load stream</Text>
          </View>
        )}
      </View>
      
      <View style={styles.controlsSection}>
        <Text style={styles.sectionTitle}>Camera Controls</Text>
        
        <View style={styles.controlsLayout}>
            {/* PTZ Controls */}
            <View style={styles.ptzContainer}>
                <TouchableOpacity style={styles.ptzButton} onPress={() => handleControl('pan_up')}>
                    <ChevronUp size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.ptzRow}>
                    <TouchableOpacity style={styles.ptzButton} onPress={() => handleControl('pan_left')}>
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.ptzCenter} />
                    <TouchableOpacity style={styles.ptzButton} onPress={() => handleControl('pan_right')}>
                        <ChevronRight size={24} color="white" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.ptzButton} onPress={() => handleControl('pan_down')}>
                    <ChevronDown size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleControl('snapshot')}>
                    <View style={styles.actionIcon}>
                        <Aperture size={24} color="white" />
                    </View>
                    <Text style={styles.actionText}>Snapshot</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleControl('record')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#ef4444' }]}>
                        <Video size={24} color="white" />
                    </View>
                    <Text style={styles.actionText}>Record</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleControl('talk')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#22c55e' }]}>
                        <Mic size={24} color="white" />
                    </View>
                    <Text style={styles.actionText}>Talk</Text>
                </TouchableOpacity>
            </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginLeft: 12,
  },
  cameraContainer: {
    height: 250,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  placeholder: {
    height: 250,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 12,
    color: '#94a3b8',
    fontFamily: 'Inter-Medium',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  errorText: {
    marginTop: 8,
    color: '#ef4444',
    fontFamily: 'Inter-Medium',
  },
  controlsSection: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
  controlsLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ptzContainer: {
    alignItems: 'center',
    gap: 8,
  },
  ptzRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ptzCenter: {
    width: 48,
    height: 48,
  },
  ptzButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});
