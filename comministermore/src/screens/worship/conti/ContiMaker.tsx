import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { MAIN_API_BASE } from '../../../config/api';
import { WORSHIP_THEMES } from '../songs/worshipThemes';
import { useScrollViewScrollToTop } from '../../shared/listScrollUi';
import { SongDetail } from '../songs/SongDetail';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

type SongData = {
  id: number;
  title: string;
  stateSort: string;
  keySort: string;
  theme: string;
  tempoSort: string;
  image: string;
  lyrics: string;
  [k: string]: unknown;
};

type SongCondition = {
  stateSort: string;
  keySort: string;
  theme: string;
  tempoSort: string;
};

type Props = {
  onBack?: () => void;
  hideBackButton?: boolean;
};

function uniqueSorted(values: string[]) {
  const out: string[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!v) continue;
    if (out.indexOf(v) < 0) out.push(v);
  }
  out.sort();
  return out;
}

function pickRandom(options: string[]) {
  if (!options.length) return '';
  return options[Math.floor(Math.random() * options.length)];
}

export function ContiMaker({ onBack, hideBackButton }: Props) {
  const { scrollRef, onScroll } = useScrollViewScrollToTop();
  const [isLoading, setIsLoading] = useState(false);
  const [allSongs, setAllSongs] = useState<SongData[]>([]);

  const [songCount, setSongCount] = useState(5);
  const [songConditions, setSongConditions] = useState<SongCondition[]>([]);

  const [isGenerated, setIsGenerated] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<SongData[]>([]);

  const [detailId, setDetailId] = useState<number | null>(null);

  const stateSortOptions = useMemo(() => uniqueSorted(allSongs.map(s => String(s.stateSort || ''))), [allSongs]);
  const keySortOptions = useMemo(() => uniqueSorted(allSongs.map(s => String(s.keySort || ''))), [allSongs]);
  const tempoSortOptions = useMemo(() => uniqueSorted(allSongs.map(s => String(s.tempoSort || ''))), [allSongs]);
  const themeOptions = useMemo(() => [...WORSHIP_THEMES], []);

  const fetchAllSongs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/worshipsongs/getsongsall`);
      const songs: SongData[] = Array.isArray(res.data?.result) ? res.data.result : [];
      setAllSongs(songs);
    } catch {
      Alert.alert('', '곡을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSongs().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 곡수 변경 시 조건 배열 생성
    const next = Array(songCount)
      .fill(null)
      .map(() => ({ stateSort: '', keySort: '', theme: '', tempoSort: '' }));
    setSongConditions(next);
    setIsGenerated(false);
    setSelectedSongs([]);
  }, [songCount]);

  const updateCondition = (idx: number, field: keyof SongCondition, value: string) => {
    setSongConditions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const generateConti = (conditions: SongCondition[]) => {
    const selected: SongData[] = [];
    for (let i = 0; i < conditions.length; i++) {
      const c = conditions[i];
      let available = allSongs.filter(song => {
        if (c.theme && (!song.theme || String(song.theme).indexOf(c.theme) < 0)) return false;
        if (c.stateSort && String(song.stateSort) !== c.stateSort) return false;
        if (c.keySort && String(song.keySort) !== c.keySort) return false;
        if (c.tempoSort && String(song.tempoSort) !== c.tempoSort) return false;
        return true;
      });
      available = available.filter(song => !selected.some(s => s.id === song.id));
      if (!available.length) {
        Alert.alert('', `${i + 1}번째 곡의 조건에 맞는 곡이 없습니다.`);
        return;
      }
      selected.push(available[Math.floor(Math.random() * available.length)]);
    }
    setSelectedSongs(selected);
    setIsGenerated(true);
  };

  const completeAndGenerate = () => {
    if (!allSongs.length) return;
    const filled = songConditions.map(c => ({
      stateSort: c.stateSort || pickRandom(stateSortOptions),
      keySort: c.keySort || pickRandom(keySortOptions),
      theme: c.theme || pickRandom(themeOptions),
      tempoSort: c.tempoSort || pickRandom(tempoSortOptions),
    }));
    setSongConditions(filled);
    generateConti(filled);
  };

  const resetConti = () => {
    const reset = songConditions.map(() => ({ stateSort: '', keySort: '', theme: '', tempoSort: '' }));
    setSongConditions(reset);
    setSelectedSongs([]);
    setIsGenerated(false);
  };

  const regenerateSong = (songIndex: number) => {
    const c = songConditions[songIndex];
    let available = allSongs.filter(song => {
      if (c.theme && (!song.theme || String(song.theme).indexOf(c.theme) < 0)) return false;
      if (c.stateSort && String(song.stateSort) !== c.stateSort) return false;
      if (c.keySort && String(song.keySort) !== c.keySort) return false;
      if (c.tempoSort && String(song.tempoSort) !== c.tempoSort) return false;
      return true;
    });
    available = available.filter(song => !selectedSongs.some((s, idx) => idx !== songIndex && s.id === song.id));
    if (!available.length) {
      Alert.alert('', `${songIndex + 1}번째 곡의 조건에 맞는 다른 곡이 없습니다.`);
      return;
    }
    const currentId = selectedSongs[songIndex]?.id;
    const others = available.filter(s => s.id !== currentId);
    if (!others.length) {
      Alert.alert('', '조건에 맞는 다른 곡이 없습니다.');
      return;
    }
    const nextSong = others[Math.floor(Math.random() * others.length)];
    const updated = [...selectedSongs];
    updated[songIndex] = nextSong;
    setSelectedSongs(updated);
  };

  if (detailId != null) {
    return <SongDetail id={detailId} onBack={() => setDetailId(null)} />;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>찬양 콘티 만들기</Text>
          {!hideBackButton && (
            <Pressable
              style={styles.backBtn}
              onPress={() => {
                if (onBack) onBack();
              }}
            >
              <Text style={styles.backBtnText}>뒤로</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.subtitle}>곡 수와 조건을 선택한 뒤 콘티 작성 버튼으로 완성하세요</Text>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#1e3a8a" />
            <Text style={styles.loadingText}>곡을 불러오는 중...</Text>
          </View>
        ) : (
          <>
            <View style={styles.setupCard}>
              <Text style={styles.label}>곡 개수</Text>
              <View style={styles.pillRow}>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                  const active = songCount === n;
                  return (
                    <Pressable key={n} style={[styles.pill, active && styles.pillActive]} onPress={() => setSongCount(n)}>
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{n}곡</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.conditions}>
                {songConditions.map((c, idx) => (
                  <View key={`cond-${idx}`} style={styles.conditionRow}>
                    <Text style={styles.condNum}>{idx + 1}번째</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.condScroll}>
                      <FilterGroup
                        label="구분"
                        value={c.stateSort}
                        options={['', ...stateSortOptions]}
                        onChange={v => updateCondition(idx, 'stateSort', v)}
                      />
                      <FilterGroup
                        label="조성"
                        value={c.keySort}
                        options={['', ...keySortOptions]}
                        onChange={v => updateCondition(idx, 'keySort', v)}
                      />
                      <FilterGroup
                        label="주제"
                        value={c.theme}
                        options={['', ...themeOptions]}
                        onChange={v => updateCondition(idx, 'theme', v)}
                      />
                      <FilterGroup
                        label="템포"
                        value={c.tempoSort}
                        options={['', ...tempoSortOptions]}
                        onChange={v => updateCondition(idx, 'tempoSort', v)}
                      />
                    </ScrollView>
                  </View>
                ))}
              </View>

              <View style={styles.notice}>
                <Text style={styles.noticeText}>* 선택하지 않은 항목은 자동으로 랜덤 선택됩니다.</Text>
              </View>

              <View style={styles.actions}>
                <Pressable style={[styles.btn, styles.btnPrimary]} onPress={completeAndGenerate}>
                  <Text style={styles.btnText}>콘티 작성</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.btnSecondary]} onPress={resetConti}>
                  <Text style={styles.btnText}>초기화</Text>
                </Pressable>
              </View>
            </View>

            {isGenerated && selectedSongs.length > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>결과물 예시</Text>
                  <Text style={styles.resultSub}>곡을 탭하면 상세보기로 이동합니다.</Text>
                </View>

                <View style={styles.songGrid}>
                  {selectedSongs.map((song, idx) => (
                    <Pressable
                      key={String(song.id)}
                      style={styles.songCard}
                      onPress={() => setDetailId(Number(song.id))}
                    >
                      <View style={styles.songCardHead}>
                        <Text style={styles.songCardTitle} numberOfLines={1}>
                          {idx + 1}. {song.title}
                        </Text>
                        <Text style={styles.songPill}>
                          {song.keySort} | {song.tempoSort}
                        </Text>
                      </View>
                      <View style={styles.songCardActions}>
                        <Pressable
                          style={styles.changeBtn}
                          onPress={e => {
                            e.stopPropagation();
                            regenerateSong(idx);
                          }}
                        >
                          <MaterialIcons name="autorenew" size={16} color="#1e3a8a" />
                          <Text style={styles.changeBtnText}>변경</Text>
                        </Pressable>
                      </View>
                      <View style={styles.songMetaRow}>
                        <Text style={styles.metaText}>{song.stateSort}</Text>
                        <Text style={styles.metaText}>·</Text>
                        <Text style={styles.metaText} numberOfLines={1}>
                          {song.theme || ''}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.groupPills}>
        {options.slice(0, 10).map(opt => {
          const v = String(opt || '');
          const active = value === v;
          return (
            <Pressable
              key={`${label}-${v || 'all'}`}
              style={[styles.smallPill, active && styles.smallPillActive]}
              onPress={() => onChange(v)}
            >
              <Text style={[styles.smallPillText, active && styles.smallPillTextActive]}>
                {v || label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 14, paddingBottom: 30, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontSize: 18, fontWeight: '900', color: '#1e293b' },
  backBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#111827' },
  backBtnText: { color: '#fff', fontWeight: '900' },
  subtitle: { fontSize: 14, color: '#64748b', fontWeight: '700', lineHeight: 20 },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { color: '#64748b', fontWeight: '800' },
  setupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  label: { fontSize: 14, fontWeight: '900', color: '#1e293b' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  pillActive: { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' },
  pillText: { fontSize: 13, fontWeight: '900', color: '#1e293b' },
  pillTextActive: { color: '#fff' },
  conditions: { gap: 12 },
  conditionRow: { gap: 8 },
  condNum: { fontSize: 13, fontWeight: '900', color: '#1e293b' },
  condScroll: { paddingRight: 20, gap: 10 },
  group: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 10,
    backgroundColor: '#fff',
    minWidth: 180,
    gap: 8,
  },
  groupLabel: { fontSize: 12, color: '#64748b', fontWeight: '900' },
  groupPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  smallPill: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
  },
  smallPillActive: { backgroundColor: '#111827', borderColor: '#111827' },
  smallPillText: { fontSize: 12, fontWeight: '900', color: '#1e293b' },
  smallPillTextActive: { color: '#fff' },
  notice: { padding: 12, backgroundColor: '#eff6ff', borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  noticeText: { color: '#1e3a8a', fontWeight: '800', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  btnPrimary: { backgroundColor: '#1e3a8a' },
  btnSecondary: { backgroundColor: '#64748b' },
  btnText: { color: '#fff', fontWeight: '900' },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  resultHeader: { gap: 6 },
  resultTitle: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  resultSub: { fontSize: 13, color: '#64748b', fontWeight: '700' },
  songGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  songCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  songCardHead: { gap: 6 },
  songCardTitle: { fontSize: 14, fontWeight: '900', color: '#111827' },
  songPill: { fontSize: 12, color: '#1e3a8a', fontWeight: '900' },
  songCardActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#eff6ff' },
  changeBtnText: { fontSize: 12, fontWeight: '900', color: '#1e3a8a' },
  songMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#64748b', fontWeight: '800', flexShrink: 1 },
});

