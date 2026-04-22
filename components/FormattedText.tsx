/**
 * FormattedText — Rendu Markdown natif pour React Native.
 * Gère : titres, listes (bullet + numérotées), blockquotes, tableaux,
 *        blocs de code, règles horizontales, gras/italique/code inline.
 *
 * Usage :
 *   <FormattedText content={markdownString} />
 *   <FormattedText content={markdownString} cardStyle={false} />
 */
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

/* ─── Palette ─────────────────────────────────────────────── */
const C = {
  accent: '#C9A84C',
  text:   '#f1f5f9',
  muted:  '#CBD5E1',
};

const CARD_COLORS = [
  { bg: '#0f172a', border: '#3B82F6', accent: '#60A5FA' },
  { bg: '#0d1a0d', border: '#22C55E', accent: '#4ADE80' },
  { bg: '#1a0f1f', border: '#A855F7', accent: '#C084FC' },
  { bg: '#1a1200', border: '#F59E0B', accent: '#FCD34D' },
  { bg: '#0f1a1a', border: '#06B6D4', accent: '#22D3EE' },
  { bg: '#1a0f0f', border: '#EF4444', accent: '#F87171' },
];

/* ─── Types de blocs ──────────────────────────────────────── */
type Block =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string; cardIndex: number }
  | { type: 'h3'; text: string }
  | { type: 'p';  text: string }
  | { type: 'bullet';   text: string }
  | { type: 'numbered'; text: string; num: number }
  | { type: 'blockquote'; text: string }
  | { type: 'hr' }
  | { type: 'code'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

/* ─── Inline parser (gras / italique / `code` / liens) ───── */
function parseInline(text: string): React.ReactNode[] {
  // Détecte : **gras**, *italique*, `code`, [texte](url), https://...
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+?\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\)|https?:\/\/[^\s),]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <Text key={i} style={{ fontWeight: '700', color: '#f1f5f9' }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <Text key={i} style={{ fontStyle: 'italic', color: '#94a3b8' }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <Text key={i} style={st.inlineCode}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    // Lien markdown [texte](url)
    const mdLink = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (mdLink) {
      return (
        <Text
          key={i}
          style={st.link}
          onPress={() => Linking.openURL(mdLink[2])}
        >
          {mdLink[1]}
        </Text>
      );
    }
    // URL brute https://...
    if (part.match(/^https?:\/\//)) {
      return (
        <Text
          key={i}
          style={st.link}
          onPress={() => Linking.openURL(part)}
        >
          {part}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

/* ─── Parser bloc ─────────────────────────────────────────── */
function parseBlocks(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let h2Count = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    /* ligne vide */
    if (!trimmed) { i++; continue; }

    /* bloc de code ``` */
    if (trimmed.startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]);
        i++;
      }
      i++; // fermer ```
      blocks.push({ type: 'code', text: code.join('\n') });
      continue;
    }

    /* ## H2 */
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim(), cardIndex: h2Count++ });
      i++;
      continue;
    }

    /* ### H3 */
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() });
      i++;
      continue;
    }

    /* # H1 */
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      blocks.push({ type: 'h1', text: trimmed.slice(2).trim() });
      i++;
      continue;
    }

    /* --- HR */
    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    /* > blockquote (multi-lignes) */
    if (trimmed.startsWith('> ')) {
      const quoteLines = [trimmed.slice(2)];
      i++;
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join('\n') });
      continue;
    }

    /* | tableau */
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (r: string) =>
          r.split('|').slice(1, -1).map((c) => c.trim());
        const headers = parseRow(tableLines[0]);
        const rows: string[][] = [];
        for (let j = 1; j < tableLines.length; j++) {
          // sauter la ligne séparateur (|---|---|)
          if (/^[\|\s\-:]+$/.test(tableLines[j])) continue;
          rows.push(parseRow(tableLines[j]));
        }
        if (headers.length > 0) {
          blocks.push({ type: 'table', headers, rows });
        }
      }
      continue;
    }

    /* - / * / • bullet */
    if (/^[-*•]\s+/.test(trimmed)) {
      blocks.push({ type: 'bullet', text: trimmed.replace(/^[-*•]\s+/, '') });
      i++;
      continue;
    }

    /* 1. liste numérotée */
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (numMatch) {
      blocks.push({ type: 'numbered', num: parseInt(numMatch[1], 10), text: numMatch[2] });
      i++;
      continue;
    }

    /* paragraphe */
    blocks.push({ type: 'p', text: trimmed });
    i++;
  }

  return blocks;
}

