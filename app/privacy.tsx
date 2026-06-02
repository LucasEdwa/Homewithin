import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Para({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[styles.para, style]}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableLabel}>{label}</Text>
      <Text style={styles.tableValue}>{value}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: 1 June 2026</Text>

        <Para>
          HomeWithin ("we", "our", or "the app") is a mobile application designed to provide a safe, private support space for LGBTQ+ people in Sweden. We are deeply committed to protecting your privacy, particularly given the sensitive nature of the people who use this app.
        </Para>
        <Para>
          This policy explains what data we collect, why we collect it, how it is stored, and your rights as a user — in compliance with the General Data Protection Regulation (GDPR).
        </Para>

        <Section title="1. Who We Are">
          <Para>App name: HomeWithin</Para>
          <Para>Bundle identifier: com.homewithin.app</Para>
          <Para>
            Contact:{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('mailto:lucas.eduardo2070@gmail.com')}
            >
              lucas.eduardo2070@gmail.com
            </Text>
          </Para>
          <Para>If you have any questions about this policy or your data, contact us at the email above.</Para>
        </Section>

        <Section title="2. What Data We Collect">
          <Text style={styles.subTitle}>2.1 Account & Profile Data</Text>
          <Para>When you create a profile you may optionally provide:</Para>
          <Bullet>A nickname (not your real name)</Bullet>
          <Bullet>Age range (one of: 18–24, 25–34, 35–44, 45+)</Bullet>
          <Bullet>Language preference</Bullet>
          <Bullet>Country</Bullet>
          <Bullet>Needs and intentions (e.g. looking for a mentor, first friend)</Bullet>
          <Bullet>A profile avatar (photo you choose to upload)</Bullet>
          <Para>All profile fields are optional. You can use the app anonymously without providing any identifying information.</Para>

          <Text style={[styles.subTitle, styles.subTitleSpaced]}>2.2 Journal Entries</Text>
          <Para>Journal entries you write are stored locally on your device using encrypted secure storage. Entries you choose to sync are also stored on our servers. Hidden entries are protected behind a PIN that only you know.</Para>

          <Text style={[styles.subTitle, styles.subTitleSpaced]}>2.3 Connect & Chat Messages</Text>
          <Para>If you use the Connect feature to match with other users, the following is stored on our servers:</Para>
          <Bullet>Your profile (as described in 2.1)</Bullet>
          <Bullet>Match records (who connected with whom, status, intention)</Bullet>
          <Bullet>Chat messages between matched users</Bullet>

          <Text style={[styles.subTitle, styles.subTitleSpaced]}>2.4 Location Data</Text>
          <Para>Location is only accessed when you use the Local Resources or Events features. We do not store your location on our servers. It is used only in the moment to filter results and is never shared with third parties.</Para>

          <Text style={[styles.subTitle, styles.subTitleSpaced]}>2.5 Push Notification Token</Text>
          <Para>If you enable notifications, your device's push notification token is stored on our servers to deliver chat message alerts. You can disable notifications at any time in your device settings.</Para>

          <Text style={[styles.subTitle, styles.subTitleSpaced]}>2.6 Technical Data</Text>
          <Para>When you use the app, our backend (Supabase) may log standard technical information such as timestamps of requests. We do not use any analytics SDKs, advertising SDKs, or tracking tools.</Para>

          <Text style={[styles.subTitle, styles.subTitleSpaced]}>2.7 AI Companion Data</Text>
          <Para>If you choose to use the AI Companion feature and grant consent, the following data is sent to a third-party AI service (see Section 9):</Para>
          <Bullet>Your nickname and country (if set in your profile)</Bullet>
          <Bullet>Your selected support needs</Bullet>
          <Bullet>Your current safety level (green / yellow / red)</Bullet>
          <Bullet>Mood scores and trends derived from your check-ins</Bullet>
          <Bullet>Short snippets (up to 150 characters) and emotion tags from your journal entries</Bullet>
          <Bullet>Your program progress and connection count</Bullet>
          <Bullet>The messages you type in the AI Companion chat</Bullet>
          <Para>This data is only sent after you explicitly agree to the data-sharing disclosure shown before your first use of the feature.</Para>

          <Text style={[styles.subTitle, styles.subTitleSpaced]}>2.8 Moderation & Reports</Text>
          <Para>If you report another user or a message, the following is stored:</Para>
          <Bullet>The ID of the reported user or message</Bullet>
          <Bullet>The reason or category you selected</Bullet>
          <Bullet>A timestamp</Bullet>
          <Bullet>Your user ID (so we can follow up and prevent abuse of the report system)</Bullet>
          <Para>Reports are reviewed by HomeWithin within 24 hours. They are never shared with the reported user. Report records are retained for 12 months and then permanently deleted.</Para>
        </Section>

        <Section title="3. Why We Collect This Data">
          <View style={styles.table}>
            <TableRow label="Profile data" value="Show you to potential peer matches — Consent" />
            <TableRow label="Journal entries" value="Private journaling feature — Consent" />
            <TableRow label="Match & chat data" value="Enable peer support connections — Contract" />
            <TableRow label="Location" value="Show local resources near you — Consent" />
            <TableRow label="Push token" value="Deliver chat notifications — Consent" />
            <TableRow label="AI Companion data" value="Personalise AI responses — Explicit consent" />
            <TableRow label="Moderation reports" value="Review safety complaints — Legitimate interest" />
          </View>
          <Para>We do not use your data for advertising, profiling, or sale to third parties.</Para>
        </Section>

        <Section title="4. Data Storage & Security">
          <Para>Your data is stored on servers provided by Supabase (Supabase Inc.), a GDPR-compliant backend platform. Supabase stores data in the EU region.</Para>
          <Bullet>Journal entries are encrypted on your device before sync</Bullet>
          <Bullet>Hidden journal entries are PIN-protected and never readable by us</Bullet>
          <Bullet>All connections between the app and our servers use HTTPS encryption</Bullet>
          <Bullet>Match and chat data is only accessible to the two matched users</Bullet>
        </Section>

        <Section title="5. Disguise Mode">
          <Para>HomeWithin includes a "Disguise Mode" that makes the app appear as a calculator, weather app, or notes app. This feature is designed to protect users who may be monitored by others. No additional data is collected when this mode is active.</Para>
        </Section>

        <Section title="6. Data Retention">
          <Bullet>Profile and match data: Retained while your account exists. Deleted when you delete your account.</Bullet>
          <Bullet>Chat messages: Retained until you or the other user deletes the conversation or account.</Bullet>
          <Bullet>Moderation reports: Retained for 12 months from submission, then permanently deleted.</Bullet>
          <Bullet>Journal entries: Stored locally on your device. Server-synced entries deleted when you delete your account.</Bullet>
          <Bullet>Location data: Never stored — used only in real time.</Bullet>
          <Bullet>Push tokens: Deleted when you sign out or delete your account.</Bullet>
        </Section>

        <Section title="7. Your Rights Under GDPR">
          <Para>As a user in the EU/EEA you have the right to:</Para>
          <Bullet>Access — request a copy of the personal data we hold about you</Bullet>
          <Bullet>Rectification — correct inaccurate data</Bullet>
          <Bullet>Erasure ("right to be forgotten") — request deletion of your account and all data</Bullet>
          <Bullet>Restriction — ask us to limit how we process your data</Bullet>
          <Bullet>Portability — receive your data in a machine-readable format</Bullet>
          <Bullet>Object — object to processing based on legitimate interests</Bullet>
          <Bullet>Withdraw consent — at any time, without affecting prior processing</Bullet>
          <Para>
            To exercise any of these rights, contact us at{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('mailto:lucas.eduardo2070@gmail.com')}>
              lucas.eduardo2070@gmail.com
            </Text>
            . We will respond within 30 days.
          </Para>
          <Para>
            You also have the right to lodge a complaint with the Swedish supervisory authority:{'\n'}
            Integritetsskyddsmyndigheten (IMY){'\n'}
            <Text style={styles.link} onPress={() => Linking.openURL('https://www.imy.se')}>imy.se</Text>
          </Para>
        </Section>

        <Section title="8. Age Requirement">
          <Para>HomeWithin is intended for users who are 18 years of age or older. You must confirm you are 18 or older before accessing the app. We do not knowingly collect personal data from anyone under the age of 18. If you believe a minor has provided us with personal data, please contact us immediately and we will delete it.</Para>
        </Section>

        <Section title="9. Third-Party Services">
          <View style={styles.table}>
            <TableRow label="Supabase" value="Backend database & authentication — supabase.com/privacy" />
            <TableRow label="Second Horizon" value="AI Companion processing — app.second-horizon.com" />
            <TableRow label="Expo" value="App framework & push notifications — expo.dev/privacy" />
            <TableRow label="Apple (iOS)" value="App delivery & push infrastructure — apple.com/legal/privacy" />
          </View>
          <Para>AI Companion (Second Horizon): When you use the AI Companion and have given consent, your messages and personalisation context are sent to Second Horizon, which processes them using AI language model technology. Data is transmitted over HTTPS. Second Horizon does not use your data to train AI models.</Para>
          <Para>We do not use Google Analytics, Facebook SDK, or any advertising network.</Para>
        </Section>

        <Section title="10. Changes to This Policy">
          <Para>We may update this policy as the app evolves. When we do, we will update the "Last updated" date at the top. Significant changes will be communicated in the app. Continued use of the app after changes constitutes acceptance of the updated policy.</Para>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions? Contact us at{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('mailto:lucas.eduardo2070@gmail.com')}
            >
              lucas.eduardo2070@gmail.com
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.warmWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.softGray,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
  updated: { fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.xs },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.sm },
  subTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  subTitleSpaced: { marginTop: Spacing.sm },
  para: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm, paddingLeft: Spacing.xs },
  bulletDot: { fontSize: 14, color: Colors.textMuted, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  link: { color: Colors.safeBlue, textDecorationLine: 'underline' },
  table: { gap: 4 },
  tableRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.softGray,
  },
  tableLabel: { width: 110, fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  tableValue: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  footer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.softGray,
  },
  footerText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
