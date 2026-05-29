-- ─── Resource categories table ───────────────────────────────────────────────
-- Stores display metadata for each resource category: label and brand color.
-- Allows the app to fetch categories dynamically instead of hard-coding them.

create table if not exists resource_categories (
  id         text primary key,
  label      text not null,
  color      text not null,
  sort_order int  not null default 0
);

alter table resource_categories enable row level security;

create policy "Resource categories are publicly readable"
  on resource_categories for select
  using (true);

-- ─── Seed all categories ──────────────────────────────────────────────────────

insert into resource_categories (id, label, color, sort_order) values
  ('family_rejection',   'Family rejection',     '#9b4e4b', 1),
  ('internalized_shame', 'Internalized shame',   '#a8e3d3', 2),
  ('religious_trauma',   'Religious trauma',     '#E8844E', 3),
  ('boundaries',         'Boundaries',           '#7BC9A7', 4),
  ('coming_out_safely',  'Coming out safely',    '#5B8DEF', 5),
  ('outside_home',       'School & community',   '#8B6FB5', 6),
  ('body_image',         'Body & self-image',    '#B8A8E3', 7),
  ('crisis_help',        'Crisis help',          '#D9534F', 8)
on conflict (id) do update
  set label      = excluded.label,
      color      = excluded.color,
      sort_order = excluded.sort_order;

-- ─── Seed new body_image article ─────────────────────────────────────────────

insert into resources (id, title, summary, body, category, language, read_time, created_at) values

('bi-001',
 'Body Image Pressure and Emotional Isolation in the Gay Community',
 'How unrealistic appearance standards in gay culture affect mental health, relationships, and self-worth — and what a healthier definition of happiness looks like.',
 'To be a gay man in contemporary society can be emotionally complex and psychologically exhausting. While progress on LGBTQ+ rights is real, social acceptance has not eliminated the internal pressures many gay men experience daily. In modern gay culture, physical appearance is often treated as social currency — and the pressure to achieve the "perfect body" has become one of the most harmful standards affecting self-esteem, relationships, and mental health within the community.

Research now shows that gay and bisexual men experience some of the highest levels of body dissatisfaction among all male groups. Media, dating apps, pornography, fitness culture, and social media continuously promote a narrow ideal: muscular, lean, tall, youthful, masculine, and often white. These standards affect many people, but studies suggest they have a particularly strong impact on gay men.

According to the Mental Health Foundation, 53% of LGBTQ+ participants reported feeling anxious because of their body image, 56% reported depression connected to physical appearance, and approximately one-third reported suicidal thoughts linked to body dissatisfaction. Body image is not simply about vanity — it is deeply connected to emotional wellbeing, identity, and self-worth.

**The culture of comparison**

Social media amplifies these pressures to unprecedented levels. The most visible gay influencers frequently represent a narrow body standard: muscular physiques, flawless skin, expensive lifestyles, and carefully curated appearances. Many gay men find themselves comparing their everyday reality to digitally altered images, fuelling thoughts like:

• "I am not muscular enough."
• "My skin is not clear enough."
• "I am too feminine."
• "I do not look like the men people desire online."

Studies have linked excessive social media exposure to increased body dysmorphia, anxiety, depression, and steroid abuse. For gay men of color, these pressures become even more intense because beauty standards are often racialized — white, Eurocentric features continue to dominate media representation, causing many non-white gay men to feel excluded or invisible.

**When appearance replaces connection**

One of the most concerning effects of superficial beauty culture is the gradual loss of emotional depth in relationships. When perfection becomes the primary requirement for connection, genuine human intimacy becomes difficult to sustain.

A person may spend years pursuing the "perfect body" while simultaneously developing loneliness, insecurity, and fear of rejection. Some become trapped in endless cycles of self-improvement without ever feeling satisfied. Others isolate themselves because they believe they are not attractive enough to deserve love or attention.

Ironically, extreme perfectionism often produces emotional isolation rather than happiness. Confidence, emotional intelligence, empathy, communication, and self-respect are the qualities that create long-term compatibility — yet modern dating culture frequently reduces people to images rather than personalities.

**Minority stress and mental health**

Psychologists use the term "minority stress" to describe the chronic stress experienced by marginalized groups due to discrimination, rejection, and stigma. Gay men often experience this stress throughout their lives, beginning in childhood or adolescence. Bullying, rejection, internalized shame, and fear of discrimination all contribute significantly to body dissatisfaction and mental health struggles.

The pressure to appear masculine also plays an important role. Many gay men feel they must compensate for stereotypes associated with femininity by pursuing hyper-masculine appearances, increasing obsession with muscularity and gym culture.

LGBTQ+ adults experience significantly higher risks of anxiety, depression, self-harm, and suicide than heterosexual populations. These struggles are not caused by being gay itself — they are caused by the social pressures, discrimination, unrealistic expectations, and emotional isolation many LGBTQ+ people face.

**A healthier definition of happiness**

Health and self-care are important. Exercising, eating well, and caring for your appearance can improve confidence and wellbeing. Problems begin when self-worth becomes entirely dependent on physical perfection.

A healthier understanding of happiness must include emotional authenticity, self-acceptance, meaningful relationships, and psychological balance. Real connection is built through character rather than perfection. A person''s kindness, honesty, emotional stability, humor, empathy, and values determine the quality of relationships far more than physical appearance.

The challenge for modern gay culture is not simply to redefine beauty, but to redefine value itself. A healthier community must recognize that human worth is not measured by muscles, height, skin color, or perfection — but by character, emotional depth, compassion, and authenticity.

Only then can happiness become something deeper than appearance.',
 'body_image', 'English', 7, '2026-05-29T00:00:00Z')

on conflict (id) do nothing;
