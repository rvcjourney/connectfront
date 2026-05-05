import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import Video from 'react-native-video';
import { SafeScreen } from '../../components/SafeScreen';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-simple-toast';
import LinearGradient from 'react-native-linear-gradient';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { useAuth } from '../../hooks/useAuth';
import { videoApi } from '../../api/videoApi';

const T = UNIFIED_THEME;

// ─── Video Player Modal ───────────────────────────────────────────────────────
function VideoPlayerModal({ video, onClose }) {
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <Modal
      visible={!!video}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View style={playerStyles.container}>
        {video && (
          <Video
            ref={videoRef}
            source={{ uri: video.video_url }}
            style={playerStyles.video}
            resizeMode="contain"
            paused={paused}
            onLoadStart={() => { setLoading(true); setError(false); }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            repeat={false}
            controls={false}
          />
        )}

        {loading && !error && (
          <ActivityIndicator style={playerStyles.loader} size="large" color={T.colors.accent.secondary} />
        )}

        {error && (
          <View style={playerStyles.errorBox}>
            <MaterialIcons name="error-outline" size={40} color={T.colors.accent.error} />
            <Text style={playerStyles.errorText}>Could not play video</Text>
          </View>
        )}

        {/* Controls overlay */}
        <View style={playerStyles.topBar}>
          <TouchableOpacity onPress={onClose} style={playerStyles.closeBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={playerStyles.videoTitle} numberOfLines={1}>
            {video?.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <TouchableOpacity
          style={playerStyles.playPauseArea}
          onPress={() => setPaused(p => !p)}
          activeOpacity={1}
        >
          {paused && (
            <View style={playerStyles.playIcon}>
              <MaterialIcons name="play-arrow" size={52} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const playerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  video: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  loader: { position: 'absolute', alignSelf: 'center' },
  errorBox: { alignItems: 'center', gap: 8 },
  errorText: { color: T.colors.accent.error, fontSize: 14 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  closeBtn: { padding: 8, width: 40 },
  videoTitle: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  playPauseArea: { position: 'absolute', top: 60, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  playIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoCard({ video, onToggleFree, onDelete, onPlay }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (value) => {
    setToggling(true);
    await onToggleFree(video.id, value);
    setToggling(false);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => onPlay(video)} activeOpacity={0.8}>
        <LinearGradient
          colors={['rgba(124,58,237,0.18)', 'rgba(14,165,233,0.10)']}
          style={styles.cardThumb}
        >
          <MaterialIcons name="play-circle-filled" size={36} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{video.title}</Text>
        {video.description ? (
          <Text style={styles.cardDesc} numberOfLines={1}>{video.description}</Text>
        ) : null}
        <View style={styles.cardFooter}>
          <View style={styles.freeRow}>
            <Text style={styles.freeLabel}>{video.is_free ? 'Free' : 'Locked'}</Text>
            {toggling ? (
              <ActivityIndicator size="small" color={T.colors.accent.secondary} style={{ marginLeft: 6 }} />
            ) : (
              <Switch
                value={video.is_free}
                onValueChange={handleToggle}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: T.colors.accent.secondary }}
                thumbColor={video.is_free ? T.colors.accent.primary : 'rgba(255,255,255,0.6)'}
                style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            )}
          </View>
          <TouchableOpacity onPress={() => onDelete(video)} style={styles.deleteBtn}>
            <MaterialIcons name="delete-outline" size={20} color={T.colors.accent.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ visible, onClose, onUploaded }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [pickedFile, setPickedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  const animateProgress = (toValue) => {
    Animated.timing(progressAnim, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const reset = () => {
    setTitle('');
    setDescription('');
    setIsFree(false);
    setPickedFile(null);
    setUploading(false);
    setProgress(0);
    progressAnim.setValue(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickVideo = () => {
    launchImageLibrary(
      { mediaType: 'video', videoQuality: 'medium' },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset) return;

        const sizeMB = (asset.fileSize || 0) / (1024 * 1024);
        if (sizeMB > 80) {
          Toast.show('Video must be under 80 MB', Toast.LONG);
          return;
        }
        setPickedFile(asset);
      },
    );
  };

  const handleUpload = async () => {
    if (!title.trim()) { Toast.show('Add a title first', Toast.SHORT); return; }
    if (!pickedFile) { Toast.show('Pick a video first', Toast.SHORT); return; }

    setUploading(true);
    setProgress(0);
    progressAnim.setValue(0);
    try {
      const uploaded = await videoApi.uploadVideo({
        mentorId: user.id,
        title: title.trim(),
        description: description.trim(),
        fileUri: pickedFile.uri,
        fileName: pickedFile.fileName || `video_${Date.now()}.mp4`,
        isFree,
        onProgress: (pct) => {
          setProgress(pct);
          animateProgress(pct);
        },
      });
      Toast.show('Video uploaded!', Toast.SHORT);
      onUploaded(uploaded);
      handleClose();
    } catch (e) {
      Toast.show(e.message || 'Upload failed', Toast.LONG);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Video</Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialIcons name="close" size={22} color={T.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. How to grow on Instagram"
              placeholderTextColor={T.colors.text.muted}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            {/* Description */}
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Brief description of this video..."
              placeholderTextColor={T.colors.text.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            {/* Free toggle */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.inputLabel}>Free for all</Text>
                <Text style={styles.toggleHint}>First 2–3 videos should be free</Text>
              </View>
              <Switch
                value={isFree}
                onValueChange={setIsFree}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: T.colors.accent.secondary }}
                thumbColor={isFree ? T.colors.accent.primary : 'rgba(255,255,255,0.6)'}
              />
            </View>

            {/* Pick video */}
            <TouchableOpacity style={styles.pickBtn} onPress={pickVideo}>
              <MaterialIcons
                name={pickedFile ? 'check-circle' : 'video-library'}
                size={20}
                color={pickedFile ? T.colors.accent.success : T.colors.accent.secondary}
              />
              <Text style={[styles.pickBtnText, pickedFile && { color: T.colors.accent.success }]}>
                {pickedFile
                  ? pickedFile.fileName || 'Video selected'
                  : 'Pick video from gallery'}
              </Text>
            </TouchableOpacity>

            {pickedFile ? (
              <Text style={styles.fileSize}>
                {((pickedFile.fileSize || 0) / (1024 * 1024)).toFixed(1)} MB
              </Text>
            ) : null}

            {/* Progress bar */}
            {uploading && (
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{progress}%</Text>
              </View>
            )}

            {/* Upload button */}
            <TouchableOpacity
              style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <Text style={styles.uploadBtnText}>
                  {progress < 100 ? 'Uploading...' : 'Saving...'}
                </Text>
              ) : (
                <Text style={styles.uploadBtnText}>Upload Video</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MentorVideosScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [unlockPrice, setUnlockPrice] = useState(299);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('299');

  const loadVideos = useCallback(async () => {
    try {
      const [vids, price] = await Promise.all([
        videoApi.getMentorVideos(user.id),
        videoApi.getUnlockPrice(user.id),
      ]);
      setVideos(vids);
      setUnlockPrice(price);
      setPriceInput(String(price));
    } catch (e) {
      Toast.show(e.message, Toast.LONG);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  const handleToggleFree = async (id, isFree) => {
    try {
      await videoApi.updateVideo({ id, isFree });
      setVideos(prev => prev.map(v => v.id === id ? { ...v, is_free: isFree } : v));
    } catch (e) {
      Toast.show(e.message, Toast.LONG);
    }
  };

  const handleDelete = (video) => {
    Alert.alert('Delete Video', `Delete "${video.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await videoApi.deleteVideo({ id: video.id, storagePath: video.storage_path });
            setVideos(prev => prev.filter(v => v.id !== video.id));
            Toast.show('Deleted', Toast.SHORT);
          } catch (e) {
            Toast.show(e.message, Toast.LONG);
          }
        },
      },
    ]);
  };

  const handleSavePrice = async () => {
    const p = parseInt(priceInput, 10);
    if (isNaN(p) || p < 1) { Toast.show('Enter a valid price', Toast.SHORT); return; }
    try {
      await videoApi.setUnlockPrice({ mentorId: user.id, price: p });
      setUnlockPrice(p);
      setEditingPrice(false);
      Toast.show('Price updated', Toast.SHORT);
    } catch (e) {
      Toast.show(e.message, Toast.LONG);
    }
  };

  const freeCount = videos.filter(v => v.is_free).length;

  return (
    <SafeScreen hasBottomTabs={false} scrollable={false} padding={0}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={T.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>My Videos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowUpload(true)}>
          <MaterialIcons name="add" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Unlock price card */}
      <View style={styles.priceCard}>
        <MaterialIcons name="lock-open" size={18} color={T.colors.accent.primary} />
        <Text style={styles.priceLabel}>Library unlock price</Text>
        {editingPrice ? (
          <View style={styles.priceEditRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.priceInput}
              value={priceInput}
              onChangeText={setPriceInput}
              keyboardType="numeric"
              maxLength={5}
              autoFocus
            />
            <TouchableOpacity onPress={handleSavePrice} style={styles.savePriceBtn}>
              <Text style={styles.savePriceTxt}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditingPrice(true)} style={styles.priceValueRow}>
            <Text style={styles.priceValue}>₹{unlockPrice}</Text>
            <MaterialIcons name="edit" size={14} color={T.colors.text.muted} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>{videos.length} videos total</Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.statText}>{freeCount} free</Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.statText}>{videos.length - freeCount} locked</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={T.colors.accent.secondary} style={{ marginTop: 40 }} />
      ) : videos.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="video-library" size={56} color="rgba(255,255,255,0.12)" />
          <Text style={styles.emptyText}>No videos yet</Text>
          <Text style={styles.emptyHint}>Tap + to upload your first video</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={v => v.id}
          renderItem={({ item }) => (
            <VideoCard
              video={item}
              onToggleFree={handleToggleFree}
              onDelete={handleDelete}
              onPlay={setPlayingVideo}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <UploadModal
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={(v) => setVideos(prev => [v, ...prev])}
      />

      <VideoPlayerModal
        video={playingVideo}
        onClose={() => setPlayingVideo(null)}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  topTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: T.colors.text.primary,
    marginLeft: 10,
  },
  addBtn: {
    backgroundColor: T.colors.accent.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(240,216,117,0.15)',
  },
  priceLabel: { flex: 1, color: T.colors.text.secondary, fontSize: 13 },
  priceValueRow: { flexDirection: 'row', alignItems: 'center' },
  priceValue: { color: T.colors.accent.primary, fontSize: 15, fontWeight: '700' },
  priceEditRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rupee: { color: T.colors.accent.primary, fontSize: 14, fontWeight: '700' },
  priceInput: {
    color: T.colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: T.colors.accent.primary,
    minWidth: 60,
    paddingVertical: 0,
    textAlign: 'right',
  },
  savePriceBtn: {
    backgroundColor: T.colors.accent.secondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 6,
  },
  savePriceTxt: { color: '#000', fontSize: 12, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
    gap: 6,
  },
  statText: { color: T.colors.text.muted, fontSize: 12 },
  statDot: { color: T.colors.text.muted, fontSize: 12 },

  list: { paddingHorizontal: 16, paddingBottom: 24 },

  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardThumb: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, padding: 12 },
  cardTitle: { color: T.colors.text.primary, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  cardDesc: { color: T.colors.text.muted, fontSize: 12, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  freeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  freeLabel: { color: T.colors.text.secondary, fontSize: 12 },
  deleteBtn: { padding: 4 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 60 },
  emptyText: { color: T.colors.text.secondary, fontSize: 16, fontWeight: '600' },
  emptyHint: { color: T.colors.text.muted, fontSize: 13 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: '#0e0e2a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: T.colors.text.primary, fontSize: 17, fontWeight: '700' },

  inputLabel: { color: T.colors.text.secondary, fontSize: 13, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: T.colors.text.primary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputMulti: { height: 72, textAlignVertical: 'top' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 4,
  },
  toggleHint: { color: T.colors.text.muted, fontSize: 11, marginTop: 2 },

  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    backgroundColor: 'rgba(94,234,212,0.08)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.2)',
    borderStyle: 'dashed',
  },
  pickBtnText: { color: T.colors.accent.secondary, fontSize: 14, fontWeight: '500', flex: 1 },
  fileSize: { color: T.colors.text.muted, fontSize: 11, marginTop: 6, textAlign: 'right' },

  progressContainer: {
    marginTop: 18,
    gap: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: T.colors.accent.secondary,
    borderRadius: 3,
  },
  progressText: {
    color: T.colors.accent.secondary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },

  uploadBtn: {
    marginTop: 16,
    backgroundColor: T.colors.accent.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  uploadBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
