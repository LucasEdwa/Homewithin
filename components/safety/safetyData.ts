import type { SafetyAnswers } from '@/types';
import type { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { Colors } from '@/constants/Colors';

export type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export interface StepQuestion {
  id: keyof SafetyAnswers;
  label: string;
  sublabel?: string;
  icon: IoniconsName;
  riskDirection: 'risk' | 'protective';
}

export interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: IoniconsName;
  iconColor: string;
  questions: StepQuestion[];
  hasSlider?: boolean;
}

export const STEPS: Step[] = [
  {
    id: 1,
    title: 'Right now',
    subtitle: "Let's start with how you're feeling in this moment. There's no wrong answer.",
    icon: 'time-outline',
    iconColor: Colors.safeBlue,
    hasSlider: true,
    questions: [
      {
        id: 'currently_in_danger',
        label: 'I feel in danger right now',
        sublabel: 'Physical threat, or someone who could hurt you',
        icon: 'warning-outline',
        riskDirection: 'risk',
      },
    ],
  },
  {
    id: 2,
    title: 'Home & body',
    subtitle: 'Your physical safety and where you live matter deeply. These answers stay private.',
    icon: 'home-outline',
    iconColor: '#E8844E',
    questions: [
      {
        id: 'physical_abuse',
        label: "I've experienced physical harm at home",
        sublabel: 'Hitting, pushing, or any physical violence',
        icon: 'body-outline',
        riskDirection: 'risk',
      },
      {
        id: 'emotional_control',
        label: 'Someone controls or manipulates me emotionally',
        sublabel: 'Being silenced, shamed, or told who you can be',
        icon: 'lock-closed-outline',
        riskDirection: 'risk',
      },
      {
        id: 'housing_unstable',
        label: 'My housing feels unstable or threatened',
        sublabel: 'Risk of being kicked out or made homeless',
        icon: 'home-outline',
        riskDirection: 'risk',
      },
    ],
  },
  {
    id: 3,
    title: 'Identity & pressure',
    subtitle: 'Being LGBTQ+ can bring specific pressures. These questions help us understand yours.',
    icon: 'person-outline',
    iconColor: Colors.mutedLavender,
    questions: [
      {
        id: 'conversion_pressure',
        label: 'Someone is pressuring me to change or hide who I am',
        sublabel: 'Religious pressure, conversion therapy, or being told to "fix" yourself',
        icon: 'refresh-circle-outline',
        riskDirection: 'risk',
      },
      {
        id: 'outed_recently',
        label: 'I was recently outed without my consent',
        sublabel: 'Someone disclosed your identity without permission',
        icon: 'megaphone-outline',
        riskDirection: 'risk',
      },
      {
        id: 'phone_surveillance',
        label: 'Someone monitors my phone or messages',
        sublabel: 'A family member or partner checking your activity',
        icon: 'phone-portrait-outline',
        riskDirection: 'risk',
      },
    ],
  },
  {
    id: 4,
    title: 'School & community',
    subtitle: "Safety isn't only about home. Tell us how things feel outside of it.",
    icon: 'people-outline',
    iconColor: '#8B6FB5',
    questions: [
      {
        id: 'bullied_at_school',
        label: "I'm being bullied or harassed at school or work",
        sublabel: 'Name-calling, exclusion, threats, or physical intimidation',
        icon: 'alert-circle-outline',
        riskDirection: 'risk',
      },
      {
        id: 'community_hostility',
        label: 'My neighbors or community are hostile toward me',
        sublabel: 'Harassment, discrimination, or feeling unwelcome where you live',
        icon: 'home-outline',
        riskDirection: 'risk',
      },
      {
        id: 'unsafe_outside_home',
        label: 'I feel unsafe or anxious when I leave home',
        sublabel: 'Constant vigilance or fear in public spaces',
        icon: 'navigate-outline',
        riskDirection: 'risk',
      },
    ],
  },
  {
    id: 5,
    title: 'Your mind',
    subtitle: "This is the most private step. You're safe to be honest here — it helps us support you better.",
    icon: 'heart-outline',
    iconColor: Colors.softGreen,
    questions: [
      {
        id: 'self_harm_thoughts',
        label: "I've been having thoughts of hurting myself or not wanting to be here",
        sublabel: 'Any thought of self-harm or suicide, however small',
        icon: 'alert-circle-outline',
        riskDirection: 'risk',
      },
      {
        id: 'hopelessness',
        label: 'I feel completely hopeless about my situation',
        sublabel: 'Like things will never get better',
        icon: 'cloud-outline',
        riskDirection: 'risk',
      },
    ],
  },
  {
    id: 6,
    title: 'Your resources',
    subtitle: 'These are the things that protect you. Even one of these matters enormously.',
    icon: 'shield-checkmark-outline',
    iconColor: Colors.softGreen,
    questions: [
      {
        id: 'trusted_contact',
        label: 'I have at least one person who fully accepts me',
        sublabel: 'Someone who knows and loves who you are',
        icon: 'heart-outline',
        riskDirection: 'protective',
      },
      {
        id: 'safe_place',
        label: 'I have somewhere safe I could go if I needed to',
        sublabel: "A friend's place, shelter, or another option",
        icon: 'navigate-outline',
        riskDirection: 'protective',
      },
      {
        id: 'basic_needs_met',
        label: 'My basic needs feel stable right now',
        sublabel: 'Food, shelter, and physical safety',
        icon: 'checkmark-circle-outline',
        riskDirection: 'protective',
      },
    ],
  },
];

export const PLAN_PROMPTS = [
  'First person I would contact:',
  'A safe place I could go:',
  'Something I need to hear right now:',
  'One small action I can take in the next hour:',
];