/* ─── Rendu d'un bloc ─────────────────────────────────────── */
function renderBlock(
  block: Block,
  key: number,
  accent: string = C.accent,
): React.ReactNode {
  switch (block.type) {
    case 'h1':
      return (
        <Text key={key} style={[st.h1, { color: accent }]}>
          {parseInline(block.text)}
        </Text>
      );
    case 'h2':
      return (
        <Text key={key} style={[st.h2, { color: accent }]}>
          {parseInline(block.text)}
        </Text>
      );
    case 'h3':
      return (
        <Text key={key} style={[st.h3, { color: accent }]}>
          {parseInline(block.text)}
        </Text>
      );
    case 'p':
      return (
        <Text key={key} style={st.p}>
          {parseInline(block.text)}
        </Text>
      );
    case 'bullet':
      return (
        <View key={key} style={st.listRow}>
          <Text style={[st.bullet, { color: accent }]}>•</Text>
          <Text style={st.listText}>{parseInline(block.text)}</Text>
        </View>
      );
    case 'numbered':
      return (
        <View key={key} style={st.listRow}>
          <View style={[st.numBadge, { backgroundColor: accent + '22' }]}>
            <Text style={[st.numText, { color: accent }]}>{block.num}</Text>
          </View>
          <Text style={st.listText}>{parseInline(block.text)}</Text>
        </View>
      );
    case 'blockquote':
      return (
        <View
          key={key}
          style={[
            st.blockquote,
            { borderLeftColor: accent + '90', backgroundColor: accent + '0A' },
          ]}
        >
          <Text style={st.blockquoteText}>{parseInline(block.text)}</Text>
        </View>
      );
    case 'hr':
      return <View key={key} style={st.hr} />;
    case 'code':
      return (
        <ScrollView
          key={key}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={st.codeBlock}
        >
          <Text style={st.codeText}>{block.text}</Text>
        </ScrollView>
      );
    case 'table':
      return (
        <TableBlock
          key={key}
          headers={block.headers}
          rows={block.rows}
          accent={accent}
        />
      );
    default:
      return null;
  }
}

