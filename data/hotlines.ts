export interface Hotline {
  name: string;
  number: string;
  url?: string;
  notes?: string;
}

export interface CountryHotlines {
  country: string;
  code: string;
  hotlines: Hotline[];
}

export const CRISIS_HOTLINES: CountryHotlines[] = [
  {
    country: 'United States',
    code: 'US',
    hotlines: [
      { name: 'Trevor Project (LGBTQ+)', number: '1-866-488-7386', url: 'https://www.thetrevorproject.org' },
      { name: 'Crisis Text Line', number: 'Text HOME to 741741', notes: 'Text only' },
      { name: 'National Suicide Prevention', number: '988' },
    ],
  },
  {
    country: 'United Kingdom',
    code: 'GB',
    hotlines: [
      { name: 'Switchboard LGBT+ Helpline', number: '0300 330 0630', url: 'https://switchboard.lgbt' },
      { name: 'Samaritans', number: '116 123' },
      { name: 'Galop (LGBT+ abuse)', number: '0800 999 5428', url: 'https://galop.org.uk' },
    ],
  },
  {
    country: 'Brazil',
    code: 'BR',
    hotlines: [
      { name: 'Disque 100 (Human Rights)', number: '100' },
      { name: 'Centro de Valorização da Vida', number: '188' },
      { name: 'ABGLT', number: '+55 61 3321-6969', url: 'https://www.abglt.org' },
    ],
  },
  {
    country: 'Canada',
    code: 'CA',
    hotlines: [
      { name: 'Trans Lifeline', number: '877-330-6366', url: 'https://translifeline.org' },
      { name: 'Crisis Services Canada', number: '1-833-456-4566' },
      { name: 'Kids Help Phone', number: '1-800-668-6868', notes: 'Under 20' },
    ],
  },
  {
    country: 'Australia',
    code: 'AU',
    hotlines: [
      { name: 'QLife', number: '1800 184 527', url: 'https://qlife.org.au', notes: '3pm–midnight' },
      { name: 'Lifeline', number: '13 11 14' },
      { name: 'Beyond Blue', number: '1300 22 4636' },
    ],
  },
  {
    country: 'Germany',
    code: 'DE',
    hotlines: [
      { name: 'Schwulenberatung Berlin', number: '+49 30 233 691 0', url: 'https://schwulenberatungberlin.de' },
      { name: 'Telefonseelsorge', number: '0800 111 0 111' },
      { name: 'LSVD Helpline', number: '+49 221 925 96 10', url: 'https://lsvd.de' },
    ],
  },
  {
    country: 'Mexico',
    code: 'MX',
    hotlines: [
      { name: 'SAPTEL', number: '55 5259-8121', url: 'https://www.saptel.org.mx', notes: '24/7' },
      { name: 'CONAPRED', number: '800 543 0033' },
    ],
  },
  {
    country: 'India',
    code: 'IN',
    hotlines: [
      { name: 'iCall', number: '9152987821', url: 'https://icallhelpline.org' },
      { name: 'Vandrevala Foundation', number: '1860-2662-345', notes: '24/7' },
      { name: 'The Humsafar Trust', number: '+91 22 2667 3800', url: 'https://humsafar.org' },
    ],
  },
  {
    country: 'South Africa',
    code: 'ZA',
    hotlines: [
      { name: 'SADAG', number: '0800 456 789', url: 'https://www.sadag.org' },
      { name: 'Lifeline', number: '0861 322 322' },
      { name: 'OUT LGBT Wellbeing', number: '+27 12 430 3272', url: 'https://www.out.org.za' },
    ],
  },
  {
    country: 'France',
    code: 'FR',
    hotlines: [
      { name: 'SOS Amitié', number: '09 72 39 40 50' },
      { name: 'Ligne Azur (LGBT+)', number: '0810 20 30 40', url: 'https://www.ligneazur.org' },
      { name: 'Association AIDES', number: '0805 160 011', url: 'https://www.aides.org' },
    ],
  },
  {
    country: 'Netherlands',
    code: 'NL',
    hotlines: [
      { name: 'COC Nederland', number: '+31 20 623 4596', url: 'https://www.coc.nl' },
      { name: 'Sense (LGBT youth)', number: '0900 1010', url: 'https://sense.info' },
    ],
  },
  {
    country: 'Portugal',
    code: 'PT',
    hotlines: [
      { name: 'SOS Voz Amiga', number: '213 544 545' },
      { name: 'ILGA Portugal', number: '+351 218 873 918', url: 'https://ilga-portugal.pt' },
    ],
  },
];

export function getHotlinesForCountry(country: string): CountryHotlines | undefined {
  return CRISIS_HOTLINES.find(
    (c) => c.country.toLowerCase() === country.toLowerCase() || c.code.toLowerCase() === country.toLowerCase()
  );
}
