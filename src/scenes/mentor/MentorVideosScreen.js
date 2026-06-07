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
import CosmicButton from '../../components/CosmicButton';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-simple-toast';
import LinearGradient from 'react-native-linear-gradient';
import { UNIFIED_THEME } from '../../unifiedTheme';
import { useAuth } from '../../hooks/useAuth';
import { videoApi } from '../../api/videoApi';

const T = UNIFIED_THEME;
const C = T.colors;
const B = C.buttons;
const S = C.surface;

const PURPLE_LINK = B.nebulaGradient[0];
const GOLD = C.accent.primary;
const TEAL = C.accent.secondary;
const PANEL_BG = '#161432';
const INPUT_BG = '#0f0e2a';
const SHEET_BG = '#0f0e2a';
const GLASS_BORDER = 'rgba(167,139,250,0.22)';

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
          <ActivityIndicator style={playerStyles.loader} size="large" color={TEAL} />
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
function VideoCard({ video, onToggleFree, onDelete, onPlay, onEdit }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (value) => {
    setToggling(true);
    await onToggleFree(video.id, value);
    setToggling(false);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => onPlay(video)} activeOpacity={0.8}>
        <LinearGradient colors={S.heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardThumb}>
          <MaterialIcons name="play-circle-filled" size={36} color={PURPLE_LINK} />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.cardInfo}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={2}>{video.title}</Text>
          <TouchableOpacity onPress={() => onEdit(video)} style={styles.editBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="edit" size={18} color={TEAL} />
          </TouchableOpacity>
        </View>
        {video.description ? (
          <Text style={styles.cardDesc} numberOfLines={1}>{video.description}</Text>
        ) : null}
        <View style={styles.cardFooter}>
          <View style={styles.freeRow}>
            <Text style={styles.freeLabel}>{video.is_free ? 'Free' : 'Locked'}</Text>
            {toggling ? (
              <ActivityIndicator size="small" color={TEAL} style={{ marginLeft: 6 }} />
            ) : (
              <Switch
                value={video.is_free}
                onValueChange={handleToggle}
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: TEAL }}
                thumbColor={video.is_free ? GOLD : 'rgba(255,255,255,0.6)'}
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

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ video, onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
      setIsFree(video.is_free || false);
      setSaved(false);
      setErrorMsg('');
      scaleAnim.setValue(1);
      checkAnim.setValue(0);
    }
  }, [video]);

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('Title cannot be empty');
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.04, duration: 80, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
      return;
    }
    setErrorMsg('');
    setSaving(true);
    try {
      const updated = await videoApi.updateVideo({
        id: video.id,
        title: title.trim(),
        description: description.trim(),
        isFree,
      });
      onSaved(updated);
      setSaved(true);
      Animated.spring(checkAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }).start();
      setTimeout(() => { onClose(); setSaved(false); }, 900);
    } catch (e) {
      setErrorMsg(e.message || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={!!video} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.editModalHeader}>
            <MaterialIcons name="edit" size={18} color={PURPLE_LINK} />
            <Text style={styles.modalTitle}>Edit Video</Text>
          </View>

          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={t => { setTitle(t); setErrorMsg(''); }}
            placeholder="Video title"
            placeholderTextColor={C.text.muted}
            maxLength={80}
          />

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            placeholderTextColor={C.text.muted}
            multiline
            maxLength={200}
          />

          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Free to watch</Text>
            <Switch
              value={isFree}
              onValueChange={setIsFree}
              trackColor={{ false: 'rgba(255,255,255,0.15)', true: TEAL }}
              thumbColor={isFree ? GOLD : 'rgba(255,255,255,0.6)'}
            />
          </View>

          {/* Error message */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={14} color={T.colors.accent.error} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Save button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.uploadBtn,
                saved && styles.savedBtn,
                (saving || saved) && { opacity: 0.9 },
              ]}
              onPress={handleSave}
              disabled={saving || saved}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#000" size="small" />
              ) : saved ? (
                <Animated.View style={[styles.savedRow, { transform: [{ scale: checkAnim }] }]}>
                  <MaterialIcons name="check-circle" size={18} color="#000" />
                  <Text style={styles.uploadBtnText}>Saved!</Text>
                </Animated.View>
              ) : (
                <Text style={styles.uploadBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ visible, onClose, onUploaded }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [pickedFile, setPickedFile] = useState(null);
  const [pickedThumbnail, setPickedThumbnail] = useState(null);
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
    setPickedThumbnail(null);
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

  const pickThumbnail = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8 },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset) return;
        setPickedThumbnail(asset);
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
        thumbnailUri: pickedThumbnail?.uri,
        thumbnailFileName: pickedThumbnail?.fileName || (pickedThumbnail ? `thumb_${Date.now()}.jpg` : undefined),
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
          <View style={styles.modalHandle} />
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Video</Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialIcons name="close" size={22} color={C.text.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. How to grow on Instagram"
              placeholderTextColor={C.text.muted}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            {/* Description */}
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Brief description of this video..."
              placeholderTextColor={C.text.muted}
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
                trackColor={{ false: 'rgba(255,255,255,0.15)', true: TEAL }}
                thumbColor={isFree ? GOLD : 'rgba(255,255,255,0.6)'}
              />
            </View>

            {/* Pick video */}
            <TouchableOpacity style={styles.pickBtn} onPress={pickVideo}>
              <MaterialIcons
                name={pickedFile ? 'check-circle' : 'video-library'}
                size={20}
                color={pickedFile ? C.accent.success : TEAL}
              />
              <Text style={[styles.pickBtnText, pickedFile && { color: C.accent.success }]}>
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

            {/* Pick thumbnail */}
            <TouchableOpacity style={[styles.pickBtn, styles.pickBtnViolet]} onPress={pickThumbnail}>
              <MaterialIcons
                name={pickedThumbnail ? 'check-circle' : 'image'}
                size={20}
                color={pickedThumbnail ? C.accent.success : PURPLE_LINK}
              />
              <Text style={[styles.pickBtnText, styles.pickBtnTextViolet, pickedThumbnail && { color: C.accent.success }]}>
                {pickedThumbnail ? pickedThumbnail.fileName || 'Thumbnail selected' : 'Pick thumbnail (optional)'}
              </Text>
            </TouchableOpacity>

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

            <CosmicButton
              label={
                uploading
                  ? progress < 100
                    ? 'Uploading...'
                    : 'Saving...'
                  : 'Upload Video'
              }
              variant="nebula"
              icon="cloud-upload"
              onPress={handleUpload}
              loading={uploading}
              disabled={uploading}
              style={styles.uploadBtn}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MentorVideosScreen() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
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
    <SafeScreen hasBottomTabs={false} scrollable={false} padding={T.spacing.lg}>
      {/* Unlock price card */}
      <View style={styles.priceCard}>
        <MaterialIcons name="lock-open" size={18} color={GOLD} />
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
            <MaterialIcons name="edit" size={14} color={C.text.muted} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowUpload(true)}>
          <LinearGradient colors={B.nebulaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtnGrad}>
            <MaterialIcons name="add" size={22} color={B.nebulaText} />
          </LinearGradient>
        </TouchableOpacity>
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
        <ActivityIndicator color={TEAL} style={{ marginTop: 40 }} />
      ) : videos.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="video-library" size={48} color={PURPLE_LINK} />
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
              onEdit={setEditingVideo}
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

      <EditModal
        video={editingVideo}
        onClose={() => setEditingVideo(null)}
        onSaved={(updated) =>
          setVideos(prev => prev.map(v => v.id === updated.id ? updated : v))
        }
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.spacing.sm,
    backgroundColor: PANEL_BG,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(240,216,117,0.25)',
  },
  priceLabel: { flex: 1, color: C.text.secondary, fontSize: 13, fontWeight: '600' },
  priceValueRow: { flexDirection: 'row', alignItems: 'center' },
  priceValue: { color: GOLD, fontSize: 15, fontWeight: '800' },
  priceEditRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rupee: { color: GOLD, fontSize: 14, fontWeight: '800' },
  priceInput: {
    color: C.text.primary,
    fontSize: 15,
    fontWeight: '800',
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    minWidth: 60,
    paddingVertical: 0,
    textAlign: 'right',
  },
  savePriceBtn: {
    backgroundColor: TEAL,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 6,
  },
  savePriceTxt: { color: C.primary.void, fontSize: 12, fontWeight: '800' },
  addBtn: { borderRadius: 17, overflow: 'hidden' },
  addBtnGrad: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: T.spacing.md,
    gap: 6,
    paddingHorizontal: 2,
  },
  statText: { color: C.text.muted, fontSize: 12, fontWeight: '600' },
  statDot: { color: 'rgba(255,255,255,0.25)', fontSize: 12 },

  list: { paddingBottom: 24 },

  card: {
    flexDirection: 'row',
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  cardThumb: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, padding: 12 },
  cardTitle: { color: C.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardDesc: { color: C.text.muted, fontSize: 12, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  freeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  freeLabel: { color: C.text.secondary, fontSize: 12, fontWeight: '600' },
  deleteBtn: { padding: 4 },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
    padding: T.spacing.xxl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: PANEL_BG,
  },
  emptyText: { color: C.text.primary, fontSize: 16, fontWeight: '800' },
  emptyHint: { color: C.text.muted, fontSize: 13 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(3,3,8,0.75)' },
  modalSheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: GLASS_BORDER,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: C.text.primary, fontSize: 17, fontWeight: '800' },

  inputLabel: { color: PURPLE_LINK, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: C.text.primary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
  },
  inputMulti: { height: 72, textAlignVertical: 'top' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 4,
  },
  toggleHint: { color: C.text.muted, fontSize: 11, marginTop: 2 },

  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    backgroundColor: S.accentTeal,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(94,234,212,0.25)',
    borderStyle: 'dashed',
  },
  pickBtnText: { color: TEAL, fontSize: 14, fontWeight: '700', flex: 1 },
  pickBtnViolet: {
    marginTop: 10,
    backgroundColor: S.accentViolet,
    borderColor: 'rgba(167,139,250,0.35)',
  },
  pickBtnTextViolet: { color: PURPLE_LINK },
  fileSize: { color: C.text.muted, fontSize: 11, marginTop: 6, textAlign: 'right' },

  progressContainer: { marginTop: 18, gap: 6 },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: TEAL, borderRadius: 3 },
  progressText: { color: TEAL, fontSize: 12, fontWeight: '800', textAlign: 'right' },

  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  editBtn: { paddingTop: 2 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
    marginBottom: 10,
  },
  errorBannerText: {
    color: C.accent.error,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  savedBtn: { backgroundColor: C.accent.success },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(3,3,8,0.75)' },
  fieldLabel: {
    color: PURPLE_LINK,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  },
  uploadBtn: { marginTop: 16, marginVertical: 0 },
});
