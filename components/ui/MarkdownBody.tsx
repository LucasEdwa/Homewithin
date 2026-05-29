import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  body: string;
  /** Override font size (default 16) */
  fontSize?: number;
}

/**
 * Renders body text with minimal Markdown support:
 *  - A paragraph that is entirely **wrapped** becomes a bold section heading.
 *  - Inline **bold** spans inside a paragraph are rendered bold.
 *  - Double newlines separate paragraphs.
 */
export function MarkdownBody({ body, fontSize = 16 }: Props) {
  const paragraphs = body.split(/\n\n+/);

  return (
    <View style={styles.container}>
      {paragraphs.map((para, pi) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Whole-paragraph heading: **Some Title**
        const headingMatch = trimmed.match(/^\*\*(.+)\*\*$/);
        if (headingMatch) {
          return (
            <Text key={pi} style={[styles.heading, { fontSize: fontSize + 1 }]}>
              {headingMatch[1]}
            </Text>
          );
        }

        // Inline **bold** spans
        const parts = trimmed.split(/(\*\*.+?\*\*)/);
        return (
          <Text key={pi} style={[styles.body, { fontSize, marginTop: pi === 0 ? 0 : 8 }]}>
            {parts.map((part, i) => {
              const inlineMatch = part.match(/^\*\*(.+)\*\*$/);
              if (inlineMatch) {
                return (
                  <Text key={i} style={styles.bold}>
                    {inlineMatch[1]}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  body: { color: Colors.textPrimary, lineHeight: 26 },
  heading: {
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 26,
    marginTop: 20,
    marginBottom: 2,
  },
  bold: { fontWeight: '700', color: Colors.textPrimary },
});
