-- AI Academy LMS Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase Auth)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Modules table
create table if not exists modules (
  id serial primary key,
  order_number integer not null unique,
  title text not null,
  description text,
  gamma_embed_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Questions table
create table if not exists questions (
  id serial primary key,
  module_id integer references modules(id) on delete cascade,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer char(1) not null check (correct_answer in ('A', 'B', 'C', 'D')),
  order_number integer
);

-- User progress table
create table if not exists user_progress (
  id serial primary key,
  user_id uuid references auth.users on delete cascade,
  module_id integer references modules(id) on delete cascade,
  view_time_seconds integer default 0,
  quiz_score integer,
  quiz_completed boolean default false,
  completed_at timestamp with time zone,
  unique(user_id, module_id)
);

-- Certificates table
create table if not exists certificates (
  id serial primary key,
  user_id uuid references auth.users on delete cascade unique,
  verification_code text unique not null,
  average_score numeric,
  issued_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security Policies

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table modules enable row level security;
alter table questions enable row level security;
alter table user_progress enable row level security;
alter table certificates enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Modules policies (everyone can read)
create policy "Anyone can view modules"
  on modules for select
  to authenticated
  using (true);

-- Questions policies (everyone can read)
create policy "Anyone can view questions"
  on questions for select
  to authenticated
  using (true);

-- User progress policies
create policy "Users can view own progress"
  on user_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on user_progress for update
  using (auth.uid() = user_id);

-- Certificates policies
create policy "Users can view own certificate"
  on certificates for select
  using (auth.uid() = user_id);

create policy "Users can insert own certificate"
  on certificates for insert
  with check (auth.uid() = user_id);

-- Public certificate verification (anyone can verify a certificate)
create policy "Anyone can verify certificates"
  on certificates for select
  using (true);

-- Function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert module data
INSERT INTO modules (order_number, title, description, gamma_embed_url) VALUES
(1, 'De Nieuwe Realiteit', 'Waarom verandert ons vak en wat zijn de kansen?', 'https://gamma.app/embed/sx8y9gboegm7tyu'),
(2, 'Onder de Motorkap', 'Hoe werkt een taalmodel eigenlijk (zonder de technische details)?', 'https://gamma.app/embed/arbqdmuvgvlg6iq'),
(3, 'Ethiek & Veiligheid', 'De spelregels: AVG, de EU AI Act en databeveiliging.', 'https://gamma.app/embed/ttwx6wy333x5y1v'),
(4, 'Prompt Engineering', 'De kunst van vragen stellen: haal het beste uit de tools.', 'https://gamma.app/embed/71mccnj2rlf5q8n'),
(5, 'AI in Actie', 'Concrete toepassingen voor Claims, Acceptatie, Sales en HR.', 'https://gamma.app/embed/ocgbqtpykn52yfc'),
(6, 'Future Fit', 'Een blik op de toekomst: van Chatbots naar autonome AI Agents.', 'https://gamma.app/embed/00tipw0dh72qfpi')
ON CONFLICT (order_number) DO NOTHING;

-- Insert questions for Module 1: De Nieuwe Realiteit
INSERT INTO questions (module_id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_number) VALUES
(1, 'Wat is een van de belangrijkste redenen waarom AI de werkomgeving verandert?', 'AI vervangt alle menselijke taken volledig', 'AI kan repetitieve taken automatiseren en mensen ondersteunen bij complexe beslissingen', 'AI is alleen nuttig voor IT-bedrijven', 'AI vermindert de noodzaak voor creativiteit', 'B', 1),
(1, 'Welke houding is het meest effectief bij de adoptie van AI in organisaties?', 'Weerstand bieden tegen alle veranderingen', 'Afwachten tot AI perfect is', 'Actief leren en experimenteren met AI-tools', 'AI volledig negeren', 'C', 2),
(1, 'Wat is een belangrijke kans die AI biedt voor professionals?', 'Minder werk hoeven doen', 'Focus op hogerwaardig werk terwijl AI routinetaken overneemt', 'Alle beslissingen aan AI overlaten', 'Geen verantwoordelijkheid meer dragen', 'B', 3),
(1, 'Hoe verandert AI de verwachtingen van klanten?', 'Klanten verwachten langzamere service', 'Klanten verwachten snellere, persoonlijkere en 24/7 beschikbare service', 'Klanten willen minder digitale interactie', 'Klanten verwachten hogere prijzen', 'B', 4),
(1, 'Wat is essentieel voor organisaties die willen profiteren van AI?', 'Alle medewerkers ontslaan', 'Investeren in training en een cultuur van continue verbetering', 'Wachten tot concurrenten eerst bewegen', 'Alleen focussen op kostenreductie', 'B', 5);

-- Insert questions for Module 2: Onder de Motorkap
INSERT INTO questions (module_id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_number) VALUES
(2, 'Wat is de basis van hoe een taalmodel (LLM) tekst genereert?', 'Het kopieert tekst uit een database', 'Het voorspelt het meest waarschijnlijke volgende woord op basis van patronen', 'Het vertaalt alle tekst vanuit het Engels', 'Het raadpleegt een menselijke expert', 'B', 1),
(2, 'Wat wordt bedoeld met "training" van een AI-model?', 'Het model leert van grote hoeveelheden tekstdata om patronen te herkennen', 'Het model wordt fysiek getraind zoals een atleet', 'Het model krijgt een handleiding om te lezen', 'Het model wordt geprogrammeerd met specifieke antwoorden', 'A', 2),
(2, 'Waarom kunnen taalmodellen soms incorrecte informatie geven (hallucineren)?', 'Ze zijn geprogrammeerd om te liegen', 'Ze genereren waarschijnlijke tekst zonder echte feitencontrole', 'Ze hebben toegang tot verouderde databases', 'Ze begrijpen geen Nederlands', 'B', 3),
(2, 'Wat is een "parameter" in de context van AI-modellen?', 'Een instelling die de gebruiker moet invoeren', 'Een geleerd gewicht dat bepaalt hoe het model reageert', 'Een foutmelding van het systeem', 'Een type computer hardware', 'B', 4),
(2, 'Wat is het verschil tussen GPT en een traditionele zoekmachine?', 'GPT doorzoekt het internet in realtime', 'GPT genereert nieuwe tekst terwijl zoekmachines bestaande paginas vinden', 'Er is geen verschil', 'Zoekmachines zijn slimmer dan GPT', 'B', 5);

-- Insert questions for Module 3: Ethiek & Veiligheid
INSERT INTO questions (module_id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_number) VALUES
(3, 'Wat regelt de AVG (GDPR) primair?', 'Het gebruik van AI in bedrijven', 'De bescherming van persoonsgegevens van EU-burgers', 'Het auteursrecht op AI-gegenereerde content', 'De snelheid van internetverbindingen', 'B', 1),
(3, 'Wat is een kernprincipe van de EU AI Act?', 'Alle AI is verboden in de EU', 'AI-systemen worden gecategoriseerd op basis van risico', 'Alleen grote bedrijven mogen AI gebruiken', 'AI mag geen tekst genereren', 'B', 2),
(3, 'Welke data mag je NIET zomaar invoeren in publieke AI-tools zoals ChatGPT?', 'Openbare nieuwsartikelen', 'Persoonsgegevens van klanten of vertrouwelijke bedrijfsinformatie', 'Algemene vragen over weer', 'Publieke Wikipedia-informatie', 'B', 3),
(3, 'Wat is "bias" in de context van AI?', 'Een technische fout in de software', 'Systematische vooroordelen in AI-output door scheefheid in trainingsdata', 'Een type AI-model', 'Een maatregel voor databeveiliging', 'B', 4),
(3, 'Wie is verantwoordelijk voor de output van AI-tools in een professionele context?', 'De AI zelf', 'Het bedrijf dat de AI heeft gemaakt', 'De professional die de AI gebruikt en de output deelt', 'Niemand, AI-output is altijd vrijblijvend', 'C', 5);

-- Insert questions for Module 4: Prompt Engineering
INSERT INTO questions (module_id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_number) VALUES
(4, 'Wat is "prompt engineering"?', 'Het bouwen van AI-hardware', 'Het formuleren van effectieve instructies om betere AI-output te krijgen', 'Het programmeren van nieuwe AI-modellen', 'Het repareren van AI-fouten', 'B', 1),
(4, 'Welke techniek verbetert vaak de kwaliteit van AI-antwoorden?', 'Zo kort mogelijke prompts gebruiken', 'Context, rol en gewenste format meegeven in de prompt', 'Alleen ja/nee vragen stellen', 'De prompt in hoofdletters typen', 'B', 2),
(4, 'Wat is "few-shot prompting"?', 'Het stellen van weinig vragen', 'Het geven van enkele voorbeelden in de prompt om het gewenste format te tonen', 'Het beperken van de AI-output lengte', 'Het meerdere keren dezelfde vraag stellen', 'B', 3),
(4, 'Waarom is het nuttig om AI een "rol" te geven?', 'Het maakt de AI slimmer', 'Het helpt de AI de juiste toon, expertise en perspectief te hanteren', 'Het is verplicht volgens de wet', 'Het voorkomt hallucinaties volledig', 'B', 4),
(4, 'Wat doe je het beste als de AI-output niet voldoet?', 'Opgeven en handmatig werken', 'De prompt verfijnen met meer context of andere instructies', 'Klagen bij de AI-ontwikkelaar', 'Dezelfde prompt herhalen', 'B', 5);

-- Insert questions for Module 5: AI in Actie
INSERT INTO questions (module_id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_number) VALUES
(5, 'Hoe kan AI helpen bij claimsverwerking?', 'Door alle claims automatisch goed te keuren', 'Door patronen te herkennen, documenten te analyseren en fraudedetectie te ondersteunen', 'Door claims te weigeren zonder menselijke tussenkomst', 'Door klanten automatisch te bellen', 'B', 1),
(5, 'Wat is een praktische toepassing van AI in sales?', 'Klanten automatisch producten verkopen', 'Leads kwalificeren, gepersonaliseerde communicatie opstellen en klantinzichten genereren', 'Alle salesmedewerkers vervangen', 'Prijzen willekeurig aanpassen', 'B', 2),
(5, 'Hoe kan AI HR-afdelingen ondersteunen?', 'Door sollicitanten automatisch aan te nemen', 'Door CV-screening, onboarding-documentatie en veelgestelde vragen te automatiseren', 'Door alle medewerkers te monitoren', 'Door salarissen te bepalen', 'B', 3),
(5, 'Wat is belangrijk bij het implementeren van AI in bedrijfsprocessen?', 'Alles tegelijk automatiseren', 'Beginnen met duidelijke use cases en menselijke controle behouden', 'AI alleen door IT laten gebruiken', 'Wachten tot AI perfect is', 'B', 4),
(5, 'Wat is een voordeel van AI-geassisteerde acceptatie (underwriting)?', 'Alle risicos worden geaccepteerd', 'Snellere analyse van aanvragen met consistentere risico-inschatting', 'Geen menselijke expertise meer nodig', 'Lagere premies voor iedereen', 'B', 5);

-- Insert questions for Module 6: Future Fit
INSERT INTO questions (module_id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_number) VALUES
(6, 'Wat zijn "AI Agents"?', 'Menselijke AI-experts', 'AI-systemen die autonoom taken kunnen uitvoeren en beslissingen nemen', 'Simpele chatbots zonder intelligentie', 'Robots met fysieke lichamen', 'B', 1),
(6, 'Wat is het verschil tussen een chatbot en een AI Agent?', 'Er is geen verschil', 'Agents kunnen autonoom meerdere stappen uitvoeren en tools gebruiken', 'Chatbots zijn slimmer', 'Agents werken alleen offline', 'B', 2),
(6, 'Welke trend zien we in de ontwikkeling van AI?', 'AI wordt minder capabel', 'AI wordt multimodaal (tekst, beeld, audio) en meer autonoom', 'AI wordt alleen voor games gebruikt', 'AI-ontwikkeling stopt binnenkort', 'B', 3),
(6, 'Wat is belangrijk voor professionals om "future fit" te blijven?', 'AI volledig vermijden', 'Continu leren, experimenteren en adaptief zijn', 'Alleen technische vaardigheden ontwikkelen', 'Wachten tot anderen de weg wijzen', 'B', 4),
(6, 'Wat is een realistische verwachting voor AI in de nabije toekomst?', 'AI vervangt alle banen binnen 2 jaar', 'AI wordt een steeds krachtigere samenwerkingspartner voor mensen', 'AI-ontwikkeling zal stoppen', 'AI wordt minder toegankelijk', 'B', 5);
