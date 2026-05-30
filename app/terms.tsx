import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
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

export default function TermsOfUseScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Use</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: 24 May 2026</Text>

        <Para>
          Welcome to HomeWithin. By using this app you agree to the terms below. Please read them carefully — they are written to be clear, not to trick you.
        </Para>

        <Section title="1. Who We Are">
          <Para>
            HomeWithin is an independent app designed to support LGBTQ+ people in Sweden. It is not a medical service, a crisis hotline, or a therapy platform. We are a small team committed to building a safer digital space for queer people.
          </Para>
          <Para>Contact: lucas.eduardo2070@gmail.com</Para>
        </Section>

        <Section title="2. Who Can Use HomeWithin">
          <Para>You must be at least 18 years old to use HomeWithin. By creating an account or using the app, you confirm that you are 18 or older.</Para>
        </Section>

        <Section title="3. Your Account">
          <Bullet>You can use the app anonymously — a real name is never required.</Bullet>
          <Bullet>You are responsible for keeping your PIN and account secure.</Bullet>
          <Bullet>You must not create accounts to impersonate others or to harass anyone.</Bullet>
          <Bullet>One account per person — multiple accounts used to evade a ban are not permitted.</Bullet>
        </Section>

        <Section title="4. What You Can and Cannot Do">
          <Para>You may use HomeWithin to:</Para>
          <Bullet>Complete safety check-ins and track your wellbeing</Bullet>
          <Bullet>Read articles and access local LGBTQ+ resources</Bullet>
          <Bullet>Connect with other users and exchange supportive messages</Bullet>
          <Bullet>Use the AI Companion for emotional support and reflection</Bullet>

          <Para style={styles.spacedPara}>HomeWithin has a zero-tolerance policy for objectionable content and abusive users. There is no tolerance for: harassment, hate speech, threats, or any content that demeans, endangers, or harms others. Violations result in immediate and permanent removal.</Para>
          <Para style={styles.spacedPara}>You may not use HomeWithin to:</Para>
          <Bullet>Harass, threaten, or bully other users</Bullet>
          <Bullet>Share sexually explicit content or content that sexualises minors</Bullet>
          <Bullet>Out another person's sexual orientation or gender identity without their consent</Bullet>
          <Bullet>Promote conversion therapy or attempt to change someone's identity</Bullet>
          <Bullet>Impersonate HomeWithin staff, moderators, or crisis services</Bullet>
          <Bullet>Spam or send unsolicited commercial messages</Bullet>
          <Bullet>Attempt to access or tamper with another user's data</Bullet>
        </Section>

        <Section title="5. Your Content">
          <Para>
            Content you create in HomeWithin — journal entries, messages, profile information — belongs to you.
          </Para>
          <Para>
            By submitting content visible to other users (such as your profile or chat messages), you grant HomeWithin a limited licence to display that content as part of providing the service. We do not sell your content or use it for advertising.
          </Para>
          <Para>
            Journal entries stored locally on your device are never accessed by us. Server-synced entries are stored securely and deleted when you delete your account.
          </Para>
        </Section>

        <Section title="6. The AI Companion">
          <Para>
            The AI Companion is a supportive conversational tool — it is not a therapist, doctor, or crisis counsellor. It cannot diagnose conditions, prescribe treatment, or replace professional care.
          </Para>
          <Para>
            If you are in immediate danger, please contact emergency services (112 in Sweden) or a crisis line such as Mind (90101) or BRIS (116 111).
          </Para>
          <Para style={styles.spacedPara}>Data sharing with a third-party AI service</Para>
          <Para>
            When you use the AI Companion and have given your explicit consent, the following personal data is sent to Second Horizon (app.second-horizon.com), the AI service that powers this feature:
          </Para>
          <Bullet>Your nickname and country (if set in your profile)</Bullet>
          <Bullet>Your support needs and current safety level</Bullet>
          <Bullet>Mood scores and trends from your check-ins</Bullet>
          <Bullet>Short snippets and emotion tags from your journal entries</Bullet>
          <Bullet>Your program progress and connection count</Bullet>
          <Bullet>The messages you type in the chat</Bullet>
          <Para>
            This data is transmitted over HTTPS and is used only to generate personalised responses. Second Horizon does not use it to train AI models. You will be asked to agree to this sharing the first time you open the AI Companion. You can withdraw at any time by not using the feature.
          </Para>
        </Section>

        <Section title="7. Disguise Mode">
          <Para>
            Disguise Mode is a safety feature that makes the app appear as a different application. Using it does not violate any platform rules — it exists specifically to protect users in unsafe situations.
          </Para>
        </Section>

        <Section title="8. Our Responsibilities">
          <Para>We will:</Para>
          <Bullet>Work to keep the app available and secure</Bullet>
          <Bullet>Respond to safety reports and enforce community standards</Bullet>
          <Bullet>Handle your data as described in our Privacy Policy</Bullet>
          <Bullet>Notify you of significant changes to these terms</Bullet>

          <Para style={styles.spacedPara}>We cannot guarantee:</Para>
          <Bullet>That the app is always available or free from errors</Bullet>
          <Bullet>That AI Companion responses are always accurate or appropriate</Bullet>
          <Bullet>That other users will behave safely — report concerns to us immediately</Bullet>
        </Section>

        <Section title="9. Enforcement">
          <Para>
            We may suspend or permanently ban accounts that violate these terms. In cases involving illegal content or imminent danger, we will cooperate with Swedish law enforcement.
          </Para>
          <Para>
            If you believe your account was actioned in error, contact us at lucas.eduardo2070@gmail.com and we will review it within 14 days.
          </Para>
        </Section>

        <Section title="10. Limitation of Liability">
          <Para>
            HomeWithin is provided "as is". To the maximum extent permitted by law, we are not liable for any indirect or consequential damages arising from your use of the app.
          </Para>
          <Para>
            Nothing in these terms limits your statutory rights under Swedish or EU consumer law.
          </Para>
        </Section>

        <Section title="11. Governing Law">
          <Para>
            These terms are governed by Swedish law. Any disputes that cannot be resolved by contacting us will be handled by Swedish courts or the EU Online Dispute Resolution platform (ec.europa.eu/odr).
          </Para>
        </Section>

        <Section title="12. Changes to These Terms">
          <Para>
            We may update these terms as the app evolves. We will notify you in-app when significant changes occur. Continued use of the app after the effective date of changes constitutes acceptance.
          </Para>
        </Section>

        <Section title="13. Privacy">
          <Para>
            Your use of HomeWithin is also governed by our Privacy Policy, which explains in detail what data we collect and how we handle it. You can access the Privacy Policy from your profile at any time.
          </Para>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Questions? Contact us at lucas.eduardo2070@gmail.com</Text>
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
  para: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  spacedPara: { marginTop: Spacing.xs },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm, paddingLeft: Spacing.xs },
  bulletDot: { fontSize: 14, color: Colors.textMuted, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  footer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.softGray,
  },
  footerText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
