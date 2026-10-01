import { ImageSourcePropType } from 'react-native';

export type PantherMode =
  | 'default'
  | 'scout'
  | 'mentor'
  | 'coach'
  | 'guide'
  | 'guardian'
  | 'analyzing';

export type PantherPose =
  | 'standing_3_4'
  | 'stalking_scout'
  | 'sitting_guardian'
  | 'coach_focused'
  | 'guide_forward'
  | 'mentor_presence';

export interface PantherModeProfile {
  mode: PantherMode;
  pose: PantherPose;
  tagline: string;
  glowColor: string;
  eyeIntensity: number;
  bloomRadius: number;
  showScanner: boolean;
  imageSource: ImageSourcePropType;
}

export const PANTHER_PROFILES: Record<PantherMode, PantherModeProfile> = {
  default: {
    mode: 'default',
    pose: 'standing_3_4',
    tagline: "What's your next move?",
    glowColor: '#38bdf8',
    eyeIntensity: 0.85,
    bloomRadius: 18,
    showScanner: false,
    imageSource: require('../../../assets/panther-scout.jpeg'),
  },
  scout: {
    mode: 'scout',
    pose: 'stalking_scout',
    tagline: 'I found something for you.',
    glowColor: '#00f0ff',
    eyeIntensity: 1.0,
    bloomRadius: 28,
    showScanner: true,
    imageSource: require('../../../assets/panther-scout.jpeg'),
  },
  mentor: {
    mode: 'mentor',
    pose: 'mentor_presence',
    tagline: "Let's figure out your next move.",
    glowColor: '#818cf8',
    eyeIntensity: 0.9,
    bloomRadius: 22,
    showScanner: false,
    imageSource: require('../../../assets/panther-mentor.jpeg'),
  },
  coach: {
    mode: 'coach',
    pose: 'coach_focused',
    tagline: 'Ready to test what you actually know?',
    glowColor: '#34d399',
    eyeIntensity: 0.95,
    bloomRadius: 24,
    showScanner: false,
    imageSource: require('../../../assets/panther-coach.jpeg'),
  },
  guide: {
    mode: 'guide',
    pose: 'guide_forward',
    tagline: 'Your path starts here.',
    glowColor: '#c084fc',
    eyeIntensity: 0.85,
    bloomRadius: 20,
    showScanner: false,
    imageSource: require('../../../assets/panther-scout.jpeg'),
  },
  guardian: {
    mode: 'guardian',
    pose: 'sitting_guardian',
    tagline: 'I spotted something important.',
    glowColor: '#fb923c',
    eyeIntensity: 1.0,
    bloomRadius: 26,
    showScanner: false,
    imageSource: require('../../../assets/panther-guardian.jpeg'),
  },
  analyzing: {
    mode: 'analyzing',
    pose: 'coach_focused',
    tagline: "Let's see where you stand.",
    glowColor: '#38bdf8',
    eyeIntensity: 1.0,
    bloomRadius: 30,
    showScanner: true,
    imageSource: require('../../../assets/panther-coach.jpeg'),
  },
};