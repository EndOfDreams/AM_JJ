-- Crée la table guests
create table if not exists public.guests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text not null,
  password text not null
);

-- Ajoute tes premiers utilisateurs (on ignore les conflits si déjà créés)
insert into public.guests (full_name, password)
values 
  ('Jean Dupont', '123456'),
  ('Camille Peres', 'admin'),
  ('Jijii', 'love');
