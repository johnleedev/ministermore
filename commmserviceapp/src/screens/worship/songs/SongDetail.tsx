import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import axios from 'axios';
import { MAIN_API_BASE } from '../../../config/api';
import {
  FloatingScrollActions,
  LIST_FAB_SCROLL_PADDING,
  useScrollViewScrollToTop,
} from '../../shared/listScrollUi';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

type SongProps = {
  id: number;
  title: string;
  theme: string;
  image: string;
  source: string;
  lyrics: string;
  keySort: string;
  date: string;
  stateSort: string;
  pptlist?: string;
  youtubelist?: string;
  tempoSort?: string;
  [k: string]: unknown;
};

type Props = {
  id: number;
  onBack: () => void;
};

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  try {
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return (v as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function removeHtmlTags(text: string) {
  let processed = String(text || '');
  processed = processed.replace(/<br\s*\/?>/gi, '\n');
  processed = processed.replace(/<[^>]*>/g, '');
  return processed;
}

export function SongDetail({ id, onBack }: Props) {
  const { scrollRef, showTopBtn, onScroll, scrollToTop } = useScrollViewScrollToTop();
  const [songData, setSongData] = useState<SongProps | null>(null);
  const [loading, setLoading] = useState(false);
  const [scoreError, setScoreError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/worshipsongs/getsongdatapart`, {
        id,
      });
      const data = res?.data;
      if (Array.isArray(data) && data.length > 0) {
        const row = data[0];
        const mapped: SongProps = {
          id: Number(row?.id ?? row?._id ?? id),
          title: String(row?.title ?? ''),
          theme: String(row?.theme ?? ''),
          image: String(row?.image ?? ''),
          source: String(row?.source ?? ''),
          lyrics: String(row?.lyrics ?? ''),
          keySort: String(row?.keySort ?? ''),
          date: String(row?.date ?? ''),
          stateSort: String(row?.stateSort ?? ''),
          pptlist: row?.pptlist ? String(row.pptlist) : '',
          youtubelist: row?.youtubelist ? String(row.youtubelist) : '',
          tempoSort: row?.tempoSort ? String(row.tempoSort) : '',
        };
        setSongData(mapped);
      } else {
        setSongData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const pptlist = useMemo(() => {
    return safeParseJson<any[]>(songData?.pptlist, []);
  }, [songData?.pptlist]);

  const youtubelist = useMemo(() => {
    return safeParseJson<any[]>(songData?.youtubelist, []);
  }, [songData?.youtubelist]);

  const themes = useMemo(() => {
    return String(songData?.theme || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }, [songData?.theme]);

  const openExternal = async (url: string | null | undefined) => {
    const u = String(url || '').trim();
    if (!u) return;
    try {
      await Linking.openURL(u);
    } catch {
      Alert.alert('', '링크를 열 수 없습니다.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4f5460" />
      </View>
    );
  }

  if (!songData) {
    return (
      <View style={styles.root}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>상세보기</Text>
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>목록</Text>
          </Pressable>
        </View>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>찬양곡을 찾을 수 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: LIST_FAB_SCROLL_PADDING }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {songData.title}
          </Text>
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>목록</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>찬양 정보</Text>

          <View style={styles.infoGrid}>
            <Text style={styles.label}>구분</Text>
            <Text style={styles.value}>{songData.stateSort || '정보 없음'}</Text>

            <Text style={styles.label}>조성</Text>
            <Text style={styles.value}>{songData.keySort || '정보 없음'}</Text>

            <Text style={styles.label}>주제어</Text>
            <View style={styles.tagRow}>
              {themes.length ? (
                themes.map(t => (
                  <View key={t} style={styles.tag}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.value}>정보 없음</Text>
              )}
            </View>

            <Text style={styles.label}>출처</Text>
            <View style={styles.sourceRow}>
              <Text style={styles.sourceText} numberOfLines={1}>
                {songData.source ? songData.source : '정보 없음'}
              </Text>
              {!!songData.source && (
                <Pressable style={styles.linkBtn} onPress={() => openExternal(songData.source)}>
                  <Text style={styles.linkBtnText}>바로가기</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>가사</Text>
            <Pressable
              style={styles.copyBtn}
              onPress={() => {
                Alert.alert('', '앱 정책상 클립보드 복사는 추후 추가됩니다.');
              }}
            >
              <Text style={styles.copyBtnText}>복사하기</Text>
            </Pressable>
          </View>
          <Text style={styles.lyricsText}>
            {songData.lyrics ? removeHtmlTags(songData.lyrics) : '가사 정보가 없습니다.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>악보</Text>
          {!songData.image || scoreError ? (
            <View style={styles.emptyScore}>
              <Text style={styles.emptyText}>악보 이미지가 없습니다.</Text>
            </View>
          ) : (
            <Pressable onPress={() => openExternal(songData.source || songData.image)}>
              <Image
                source={{ uri: songData.image }}
                style={styles.scoreImage}
                resizeMode="contain"
                onError={() => setScoreError(true)}
              />
              <View style={styles.scoreLinkRow}>
                <Text style={styles.scoreHint}>이미지 탭하면 링크로 이동</Text>
                <Pressable style={styles.linkBtn} onPress={() => openExternal(songData.source || songData.image)}>
                  <Text style={styles.linkBtnText}>바로가기</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        </View>

        {pptlist && pptlist.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>PPT 자료</Text>
              <Pressable
                style={styles.linkBtn}
                onPress={() => {
                  const q = encodeURIComponent(`${songData.title} PPT`);
                  openExternal(`https://www.google.com/search?q=${q}&tbm=isch&hl=ko`).catch(() => null);
                }}
              >
                <Text style={styles.linkBtnText}>더보기</Text>
              </Pressable>
            </View>

            <View style={styles.materialsGrid}>
              {pptlist.slice(0, 8).map((m: any, idx: number) => (
                <Pressable
                  key={`ppt-${idx}`}
                  style={styles.materialCard}
                  onPress={() => openExternal(m?.link)}
                >
                  {!!m?.img_src && (
                    <Image source={{ uri: m.img_src }} style={styles.materialImg} resizeMode="cover" />
                  )}
                  <Text style={styles.materialTitle} numberOfLines={2}>
                    {String(m?.page_name || '자료')}
                  </Text>
                  <Text style={styles.materialSite} numberOfLines={1}>
                    {String(m?.site_name || '')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {youtubelist && youtubelist.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>YouTube 자료</Text>
              <Pressable
                style={styles.linkBtn}
                onPress={() => {
                  const q = encodeURIComponent(songData.title);
                  openExternal(`https://www.youtube.com/results?search_query=${q}`).catch(() => null);
                }}
              >
                <Text style={styles.linkBtnText}>더보기</Text>
              </Pressable>
            </View>

            <View style={styles.materialsGrid}>
              {youtubelist.slice(0, 8).map((m: any, idx: number) => (
                <Pressable
                  key={`yt-${idx}`}
                  style={styles.materialCard}
                  onPress={() => openExternal(m?.link)}
                >
                  {!!m?.img_src && (
                    <Image source={{ uri: m.img_src }} style={styles.materialImg} resizeMode="cover" />
                  )}
                  <Text style={styles.materialTitle} numberOfLines={2}>
                    {String(m?.title_name || 'YouTube')}
                  </Text>
                  <Text style={styles.materialSite} numberOfLines={1}>
                    {String(m?.channel_name || '')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <Pressable style={styles.bottomBack} onPress={onBack}>
          <Text style={styles.bottomBackText}>목록</Text>
        </Pressable>
      </ScrollView>
      <FloatingScrollActions showTop={showTopBtn} onScrollToTop={scrollToTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#111827' },
  backBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#111827' },
  backBtnText: { color: '#fff', fontWeight: '800' },
  emptyBox: {
    width: '100%',
    paddingVertical: 50,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 14,
  },
  emptyText: { fontSize: 16, color: '#888' },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    gap: 10,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  infoGrid: { gap: 8 },
  label: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
  value: { fontSize: 14, fontWeight: '700', color: '#111827' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, backgroundColor: '#F3F4F6' },
  tagText: { fontSize: 12, fontWeight: '800', color: '#374151' },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourceText: { flex: 1, fontSize: 13, color: '#374151' },
  linkBtn: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#4f5460' },
  linkBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  copyBtn: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#b9b9b9' },
  copyBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  lyricsText: { fontSize: 14, lineHeight: 20, color: '#111827' },
  emptyScore: {
    width: '100%',
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  scoreImage: { width: '100%', height: 260, backgroundColor: '#fafafa', borderRadius: 10 },
  scoreLinkRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  scoreHint: { flex: 1, fontSize: 12, color: '#6B7280' },
  materialsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  materialCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  materialImg: { width: '100%', height: 110, backgroundColor: '#f3f4f6' },
  materialTitle: { paddingHorizontal: 10, paddingTop: 8, fontSize: 13, fontWeight: '800', color: '#111827' },
  materialSite: { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 4, fontSize: 12, color: '#6B7280' },
  bottomBack: { marginTop: 4, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: '#111827' },
  bottomBackText: { color: '#fff', fontWeight: '800' },
});

