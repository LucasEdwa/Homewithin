// Arabic locale — DRAFT COVERAGE ONLY.
//
// Only common, home, and onboarding are translated so far (machine-assisted,
// not reviewed by a native speaker). Every other module — safety, wellness,
// aiCompanion, social, content, profile, auth — is intentionally left out of
// this bundle: i18next's fallbackLng: 'en' (see ../../index.ts) resolves any
// missing key to its English text automatically, so nothing breaks or shows
// a blank string. Crisis-line and safety-assessment copy in particular must
// not ship in Arabic until a native speaker has reviewed it — that's exactly
// the content this file leaves untranslated on purpose.
//
// To extend: copy the pattern from ../en/index.ts, add the newly-translated
// module's import + spread below, and get it reviewed before merging.
import common from './common';
import onboarding from './onboarding';
import home from './home';

const ar = {
  ...common,
  ...onboarding,
  ...home,
};

export default ar;