/* ─── Tableau ─────────────────────────────────────────────── */
function TableBlock({
  headers,
  rows,
  accent,
}: {
  headers: string[];
  rows: string[][];
  accent: string;
}) {
  /* largeur de colonne adaptative */
  const colW = Math.max(90, Math.min(160, 320 / headers.length));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginVertical: 4, borderRadius: 8, overflow: 'hidden' }}
    >
      <View>
        {/* En-tête */}
        <View style={[st.tableRow, { backgroundColor: accent + '20' }]}>
          {headers.map((h, ci) => (
            <View
              key={ci}
              style={[st.tableCell, { width: colW, borderColor: accent + '40' }]}
            >
              <Text style={[st.tableHead, { color: accent }]}>{parseInline(h)}</Text>
            </View>
          ))}
        </View>
        {/* Lignes */}
        {rows.map((row, ri) => (
          <View
            key={ri}
            style={[
              st.tableRow,
              { backgroundColor: ri % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' },
            ]}
          >
            {headers.map((_, ci) => (
              <View
                key={ci}
                style={[st.tableCell, { width: colW, borderColor: 'rgba(255,255,255,0.08)' }]}
              >
                <Text style={st.tableCell_}>{parseInline(row[ci] ?? '')}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* ─── Section card H2 ─────────────────────────────────────── */
type Section = { h2?: Block & { type: 'h2' }; body: Block[] };

function groupSections(blocks: Block[]): Section[] {
  const sections: Section[] = [];
  let current: Section = { body: [] };
  for (const block of blocks) {
    if (block.type === 'h2') {
      if (current.h2 || current.body.length > 0) sections.push(current);
      current = { h2: block as Block & { type: 'h2' }, body: [] };
    } else {
      current.body.push(block);
    }
  }
  if (current.h2 || current.body.length > 0) sections.push(current);
  return sections;
}

/* ─── Composant principal ─────────────────────────────────── */
interface FormattedTextProps {
  content: string;
  /** Encadre chaque section H2 dans une carte colorée (par défaut: true) */
  cardStyle?: boolean;
  /** Taille de base du texte (par défaut: 13) */
  fontSize?: number;
}

export function FormattedText({
  content,
  cardStyle = true,
  fontSize = 13,
}: FormattedTextProps) {
  const blocks = parseBlocks(content);

  if (!cardStyle) {
    return (
      <View style={{ gap: 4 }}>
        {blocks.map((b, i) => renderBlock(b, i))}
      </View>
    );
  }

  const sections = groupSections(blocks);

  return (
    <View style={{ gap: 8 }}>
      {sections.map((section, si) => {
        /* Contenu avant le premier H2 */
        if (!section.h2) {
          return (
            <View key={si} style={{ gap: 4, paddingHorizontal: 2 }}>
              {section.body.map((b, bi) => renderBlock(b, bi))}
            </View>
          );
        }

        const c = CARD_COLORS[section.h2.cardIndex % CARD_COLORS.length];
        return (
          <View
            key={si}
            style={{
              backgroundColor: c.bg,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: c.border + '40',
              borderLeftWidth: 3,
              borderLeftColor: c.border,
              overflow: 'hidden',
            }}
          >
            {/* En-tête de section */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 14,
                paddingVertical: 9,
                backgroundColor: c.border + '18',
                borderBottomWidth: 1,
                borderBottomColor: c.border + '25',
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: c.accent,
                  flexShrink: 0,
                }}
              />
              <Text
                style={{
                  color: c.accent,
                  fontWeight: '800',
                  fontSize: fontSize - 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  flex: 1,
                }}
              >
                {parseInline(section.h2.text)}
              </Text>
            </View>

            {/* Corps de la section */}
            {section.body.length > 0 && (
              <View style={{ padding: 12, gap: 6 }}>
                {section.body.map((b, bi) => renderBlock(b, bi, c.accent))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */
const st = StyleSheet.create({
  h1: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  h2: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  h3: { fontSize: 13, fontWeight: '700', marginBottom: 1 },
  p:  { fontSize: 13, color: C.muted, lineHeight: 20 },

  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 4,
  },
  bullet:   { fontSize: 13, lineHeight: 20, flexShrink: 0 },
  numBadge: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
  },
  numText:  { fontSize: 10, fontWeight: '700' },
  listText: { fontSize: 13, color: C.muted, lineHeight: 20, flex: 1 },

  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 4,
    marginVertical: 2,
  },
  blockquoteText: { fontSize: 13, color: C.muted, lineHeight: 19, fontStyle: 'italic' },

  hr: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 6 },

  codeBlock: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 2,
  },
  codeText: { fontFamily: 'monospace', fontSize: 11, color: '#e2e8f0', lineHeight: 18 },

  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 11,
    backgroundColor: 'rgba(0,0,0,0.35)',
    color: '#e2e8f0',
    borderRadius: 3,
  },
  link: {
    color: '#60A5FA',
    textDecorationLine: 'underline',
    fontSize: 13,
  },

  tableRow:  { flexDirection: 'row' },
  tableCell: {
    padding: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  tableHead:  { fontSize: 11, fontWeight: '700' },
  tableCell_: { fontSize: 11, color: C.muted, lineHeight: 16 },
});
