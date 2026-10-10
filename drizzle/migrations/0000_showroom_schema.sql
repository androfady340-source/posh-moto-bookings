CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'androfady340@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_admin AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  type text NOT NULL DEFAULT 'car' CHECK (type IN ('car','motorcycle')),
  year int NOT NULL DEFAULT 2025,
  price_egp numeric NOT NULL CHECK (price_egp > 0),
  horsepower int,
  top_speed int,
  acceleration text,
  engine text,
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read vehicles" ON public.vehicles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage vehicles" ON public.vehicles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.vehicle_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  angle text NOT NULL DEFAULT 'Front',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicle_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_images TO authenticated;
GRANT ALL ON public.vehicle_images TO service_role;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read images" ON public.vehicle_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage images" ON public.vehicle_images FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (phone ~ '^\+?[0-9]{10,15}$'),
  email text CHECK (email IS NULL OR char_length(email) <= 255),
  city text CHECK (city IS NULL OR char_length(city) <= 100),
  booking_type text NOT NULL DEFAULT 'reserve' CHECK (booking_type IN ('reserve','viewing','both')),
  preferred_date date NOT NULL,
  preferred_time text NOT NULL CHECK (char_length(preferred_time) <= 10),
  instapay_sender text NOT NULL CHECK (char_length(instapay_sender) BETWEEN 2 AND 100),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  deposit_egp numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can book" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
CREATE POLICY "admin read bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update bookings" ON public.bookings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete bookings" ON public.bookings FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.bookings_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p numeric;
BEGIN
  SELECT price_egp INTO p FROM public.vehicles WHERE id = NEW.vehicle_id;
  IF p IS NULL THEN RAISE EXCEPTION 'Vehicle not found'; END IF;
  IF NEW.preferred_date < current_date THEN RAISE EXCEPTION 'Date must be today or later'; END IF;
  NEW.deposit_egp := round(p * 0.05);
  NEW.status := 'pending';
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_bi BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.bookings_before_insert();

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (char_length(comment) BETWEEN 3 AND 500),
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read approved reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (approved = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "submit review" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (approved = false);
CREATE POLICY "admin update reviews" ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin read vehicle files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin upload vehicle files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete vehicle files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(),'admin'));

INSERT INTO public.vehicles (id,name,brand,type,year,price_egp,horsepower,top_speed,acceleration,engine,description_en,description_ar) VALUES
('11111111-1111-1111-1111-111111111111','Revuelto','Lamborghini','car',2025,45000000,1001,350,'0-100 km/h in 2.5s','6.5L V12 Hybrid','The first V12 hybrid HPEV from Lamborghini. Three electric motors join a naturally aspirated V12 for 1,001 hp, an 8-speed dual-clutch gearbox and a carbon-fibre monofuselage. Matte black finish, carbon ceramic brakes and full Alcantara interior.','أول سيارة V12 هايبرد من لامبورجيني. ثلاث محركات كهربائية مع محرك V12 بقوة 1001 حصان، ناقل حركة ثنائي القابض بـ 8 سرعات وهيكل من ألياف الكربون. لون أسود مطفي، فرامل كربون سيراميك ومقصورة ألكانتارا بالكامل.'),
('22222222-2222-2222-2222-222222222222','Cullinan Black Badge','Rolls-Royce','car',2025,52000000,600,250,'0-100 km/h in 5.2s','6.75L Twin-Turbo V12','The darker alter ego of the ultimate luxury SUV. Hand-finished Black Badge details, starlight headliner, rear lounge seating and the legendary Magic Carpet Ride suspension. Silence, power and presence in one.','النسخة الأكثر جرأة من أفخم SUV في العالم. تفاصيل Black Badge مصنوعة يدوياً، سقف النجوم، مقاعد خلفية فاخرة وتعليق Magic Carpet Ride الأسطوري. هدوء وقوة وحضور في سيارة واحدة.'),
('33333333-3333-3333-3333-333333333333','SF90 Stradale','Ferrari','car',2024,38000000,986,340,'0-100 km/h in 2.5s','4.0L Twin-Turbo V8 Plug-in Hybrid','Ferrari''s first series-production plug-in hybrid. 986 hp, all-wheel drive, 25 km pure-electric range and Formula 1 derived technology. Rosso Corsa paint with carbon fibre package.','أول هايبرد قابلة للشحن من فيراري للإنتاج. قوة 986 حصان، دفع رباعي، 25 كم بالكهرباء فقط وتقنيات مستوحاة من الفورمولا 1. لون أحمر Rosso Corsa مع باكدج ألياف كربون.'),
('44444444-4444-4444-4444-444444444444','Panigale V4 R','Ducati','motorcycle',2025,3200000,218,320,'0-100 km/h in 2.9s','998cc Desmosedici Stradale R V4','The closest thing to a MotoGP bike on the road. Homologation special with winglets, Öhlins suspension, dry clutch option and 218 hp in a 172 kg package.','أقرب موتوسيكل لموتو جي بي على الطريق. نسخة خاصة بأجنحة هوائية، تعليق Öhlins وقوة 218 حصان بوزن 172 كجم فقط.'),
('55555555-5555-5555-5555-555555555555','M 1000 RR','BMW','motorcycle',2025,2900000,212,314,'0-100 km/h in 3.1s','999cc Inline-4 ShiftCam','BMW M''s first motorcycle. Carbon winglets, titanium Akrapovič exhaust, M brakes and M Competition package. Built for the track, legal for the street.','أول موتوسيكل من BMW M. أجنحة كربون، شكمان تيتانيوم أكرابوفيتش، فرامل M وباكدج M Competition. مصنوع للحلبة وقانوني للشارع.'),
('66666666-6666-6666-6666-666666666666','CVO Road Glide','Harley-Davidson','motorcycle',2025,2400000,115,180,'0-100 km/h in 4.0s','121ci Milwaukee-Eight VVT V-Twin','The pinnacle of American touring. Hand-painted black finish, chrome details, 12.3" touchscreen, premium audio and the most powerful Harley touring engine ever.','قمة موتوسيكلات التورينج الأمريكية. دهان أسود يدوي، تفاصيل كروم، شاشة 12.3 بوصة، نظام صوت فاخر وأقوى محرك تورينج من هارلي.');

INSERT INTO public.vehicle_images (vehicle_id,url,angle,sort_order) VALUES
('11111111-1111-1111-1111-111111111111','/images/revuelto-1.jpg','Front',0),
('11111111-1111-1111-1111-111111111111','/images/revuelto-2.jpg','Rear',1),
('22222222-2222-2222-2222-222222222222','/images/cullinan-1.jpg','Front',0),
('22222222-2222-2222-2222-222222222222','/images/cullinan-2.jpg','Interior',1),
('33333333-3333-3333-3333-333333333333','/images/sf90-1.jpg','Side',0),
('44444444-4444-4444-4444-444444444444','/images/panigale-1.jpg','Front',0),
('55555555-5555-5555-5555-555555555555','/images/m1000rr-1.jpg','Side',0),
('66666666-6666-6666-6666-666666666666','/images/roadglide-1.jpg','Front',0);

INSERT INTO public.reviews (name,rating,comment,approved) VALUES
('Omar K.',5,'Flawless experience from booking to delivery. Truly world-class.',true),
('Nour H.',5,'The Cullinan was exactly as described. Professional team.',true),
('Karim S.',4,'Great selection of superbikes and fast response on WhatsApp.',true);