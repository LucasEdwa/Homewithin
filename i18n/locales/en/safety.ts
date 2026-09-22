export default {
  emergency: {
    title: 'Emergency Support',
    quickExit: 'Quick Exit',
    oneTapExit: 'One-tap exit',
    close: 'Close emergency screen',
    supportText: 'You are not alone. Help is available right now.',
    deleteDataTitle: 'Delete sensitive data?',
    deleteDataBody:
      'This will permanently delete your journal entries and chat history from this device. This cannot be undone.',
    deleteDataDone: 'Sensitive data has been deleted.',
    done: 'Done',
    actions: {
      localHelp: { label: 'Local help', description: 'Help centers near you' },
      safetyPlan: { label: 'Safety plan', description: 'Your personal steps' },
      quickHide: { label: 'Quick hide', description: 'Switch to a neutral screen' },
      deleteData: { label: 'Delete data', description: 'Wipe sensitive info' },
    },
    safetyPlanTitle: 'Your safety plan',
    safetyPlanEmpty: 'No safety plan saved yet. Go to the Safety Assessment to create one.',
    localHelpTitle: 'Local help centers — {{state}}',
    seeAll: 'See all resources in {{state}}',
    hideGuideTitle: 'Hide app guide',
    hideGuideText:
      'On Android: Settings → Apps → HomeWithin → Disable.\nOn iOS: Hold the icon → Remove App → Remove from Home Screen.\n\nYou can also set up a disguise name in Profile › Privacy.',
    callName: 'Call {{name}}',
    visitName: 'Visit {{name}} website',
    buttonLabel: 'Emergency support',
    buttonHint: 'Opens emergency help and crisis resources',
  },

  disguise: {
    title: 'App disguise mode',
    onLaunch: 'Disguise on launch',
    onLaunchHint: 'When on, opening the app shows a neutral screen instead of HomeWithin.',
    pickDisguise: 'Pick a disguise',
    howToUnlock: 'How to unlock the disguise',
    unlockInstructions:
      "Tap the title (top of the disguise screen) 5 times within 2 seconds to reveal HomeWithin. If you've set a PIN, you'll be asked to enter it next.",
    previewBtn: 'Preview disguise now',
    styleAccessibility: 'Disguise: {{label}}',
    styles: {
      weather: { label: 'Weather', description: 'A simple weather screen.' },
      calculator: { label: 'Calculator', description: 'A working-looking calculator.' },
      notes: { label: 'Notes', description: 'A plain notes list.' },
    },
  },

  pin: {
    setTitle: 'Set a PIN for hidden entries',
    enterTitle: 'Enter PIN to unlock',
    placeholder: 'Enter PIN',
    confirm: 'Confirm',
  },
};
