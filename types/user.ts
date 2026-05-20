export interface UserProfile {
  nickname: string;
  pronouns: string;
  ageRange: string;
  language: string;
  country: string;
  hideFromSearch: boolean;
  needs: string[];
  intentions?: string[];
  isAnonymous: boolean;
  avatarUrl?: string;
}

export type SafetyLevel = 'green' | 'yellow' | 'red' | null;

export type DisguiseStyle = 'weather' | 'calculator' | 'notes';
