export default {
  emergency: {
    title: 'Nödstöd',
    quickExit: 'Snabblämna',
    oneTapExit: 'Snabblämna med ett tryck',
    close: 'Stäng nödskärmen',
    supportText: 'Du är inte ensam. Hjälp finns tillgänglig just nu.',
    deleteDataTitle: 'Radera känsliga uppgifter?',
    deleteDataBody:
      'Detta tar permanent bort dina dagboksinlägg och chatthistorik från den här enheten. Det kan inte ångras.',
    deleteDataDone: 'Känsliga uppgifter har raderats.',
    done: 'Klar',
    actions: {
      localHelp: { label: 'Lokal hjälp', description: 'Hjälpcenter nära dig' },
      safetyPlan: { label: 'Säkerhetsplan', description: 'Dina personliga steg' },
      quickHide: { label: 'Snömdölj', description: 'Byt till en neutral skärm' },
      deleteData: { label: 'Radera data', description: 'Rensa känslig info' },
    },
    safetyPlanTitle: 'Din säkerhetsplan',
    safetyPlanEmpty: 'Ingen säkerhetsplan sparad än. Gå till Trygghetsbedömning för att skapa en.',
    localHelpTitle: 'Lokala hjälpcenter — {{state}}',
    seeAll: 'Se alla resurser i {{state}}',
    hideGuideTitle: 'Dölj app-guide',
    hideGuideText:
      'På Android: Inställningar → Appar → HomeWithin → Inaktivera.\nPå iOS: Håll ikonen → Ta bort app → Ta bort från hemskärmen.\n\nDu kan också ange ett förklädnadsnamn under Profil › Integritet.',
    callName: 'Ring {{name}}',
    visitName: 'Besök {{name}}s webbplats',
    buttonLabel: 'Nödstöd',
    buttonHint: 'Öppnar nödhjälp och krisstöd',
  },

  disguise: {
    title: 'App-förklädnadsläge',
    onLaunch: 'Förklädnad vid start',
    onLaunchHint: 'När på, visas en neutral skärm istället för HomeWithin när du öppnar appen.',
    pickDisguise: 'Välj en förklädnad',
    howToUnlock: 'Så låser du upp förklädnaden',
    unlockInstructions:
      'Tryck på titeln (överst på förklädnadsskärmen) 5 gånger inom 2 sekunder för att avslöja HomeWithin. Om du har ställt in en PIN-kod kommer du att ombedas att ange den.',
    previewBtn: 'Förhandsgranska förklädnad',
    styleAccessibility: 'Förklädnad: {{label}}',
    styles: {
      weather: { label: 'Väder', description: 'En enkel väder­skärm.' },
      calculator: { label: 'Kalkylator', description: 'En kalkylator som ser ut att fungera.' },
      notes: { label: 'Anteckningar', description: 'En enkel anteckningslista.' },
    },
  },

  pin: {
    setTitle: 'Ange en PIN-kod för dolda inlägg',
    enterTitle: 'Ange PIN-kod för att låsa upp',
    placeholder: 'Ange PIN-kod',
    confirm: 'Bekräfta',
  },
};
