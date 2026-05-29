export const RESOURCE_CATEGORY_IDS = [
  'family_rejection',
  'internalized_shame',
  'religious_trauma',
  'boundaries',
  'coming_out_safely',
  'outside_home',
  'body_image',
  'crisis_help',
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORY_IDS)[number];

export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  family_rejection: 'Family rejection',
  internalized_shame: 'Internalized shame',
  religious_trauma: 'Religious trauma',
  boundaries: 'Boundaries',
  coming_out_safely: 'Coming out safely',
  outside_home: 'School & community',
  body_image: 'Body & self-image',
  crisis_help: 'Crisis help',
};

export const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  family_rejection: '#9b4e4b',
  internalized_shame: '#a8e3d3',
  religious_trauma: '#E8844E',
  boundaries: '#7BC9A7',
  coming_out_safely: '#5B8DEF',
  outside_home: '#8B6FB5',
  body_image: '#B8A8E3',
  crisis_help: '#D9534F',
};

export interface Resource {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: ResourceCategory;
  language: string;
  readTime: number; // minutes
  createdAt: string;
}

export interface Lesson {
  id: string;
  programId: string;
  order: number;
  title: string;
  body: string;
  reflectionPrompt: string;
  readTime: number;
}

export interface Program {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  lessons: Lesson[];
}

export interface LessonProgress {
  lessonId: string;
  programId: string;
  completedAt: string;
}

export const LOCAL_RESOURCE_TYPES = [
  'lgbtq_center',
  'shelter',
  'therapist',
  'legal_aid',
  'support_group',
] as const;
export type LocalResourceType = (typeof LOCAL_RESOURCE_TYPES)[number];

export const LOCAL_RESOURCE_TYPE_LABELS: Record<LocalResourceType, string> = {
  lgbtq_center: 'LGBTQ+ Center',
  shelter: 'Shelter',
  therapist: 'Therapist',
  legal_aid: 'Legal Aid',
  support_group: 'Support Group',
};

export const LOCAL_RESOURCE_TYPE_ICONS: Record<LocalResourceType, string> = {
  lgbtq_center: 'heart-circle-outline',
  shelter: 'home-outline',
  therapist: 'medical-outline',
  legal_aid: 'briefcase-outline',
  support_group: 'people-outline',
};

export const LOCAL_RESOURCE_TYPE_COLORS: Record<LocalResourceType, string> = {
  lgbtq_center: '#5B8DEF',
  shelter: '#7BC9A7',
  therapist: '#B8A8E3',
  legal_aid: '#E8844E',
  support_group: '#D9534F',
};

export interface LocalResource {
  id: string;
  name: string;
  type: LocalResourceType;
  description: string;
  state: string;
  region?: string;
  city?: string;
  website?: string;
  phone?: string;
  email?: string;
  lat?: number;
  lng?: number;
}

export type WorkshopFormat = 'online' | 'in_person' | 'hybrid';

export interface Workshop {
  id: string;
  title: string;
  description: string;
  host: string;
  format: WorkshopFormat;
  date?: string;
  recurring?: string;
  link?: string;
  category?: string;
  free: boolean;
}

export interface LocalMeetup {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  date?: string;
  link?: string;
  lat?: number;
  lng?: number;
  recurring?: string;
}
