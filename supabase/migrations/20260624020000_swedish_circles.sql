-- HomeWithin — Add language support to circles
-- Follows the same pattern as resources and programs:
-- language column on the table, separate rows per language.

-- ─── 1. Add language column ───────────────────────────────────────────────────
alter table circles add column if not exists language text not null default 'en';

-- ─── 2. Mark existing rows as English ────────────────────────────────────────
update circles set language = 'en';

-- ─── 3. Index for language-filtered queries ───────────────────────────────────
create index if not exists circles_language on circles (language);

-- ─── 4. Swedish circles ───────────────────────────────────────────────────────
insert into circles (slug, name, description, rules, category, member_cap, language) values
  (
    'family-rejection-survivors-sv',
    'Överlevare av familjeförkastning',
    'En liten krets för dig som läker efter att ha blivit avvisad av din familj för den du är.',
    E'1. Det som delas här stannar här.\n2. Inga råd om ingen bett om dem — lyssna först.\n3. Inga kränkningar, inget skambeläggande, ingen minimering av smärta.\n4. Du kan lämna när som helst.',
    'family_rejection',
    8,
    'sv'
  ),
  (
    'newly-out-sv',
    'Nyss utkommit',
    'För dig som nyligen kommit ut — för dig själv eller för andra — och funderar på vad som händer härnäst.',
    E'1. Fira små segrar.\n2. Outa ingen annanstans.\n3. Frågor välkomnas — ingen fråga är dum.\n4. Var snäll. Du var ny en gång också.',
    'coming_out_safely',
    8,
    'sv'
  ),
  (
    'building-confidence-sv',
    'Bygga självförtroende',
    'En plats att bygga upp självkänslan igen efter år av att bli tillsagd att du var mindre värd.',
    E'1. Lyft varandra.\n2. Dela framsteg, inte perfektion.\n3. Jämför inte smärta — varje berättelse spelar roll.\n4. Gränser välkomnas här.',
    'internalized_shame',
    8,
    'sv'
  ),
  (
    'religious-trauma-sv',
    'Religiöst trauma',
    'För HBTQ+-personer som bearbetar skada från religiösa gemenskaper eller läror.',
    E'1. Alla trosuppfattningar och ex-troende välkomnas.\n2. Ingen missionering åt något håll.\n3. Din berättelse är din — dela i din egen takt.\n4. Innehållsvarningar uppmuntras.',
    'religious_trauma',
    8,
    'sv'
  )
on conflict (slug) do nothing;
