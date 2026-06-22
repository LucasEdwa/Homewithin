import type { Translations } from '../en';
import common from './common';
import auth from './auth';
import onboarding from './onboarding';
import home from './home';
import wellness from './wellness';
import safety from './safety';
import social from './social';
import content from './content';
import profile from './profile';
import aiCompanion from './aiCompanion';

const sv: Translations = {
  ...common,
  ...auth,
  ...onboarding,
  ...home,
  ...wellness,
  ...safety,
  ...social,
  ...content,
  ...profile,
  ...aiCompanion,
};

export default sv;
