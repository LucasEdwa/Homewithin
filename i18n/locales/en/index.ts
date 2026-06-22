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

const en = {
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

export default en;
export type Translations = typeof en;
