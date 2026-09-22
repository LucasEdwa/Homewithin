export const INTENTION_IDS = [
  "family_rejection",
  "first_friend",
  "mentor",
  "listener",
  "support_group",
  "religious_trauma",
] as const;
export type IntentionId = (typeof INTENTION_IDS)[number];

export interface IntentionOption {
  id: IntentionId;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const INTENTIONS: IntentionOption[] = [
  {
    id: "family_rejection",
    label: "Survived family rejection",
    description: "Someone who's been through it",
    icon: "heart-dislike-outline",
    color: "#D9534F",
  },
  {
    id: "first_friend",
    label: "First queer friend",
    description: "Someone like me to connect with",
    icon: "people-circle-outline",
    color: "#5B8DEF",
  },
  {
    id: "mentor",
    label: "A mentor",
    description: "Someone further along the path",
    icon: "school-outline",
    color: "#7BC9A7",
  },
  {
    id: "listener",
    label: "Someone to listen",
    description: "I just need to be heard",
    icon: "chatbubbles-outline",
    color: "#B8A8E3",
  },
  {
    id: "support_group",
    label: "Group support",
    description: "A circle I can belong to",
    icon: "people-outline",
    color: "#E8844E",
  },
  {
    id: "religious_trauma",
    label: "Survived religious trauma",
    description: "Left a faith community, found my way out",
    icon: "leaf-outline",
    color: "#A0845C",
  },
];

export type MatchStatus = "pending" | "accepted" | "passed" | "blocked";

export interface PeerProfile {
  userId: string;
  nickname: string;
  ageRange?: string;
  language?: string;
  country?: string;
  needs: string[];
  avatarUrl?: string;
}

export interface MatchLastMessage {
  body: string;
  createdAt: string;
  senderId: string;
}

export interface Match {
  id: string;
  requesterId: string;
  targetId: string;
  intention: IntentionId;
  status: MatchStatus;
  createdAt: string;
  peer?: PeerProfile;
  lastMessage?: MatchLastMessage;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  body: string;
  expiresAt?: string;
  createdAt: string;
  liked?: boolean;
  replyToId?: string;
  replyToBody?: string;
  replyToSenderId?: string;
}

export interface Circle {
  id: string;
  slug: string;
  name: string;
  description: string;
  rules: string;
  category?: string;
  memberCap: number;
  memberCount: number;
  isMember: boolean;
  introSeen: boolean;
  createdAt: string;
}

export interface CircleMessage {
  id: string;
  circleId: string;
  senderId: string;
  senderNickname?: string;
  senderAvatarUrl?: string;
  isAI?: boolean;
  body: string;
  createdAt: string;
}

export type CircleMemberRole = "member" | "moderator";

export interface CircleMember {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  role: CircleMemberRole;
  isMe?: boolean;
}

export type SupportRole =
  | "trusted_friend"
  | "mentor"
  | "therapist"
  | "emergency_contact"
  | "community_group";

export interface SupportRoleMeta {
  id: SupportRole;
  label: string;
  icon: string;
  description: string;
  color: string;
  contactType: "phone" | "sms" | "none";
}

export const SUPPORT_ROLES: SupportRoleMeta[] = [
  {
    id: "trusted_friend",
    label: "Trusted Friend",
    icon: "heart-outline",
    description: "Someone who knows and accepts you",
    color: "#5B8DEF",
    contactType: "sms",
  },
  {
    id: "mentor",
    label: "Mentor",
    icon: "school-outline",
    description: "A guide on your healing journey",
    color: "#B8A8E3",
    contactType: "sms",
  },
  {
    id: "therapist",
    label: "Therapist",
    icon: "medical-outline",
    description: "Professional mental health support",
    color: "#7BC9A7",
    contactType: "phone",
  },
  {
    id: "emergency_contact",
    label: "Emergency Contact",
    icon: "shield-checkmark-outline",
    description: "First person to call in a crisis",
    color: "#D9534F",
    contactType: "phone",
  },
  {
    id: "community_group",
    label: "Community Group",
    icon: "people-outline",
    description: "A group where you belong",
    color: "#E8844E",
    contactType: "none",
  },
];

export interface SupportPerson {
  id: string;
  nickname: string;
  role: SupportRole;
  contactInfo?: string;
  notes?: string;
  createdAt: string;
  matchId?: string;
  matchUserId?: string;
  circleId?: string;
}

export type BlockedUser = {
  userId: string;
  nickname: string;
  createdAt: string;
};
