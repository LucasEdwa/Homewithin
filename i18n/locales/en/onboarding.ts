export default {
  onboarding: {
    intro: {
      skip: 'Skip',
      slides: [
        {
          title: 'Welcome to HomeWithin',
          body: "A private, safe space built for LGBTQ+ people — especially when home isn't always safe.",
          features: ['Anonymous by default', 'Built for Sweden', 'Always free'],
        },
        {
          title: 'Track your wellbeing',
          body: 'Check in daily, journal privately, and talk to an AI companion that truly listens.',
          features: ['Mood check-ins', 'Private journal', 'AI companion'],
        },
        {
          title: 'Find your people',
          body: 'Get matched with peers who get it. Build your chosen family. Join support circles.',
          features: ['Anonymous peer matching', 'Chosen family', 'Group circles'],
        },
        {
          title: 'Support across Sweden',
          body: 'LGBTQ+ centers, shelters, therapists, and events — filtered to your county.',
          features: ['All 21 counties', 'Therapists & shelters', 'Events & programs'],
        },
        {
          title: 'Your privacy, your control',
          body: 'PIN lock, disguise mode, and one-tap emergency access keep you safe.',
          features: ['PIN & Face ID lock', 'Disguise mode', 'Emergency access'],
        },
      ],
    },

    step1: {
      title: 'Tell us a little about you',
      subtitle: 'No real name needed. This stays private to you.',
      nickname: 'Nickname',
      nicknamePlaceholder: 'e.g. River, Sage, Alex',
      pronouns: 'Pronouns',
      ageRange: 'Age range',
      language: 'Language',
      background: 'Your background',
      backgroundPlaceholder: 'e.g. Sweden, Brazil, Syria, Somalia…',
      hideFromSearch: 'Hide my profile from search',
      hideFromSearchHint: "Others won't be able to find you unless you connect first.",
      nicknameRequired: 'Please choose a nickname.',
      ageRangeRequired: 'Please select your age range.',
      backgroundRequired: 'Please enter your background.',
    },

    step2: {
      title: 'What would help most today?',
      subtitle: 'Choose as many as you like. You can change this anytime.',
      needs: {
        emotional_safety: { label: 'Emotional safety', description: 'I need to feel safe right now' },
        healing: { label: 'Healing', description: 'I want to process what happened' },
        someone_to_talk: { label: 'Someone to talk', description: 'I just need to be heard' },
        gay_friends: { label: 'Find community', description: 'Find people like me' },
        support_group: { label: 'Support group', description: 'A circle I can belong to' },
        crisis_help: { label: 'Crisis help', description: 'I need urgent support right now' },
      },
    },

    step3: {
      title: 'What are you open to offering?',
      subtitle:
        'People searching for these will be able to find you. You can change this anytime from your profile.',
      hint: "Leaving everything unchecked means you won't appear in anyone's matches — you can still browse.",
    },
  },
};
