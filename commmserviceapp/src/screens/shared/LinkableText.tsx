import { useMemo } from 'react';
import { Alert, Linking, Text, type TextStyle, type StyleProp } from 'react-native';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;

type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'link'; value: string; href: string };

function stripHtmlToPlain(content: string) {
  return content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r\n/g, '\n')
    .trim();
}

function normalizeUrl(raw: string) {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function collectSegments(text: string): Segment[] {
  if (!text) return [{ kind: 'text', value: '' }];

  const hits: { start: number; end: number; value: string; href: string }[] = [];

  for (const match of text.matchAll(EMAIL_REGEX)) {
    const value = match[0];
    const start = match.index ?? 0;
    hits.push({ start, end: start + value.length, value, href: `mailto:${value}` });
  }

  for (const match of text.matchAll(URL_REGEX)) {
    const value = match[0];
    const start = match.index ?? 0;
    if (value.includes('@')) continue;
    const overlapsEmail = hits.some(h => start >= h.start && start < h.end);
    if (overlapsEmail) continue;
    hits.push({ start, end: start + value.length, value, href: normalizeUrl(value) });
  }

  hits.sort((a, b) => a.start - b.start);

  const merged: typeof hits = [];
  for (const hit of hits) {
    const last = merged[merged.length - 1];
    if (last && hit.start < last.end) continue;
    merged.push(hit);
  }

  const segments: Segment[] = [];
  let cursor = 0;
  for (const hit of merged) {
    if (hit.start > cursor) {
      segments.push({ kind: 'text', value: text.slice(cursor, hit.start) });
    }
    segments.push({ kind: 'link', value: hit.value, href: hit.href });
    cursor = hit.end;
  }
  if (cursor < text.length) {
    segments.push({ kind: 'text', value: text.slice(cursor) });
  }
  if (!segments.length) {
    segments.push({ kind: 'text', value: text });
  }
  return segments;
}

async function openHref(href: string) {
  try {
    const canOpen = await Linking.canOpenURL(href);
    if (!canOpen) {
      Alert.alert('안내', '링크를 열 수 없습니다.');
      return;
    }
    await Linking.openURL(href);
  } catch {
    Alert.alert('안내', '링크를 열 수 없습니다.');
  }
}

type Props = {
  children?: never;
  text: string;
  style?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
};

/** 본문 내 URL·이메일을 탭하면 브라우저/메일 앱으로 연결 */
export function LinkableText({ text, style, linkStyle }: Props) {
  const segments = useMemo(() => collectSegments(stripHtmlToPlain(text)), [text]);

  return (
    <Text style={style}>
      {segments.map((seg, index) => {
        if (seg.kind === 'text') {
          return <Text key={`t-${index}`}>{seg.value}</Text>;
        }
        return (
          <Text
            key={`l-${index}`}
            style={[{ color: '#1d4ed8', textDecorationLine: 'underline' }, linkStyle]}
            onPress={() => void openHref(seg.href)}
            suppressHighlighting={false}>
            {seg.value}
          </Text>
        );
      })}
    </Text>
  );
}
