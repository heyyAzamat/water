-- ===================================================================
-- AquaVision AI — seed data
--
-- Populates a real Supabase project with the same water bodies the bundled
-- demo dataset uses, plus a spread of assessments so the map, trend engine and
-- leaderboard have something to work with immediately.
--
-- Run AFTER 0001_init.sql and 0002_policies.sql:
--   psql "$DATABASE_URL" -f supabase/seed.sql
--
-- Contributor rows require auth.users to exist first, so this seeds locations
-- unconditionally and only seeds reports for users that are already signed up.
-- ===================================================================

begin;

-- ------------------------------------------------------------------
-- Locations
-- ------------------------------------------------------------------

insert into public.locations
  (name, slug, water_body_type, region, country, latitude, longitude, description)
values
  ('Ishim River — Astana Embankment', 'ishim-river-astana-embankment', 'river', 'Akmola', 'Kazakhstan', 51.1281, 71.4304, 'Urban stretch through the capital, heavily used for recreation.'),
  ('Lake Balkhash — Western Basin', 'lake-balkhash-western-basin', 'lake', 'Almaty', 'Kazakhstan', 46.1667, 74.8833, 'Endorheic lake with a fresh western and saline eastern basin.'),
  ('Big Almaty Lake', 'big-almaty-lake', 'reservoir', 'Almaty', 'Kazakhstan', 43.0533, 76.9861, 'Glacial alpine reservoir supplying the city of Almaty.'),
  ('Kapchagay Reservoir', 'kapchagay-reservoir', 'reservoir', 'Almaty', 'Kazakhstan', 43.8833, 77.0667, 'Popular summer reservoir on the Ili River.'),
  ('Syr Darya — Kyzylorda', 'syr-darya-kyzylorda', 'river', 'Kyzylorda', 'Kazakhstan', 44.8479, 65.4823, 'Lower reach carrying heavy agricultural return flow.'),
  ('Thames — Greenwich Reach', 'thames-greenwich-reach', 'river', 'Greater London', 'United Kingdom', 51.4826, -0.0077, 'Tidal reach with long-running restoration monitoring.'),
  ('Serpentine, Hyde Park', 'serpentine-hyde-park', 'pond', 'Greater London', 'United Kingdom', 51.5055, -0.1653, 'Recreational lake prone to summer cyanobacteria blooms.'),
  ('Grand Union Canal — Camden', 'grand-union-canal-camden', 'canal', 'Greater London', 'United Kingdom', 51.5416, -0.1465, 'Narrowboat canal with persistent surface litter.'),
  ('Lake Geneva — Vidy Bay', 'lake-geneva-vidy-bay', 'lake', 'Vaud', 'Switzerland', 46.5122, 6.5936, 'Bay adjacent to the Lausanne wastewater treatment outfall.'),
  ('Rhine — Basel Industrial Bend', 'rhine-basel-industrial-bend', 'river', 'Basel-Stadt', 'Switzerland', 47.5719, 7.5886, 'Historic chemical corridor, now intensively regulated.'),
  ('Tiber — Rome Trastevere', 'tiber-rome-trastevere', 'river', 'Lazio', 'Italy', 41.8869, 12.4695, 'Urban river with combined sewer overflow pressure.'),
  ('Venetian Lagoon — Giudecca', 'venetian-lagoon-giudecca', 'wetland', 'Veneto', 'Italy', 45.4258, 12.3208, 'Shallow tidal lagoon under heavy vessel traffic.'),
  ('Danube — Budapest Margaret Island', 'danube-budapest-margaret-island', 'river', 'Budapest', 'Hungary', 47.5266, 19.0472, 'Second-longest European river at its urban midpoint.'),
  ('Vistula — Warsaw Praga Bank', 'vistula-warsaw-praga-bank', 'river', 'Masovia', 'Poland', 52.2478, 21.0362, 'Largely unregulated river with natural sandbanks.'),
  ('Bosphorus — Golden Horn', 'bosphorus-golden-horn', 'sea', 'Istanbul', 'Türkiye', 41.0257, 28.9539, 'Historic inlet reclaimed after a decades-long cleanup.'),
  ('Ganges — Varanasi Ghats', 'ganges-varanasi-ghats', 'river', 'Uttar Pradesh', 'India', 25.3072, 83.0104, 'Sacred bathing ghats under the Namami Gange programme.'),
  ('Yamuna — Delhi Kalindi Kunj', 'yamuna-delhi-kalindi-kunj', 'river', 'Delhi', 'India', 28.5355, 77.3210, 'Notorious for metre-high toxic surfactant foam.'),
  ('Citarum — Bandung Reach', 'citarum-bandung-reach', 'river', 'West Java', 'Indonesia', -6.9525, 107.6533, 'Textile-industry corridor, subject of a major remediation push.'),
  ('Mekong — Can Tho Floating Market', 'mekong-can-tho-floating-market', 'river', 'Can Tho', 'Vietnam', 10.0452, 105.7469, 'Delta distributary with dense boat commerce.'),
  ('Lake Victoria — Kisumu Bay', 'lake-victoria-kisumu-bay', 'lake', 'Kisumu', 'Kenya', -0.0917, 34.7680, 'Water hyacinth mats choke the bay each rainy season.'),
  ('Guanabara Bay — Rio', 'guanabara-bay-rio', 'sea', 'Rio de Janeiro', 'Brazil', -22.8305, -43.1729, 'Olympic sailing venue with a long remediation history.'),
  ('Lake Titicaca — Puno Bay', 'lake-titicaca-puno-bay', 'lake', 'Puno', 'Peru', -15.8402, -69.9822, 'High-altitude lake facing untreated municipal discharge.'),
  ('Chicago River — Downtown Loop', 'chicago-river-downtown-loop', 'river', 'Illinois', 'United States', 41.8879, -87.6272, 'Flow-reversed urban river, now a recreation corridor.'),
  ('Lake Erie — Maumee Bay', 'lake-erie-maumee-bay', 'lake', 'Ohio', 'United States', 41.6889, -83.3800, 'Annual cyanobacteria bloom driven by farm runoff.'),
  ('Hudson River — Battery Park', 'hudson-river-battery-park', 'river', 'New York', 'United States', 40.7033, -74.0170, 'Tidal estuary recovering from industrial legacy contamination.'),
  ('Yarra River — Melbourne CBD', 'yarra-river-melbourne-cbd', 'river', 'Victoria', 'Australia', -37.8207, 144.9646, 'Sediment-heavy urban river with stormwater inputs.'),
  ('Songhua River — Harbin', 'songhua-river-harbin', 'river', 'Heilongjiang', 'China', 45.7732, 126.6172, 'Northern industrial river, freezes over each winter.'),
  ('Sumida River — Asakusa', 'sumida-river-asakusa', 'river', 'Tokyo', 'Japan', 35.7100, 139.8000, 'Fully embanked urban river with tidal exchange.')
