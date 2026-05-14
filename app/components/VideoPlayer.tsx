import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet,
  TouchableWithoutFeedback, Animated,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  uri: string;
  onBack: () => void;
}

const CONTROLS_HIDE_DELAY = 3000;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function VideoPlayer({ uri, onBack }: Props) {
  const { bottom: safeBottom } = useSafeAreaInsets();
  const videoRef = useRef<VideoView>(null);
  const opacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const player = useVideoPlayer(uri ? { uri } : null, p => { p?.play(); });

  const showControls = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setControlsVisible(true);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      setControlsVisible(false);
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }, CONTROLS_HIDE_DELAY);
  }, [opacity]);

  // Start auto-hide on mount
  useEffect(() => {
    showControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [showControls]);

  useEffect(() => {
    if (!player) return;
    const subs = [
      player.addListener('playingChange', ({ isPlaying: p }: any) => setIsPlaying(p)),
      player.addListener('timeUpdate', ({ currentTime: t }: any) => setCurrentTime(t ?? 0)),
      player.addListener('statusChange', () => setDuration(player.duration ?? 0)),
    ];
    return () => subs.forEach(s => s.remove());
  }, [player]);

  if (!uri) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>无法播放视频</Text>
      </View>
    );
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={showControls}>
        <View style={styles.wrapper}>
          <VideoView ref={videoRef} player={player} style={styles.video} contentFit="contain" nativeControls={false} />

          {/* Back — always visible above controls */}
          <TouchableOpacity testID="back-button" style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          {/* Controls overlay */}
          <Animated.View style={[styles.controls, { opacity, paddingBottom: 12 + safeBottom }]} pointerEvents={controlsVisible ? 'auto' : 'none'}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { flex: progress }]} />
              <View style={[styles.progressRemainder, { flex: 1 - progress }]} />
            </View>
            <View style={styles.row}>
              <TouchableOpacity testID="play-pause-button" onPress={() => isPlaying ? player?.pause() : player?.play()}>
                <Text style={styles.icon}>{isPlaying ? '⏸' : '▶'}</Text>
              </TouchableOpacity>
              <Text style={styles.time}>{formatTime(currentTime)} / {formatTime(duration)}</Text>
              <TouchableOpacity onPress={() => videoRef.current?.enterFullscreen()}>
                <Text style={styles.icon}>⛶</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  wrapper: { flex: 1 },
  video: { flex: 1 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  errorText: { color: '#ff453a', fontSize: 16 },
  backButton: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 18 },
  controls: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 12, paddingHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.6)' },
  progressTrack: { flexDirection: 'row', height: 3, marginBottom: 8, borderRadius: 2, overflow: 'hidden' },
  progressFill: { backgroundColor: '#0a84ff' },
  progressRemainder: { backgroundColor: '#3a3a3c' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: { color: '#fff', fontSize: 20 },
  time: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
});
