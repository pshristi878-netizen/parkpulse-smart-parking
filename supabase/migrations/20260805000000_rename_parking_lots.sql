-- =========================================================
-- Rename & re-localise the four seeded parking lots
-- Old names (US)  →  New names (India)
-- =========================================================

UPDATE public.parking_lots
SET
  name        = 'Connaught Place Parking',
  address     = 'Block A, Connaught Place',
  city        = 'New Delhi',
  latitude    = 28.6328,
  longitude   = 77.2197,
  description = 'Premium covered parking at Connaught Place with valet.'
WHERE name = 'Union Square ParkPro';

UPDATE public.parking_lots
SET
  name        = 'MG Road Smart Parking',
  address     = 'MG Road, Brigade Road Junction',
  city        = 'Bengaluru',
  latitude    = 12.9752,
  longitude   = 77.6069,
  description = 'Multi-level covered garage in the heart of MG Road.'
WHERE name = 'Downtown Central Garage';

UPDATE public.parking_lots
SET
  name        = 'Marine Drive Parking',
  address     = 'Marine Drive, Netaji Subhash Chandra Bose Road',
  city        = 'Mumbai',
  latitude    = 18.9439,
  longitude   = 72.8231,
  description = 'Open-air lot with a scenic view near the waterfront.'
WHERE name = 'Marina Blue Lot';

UPDATE public.parking_lots
SET
  name        = 'Charminar Public Parking',
  address     = 'Charminar Road, Ghansi Bazaar',
  city        = 'Hyderabad',
  latitude    = 17.3616,
  longitude   = 78.4747,
  description = 'Budget-friendly covered spots near Charminar.'
WHERE name = 'Mission District Parking';

-- Also update parking_history records that stored the old lot name as a
-- snapshot (lot_name is a TEXT column — not a FK — so it needs updating too)
UPDATE public.parking_history
SET lot_name = 'Connaught Place Parking'
WHERE lot_name = 'Union Square ParkPro';

UPDATE public.parking_history
SET lot_name = 'MG Road Smart Parking'
WHERE lot_name = 'Downtown Central Garage';

UPDATE public.parking_history
SET lot_name = 'Marine Drive Parking'
WHERE lot_name = 'Marina Blue Lot';

UPDATE public.parking_history
SET lot_name = 'Charminar Public Parking'
WHERE lot_name = 'Mission District Parking';