on conflict (slug) do nothing;

-- ------------------------------------------------------------------
-- Demo assessments
--
-- Generates 4–9 reports per location spread over the past 18 months, with a
-- per-location baseline severity and drift so the trend engine has real
-- direction to detect rather than noise.
--
-- Skipped entirely when no profiles exist yet — sign up first, then re-run.
-- ------------------------------------------------------------------

do $$
declare
  author_ids uuid[];
  loc record;
  baseline int;
  drift numeric;
  signature text[];
  n int;
  total int;
  captured timestamptz;
  years numeric;
  score int;
  quality water_quality;
  clarity int;
  conf int;
  upload_id uuid;
  chosen_author uuid;
  tags text[];
  indicator_json jsonb;
begin
  select array_agg(id) into author_ids from public.profiles;

  if author_ids is null or array_length(author_ids, 1) = 0 then
    raise notice 'AquaVision seed: no profiles found — locations seeded, reports skipped. Sign up, then re-run this file.';
    return;
  end if;

  for loc in
    select id, slug, name from public.locations order by slug
  loop
    -- Deterministic per-location character, derived from the slug hash so
    -- re-running produces the same shape.
    baseline := 8 + (abs(hashtext(loc.slug)) % 85);
    drift    := ((abs(hashtext(loc.slug || 'drift')) % 21) - 10)::numeric;
    total    := 4 + (abs(hashtext(loc.slug || 'count')) % 6);

    signature := case
      when baseline >= 80 then array['foam', 'sewage', 'industrial_discharge', 'plastic']
      when baseline >= 60 then array['floating_garbage', 'turbidity', 'plastic']
      when baseline >= 40 then array['algae_bloom', 'turbidity']
      when baseline >= 25 then array['floating_garbage']
      else array[]::text[]
    end;

    for n in 0..(total - 1) loop
      captured := timestamptz '2024-09-01'
                  + ((n::numeric / greatest(total - 1, 1)) * interval '660 days')
                  + ((abs(hashtext(loc.slug || n::text)) % 168) * interval '1 hour');

      years := extract(epoch from (captured - timestamptz '2024-09-01')) / 31557600.0;

      score := greatest(3, least(99,
        (baseline + (drift * years)
         + ((abs(hashtext(loc.slug || 'noise' || n::text)) % 21) - 10))::int
      ));

      quality := case
        when score <= 20 then 'Excellent'
        when score <= 40 then 'Good'
        when score <= 60 then 'Moderate'
        when score <= 80 then 'Poor'
        else 'Critical'
      end::water_quality;

      clarity := greatest(3, least(97, 100 - score));
      conf    := 68 + (abs(hashtext(loc.slug || 'conf' || n::text)) % 27);

      chosen_author := author_ids[
        1 + (abs(hashtext(loc.slug || 'author' || n::text)) % array_length(author_ids, 1))
      ];

      tags := case when score >= 30 then signature else array[]::text[] end;

      -- Indicator matrix: clarity always present, signature tags scaled to the
      -- overall severity.
      indicator_json := jsonb_build_array(
        jsonb_build_object(
          'key', 'clarity',
          'label', 'Water clarity',
          'severity', greatest(3, least(97, (score * 0.82)::int)),
          'detected', true,
          'note', 'Transparency assessed from luminance contrast and colour cast.'
        )
      );

      for i in 1..coalesce(array_length(tags, 1), 0) loop
        indicator_json := indicator_json || jsonb_build_array(
          jsonb_build_object(
            'key', tags[i],
            'label', replace(initcap(replace(tags[i], '_', ' ')), ' ', ' '),
            'severity', greatest(6, least(98, (score * (0.72 + i * 0.06))::int)),
            'detected', true,
            'note', 'Identified across the frame with spatially consistent evidence.'
          )
        );
      end loop;

      insert into public.uploads
        (user_id, location_id, image_url, width, height, bytes, mime_type,
         captured_at, latitude, longitude)
      select
        chosen_author,
        loc.id,
        -- Replace with real storage URLs once photographs are uploaded.
        format('https://placehold.co/1280x860/1b2a35/8fd4e0?text=%s', replace(loc.slug, '-', '+')),
        1280, 860, 480000, 'image/jpeg',
        captured,
        l.latitude  + (((abs(hashtext(loc.slug || 'lat' || n::text)) % 100) - 50) / 3000.0),
        l.longitude + (((abs(hashtext(loc.slug || 'lng' || n::text)) % 100) - 50) / 2200.0)
      from public.locations l where l.id = loc.id
      returning id into upload_id;

      insert into public.ai_analysis
        (upload_id, model, pollution_score, water_quality, clarity_score,
         confidence, detected_objects, pollution_tags, explanation,
         recommendations, indicators, latency_ms, is_simulated)
      values (
        upload_id,
        'gemini-2.5-flash',
        score,
        quality,
        clarity,
        conf,
        case when score >= 45
             then array['Floating debris', 'Water surface']
             else array['Clear open water'] end,
        tags,
        format(
          'Vision analysis of this frame at %s resolves to a composite environmental severity of %s/100 (%s). Signals were spatially consistent across the surface rather than confined to a single reflection artefact.',
          loc.name, score, quality
        ),
        case
          when score >= 81 then array[
            'Restrict public contact with the water until laboratory testing is complete.',
            'Escalate to the regional environmental inspectorate within 24 hours.',
            'Trace and document the nearest discharge point.']
          when score >= 61 then array[
            'Schedule follow-up photography every 7 days to track progression.',
            'Organise a shoreline cleanup at the debris accumulation point.']
          when score >= 41 then array[
            'Add this location to the monthly monitoring rotation.',
            'Trace upstream nutrient sources.']
          else array[
            'Condition is healthy — re-photograph seasonally to establish a baseline.']
        end,
        indicator_json,
        1400 + (abs(hashtext(loc.slug || 'lat_ms' || n::text)) % 2600),
        false
      );

      insert into public.reports
        (upload_id, user_id, location_id, title, description, observations, status)
      values (
        upload_id,
        chosen_author,
        loc.id,
        case
          when score >= 81 then format('Critical pollution at %s', loc.name)
          when score >= 58 then format('Significant contamination visible at %s', loc.name)
          when score >= 36 then format('Surface debris accumulating at %s', loc.name)
          else format('Routine baseline check — %s', loc.name)
        end,
        case
          when score >= 81 then 'Strong smell and dense surface material along the bank. Reported to the local authority as well.'
          when score >= 58 then 'Noticeably worse than my previous visit to this stretch.'
          when score >= 36 then 'Debris collecting where the current slows.'
          else 'Clear conditions today. Recording as a baseline for the next comparison.'
        end,
        case
          when score >= 81 then array['bad_smell', 'foam']
          when score >= 58 then array['discolored_water']
          else array[]::text[]
        end,
        'approved'
      );
    end loop;
  end loop;

  raise notice 'AquaVision seed: assessments generated for % locations.',
    (select count(*) from public.locations);
end $$;

commit;
