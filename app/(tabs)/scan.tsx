import { CameraView, useCameraPermissions } from 'expo-camera';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth';
import { registerAttendance } from '@/lib/attendance';

import AppButton from '@/components/AppButton';
import { useTheme } from '@/lib/theme';
import type { Palette, Radius } from '@/constants/themes';

export default function ScanScreen() {
  const { user } = useAuth();
  const { colors, radius } = useTheme();
  const styles = makeStyles(colors, radius);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const scanLine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLine]);

  if (!permission) {
    return <View style={[styles.container, styles.permissionFallback]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionFallback]}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={34} color={colors.primary} />
        </View>
        <Text style={styles.title}>Camera Permission Needed</Text>
        <Text style={styles.subtitle}>
          We need access to your camera to scan QR codes.
        </Text>
        <AppButton
          theme="primary"
          title="Grant Permission"
          icon="camera"
          onPress={requestPermission}
        />
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    // Ignore any scan that fires while a previous one is still resolving.
    if (scanned) return;

    setScanned(true);
    setLastData(data);
    setMessage('Checking QR code...');
    setSuccess(false);

    const studentId = user?.id;
    if (!studentId) {
      setSuccess(false);
      setMessage('You must be signed in to record attendance.');
      return;
    }

    registerAttendance(data, studentId)
      .then((result) => {
        setMessage(result.message || 'not QR event code');
        setSuccess(result.success);
      })
      .catch(() => {
        setMessage('not QR event code');
        setSuccess(false);
      });
  };

  const handleScanAgain = () => {
    setScanned(false);
    setLastData(null);
    setMessage(null);
    setSuccess(false);
  };

  const lineStyle = {
    transform: [
      {
        translateY: scanLine.interpolate({
          inputRange: [0, 1],
          outputRange: [-96, 96],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View pointerEvents="none" style={styles.frame}>
        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />
        {!scanned && (
          <Animated.View style={[styles.scanLine, lineStyle]} />
        )}
      </View>

      <View style={styles.overlay}>
        <View style={styles.overlayHandle} />
        <View style={styles.overlayHead}>
          <Ionicons
            name={scanned ? 'scan-outline' : 'qr-code-outline'}
            size={18}
            color={colors.primary}
          />
          <Text style={styles.overlayText}>
            {scanned ? 'QR Code detected!' : 'Point your camera at a QR code'}
          </Text>
        </View>

        {!scanned && (
          <Text style={styles.overlayHint}>
            Hold steady — attendance is recorded automatically.
          </Text>
        )}

        {scanned && message && (
          <View
            style={[
              styles.resultBox,
              {
                backgroundColor: success ? colors.success + '1A' : colors.danger + '1A',
                borderColor: success ? colors.success + '59' : colors.danger + '59',
              },
            ]}
          >
            <Ionicons
              name={success ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={success ? colors.success : colors.danger}
            />
            <Text
              style={[
                styles.scanResult,
                success ? styles.success : styles.error,
              ]}
            >
              {message}
            </Text>
          </View>
        )}

        {scanned && lastData && (
          <Text style={styles.scanData} numberOfLines={2}>
            {lastData}
          </Text>
        )}

        {scanned && (
          <AppButton
            theme="primary"
            title="Scan Again"
            icon="refresh"
            onPress={handleScanAgain}
          />
        )}
      </View>
    </View>
  );
}

const makeStyles = (c: Palette, r: Radius) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#05070C',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    permissionFallback: {
      backgroundColor: c.background,
    },
    permissionIcon: {
      width: 74,
      height: 74,
      borderRadius: 37,
      backgroundColor: c.tint,
      borderWidth: 1.5,
      borderColor: c.primary + '59',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: c.textPrimary,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 16,
    },
    camera: {
      ...StyleSheet.absoluteFillObject,
    },
    frame: {
      alignSelf: 'center',
      width: 220,
      height: 220,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: 'transparent',
      marginBottom: 110,
    },
    corner: {
      position: 'absolute',
      width: 44,
      height: 44,
      borderColor: c.primary,
      borderRadius: 4,
    },
    cornerTopLeft: {
      top: 0,
      left: 0,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderTopLeftRadius: 24,
    },
    cornerTopRight: {
      top: 0,
      right: 0,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderTopRightRadius: 24,
    },
    cornerBottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderBottomLeftRadius: 24,
    },
    cornerBottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderBottomRightRadius: 24,
    },
    scanLine: {
      position: 'absolute',
      left: 12,
      right: 12,
      top: 106,
      height: 3,
      borderRadius: 3,
      backgroundColor: c.primary,
      shadowColor: c.primary,
      shadowOpacity: 0.9,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
      elevation: 6,
    },
    overlay: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 60,
      backgroundColor: c.card,
      borderRadius: r.card,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      alignItems: 'center',
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: c.shadowOpacity,
      shadowRadius: 16,
      elevation: 8,
    },
    overlayHandle: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      marginBottom: 12,
    },
    overlayHead: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    overlayText: {
      fontSize: 16,
      fontWeight: '800',
      color: c.textPrimary,
      marginLeft: 8,
      textAlign: 'center',
    },
    overlayHint: {
      fontSize: 13,
      color: c.muted,
      marginBottom: 4,
      textAlign: 'center',
    },
    resultBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: r.input,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 8,
      marginBottom: 8,
      width: '100%',
    },
    scanResult: {
      fontSize: 14,
      textAlign: 'left',
      fontWeight: '700',
      marginLeft: 8,
      flexShrink: 1,
    },
    success: { color: c.success },
    error: { color: c.danger },
    scanData: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: c.muted,
      textAlign: 'center',
      marginBottom: 12,
      width: '100%',
    },
  });
