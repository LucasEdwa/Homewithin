export default {
  onboarding: {
    intro: {
      skip: 'Hoppa över',
      slides: [
        {
          title: 'Välkommen till HomeWithin',
          body: 'En privat, säker plats för HBTQ+-personer — särskilt när hemmet inte alltid är tryggt.',
          features: ['Anonym som standard', 'Byggd för Sverige', 'Alltid gratis'],
        },
        {
          title: 'Följ ditt välmående',
          body: 'Check-in dagligen, skriv dagbok privat och prata med en AI-kompanjon som verkligen lyssnar.',
          features: ['Humör-check-ins', 'Privat dagbok', 'AI-kompanjon'],
        },
        {
          title: 'Hitta ditt folk',
          body: 'Matchas med jämnåriga som förstår. Bygg din valda familj. Gå med i stödcirklar.',
          features: ['Anonym peer-matchning', 'Vald familj', 'Gruppcirklar'],
        },
        {
          title: 'Stöd i hela Sverige',
          body: 'HBTQ+-center, härbärgen, terapeuter och evenemang — filtrerade till ditt län.',
          features: ['Alla 21 län', 'Terapeuter & härbärgen', 'Evenemang & program'],
        },
        {
          title: 'Din integritet, din kontroll',
          body: 'PIN-lås, förklädnadsläge och nödåtkomst med ett tryck håller dig säker.',
          features: ['PIN & Face ID-lås', 'Förklädnadsläge', 'Nödåtkomst'],
        },
      ],
    },

    step1: {
      title: 'Berätta lite om dig',
      subtitle: 'Inget riktigt namn behövs. Det här är privat för dig.',
      nickname: 'Smeknamn',
      nicknamePlaceholder: 't.ex. Björn, Saga, Alex',
      pronouns: 'Pronomen',
      ageRange: 'Åldersgrupp',
      language: 'Språk',
      background: 'Din bakgrund',
      backgroundPlaceholder: 't.ex. Sverige, Brasilien, Syrien, Somalia…',
      hideFromSearch: 'Dölj min profil från sökningar',
      hideFromSearchHint: 'Andra kan inte hitta dig om du inte kontaktar dem först.',
      nicknameRequired: 'Välj ett smeknamn.',
      ageRangeRequired: 'Välj din åldersgrupp.',
      backgroundRequired: 'Ange din bakgrund.',
    },

    step2: {
      title: 'Vad skulle hjälpa mest idag?',
      subtitle: 'Välj hur många du vill. Du kan ändra detta när som helst.',
      needs: {
        emotional_safety: {
          label: 'Emotionell trygghet',
          description: 'Jag behöver känna mig trygg just nu',
        },
        healing: { label: 'Läkning', description: 'Jag vill bearbeta vad som hände' },
        someone_to_talk: { label: 'Någon att prata med', description: 'Jag behöver bara bli hörd' },
        gay_friends: { label: 'Hitta gemenskap', description: 'Hitta människor som mig' },
        support_group: { label: 'Stödgrupp', description: 'En krets att tillhöra' },
        crisis_help: { label: 'Krisstöd', description: 'Jag behöver akut stöd just nu' },
      },
    },

    step3: {
      title: 'Vad är du öppen för att erbjuda?',
      subtitle:
        'De som söker efter detta kan hitta dig. Du kan ändra detta när som helst från din profil.',
      hint: 'Om allt lämnas omarkerat syns du inte i någons matchningar — du kan fortfarande bläddra.',
    },
  },
};
