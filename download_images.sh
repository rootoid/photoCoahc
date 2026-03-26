#!/bin/bash
# PhotoCoach — Image Downloader
# All images from Unsplash (free, no attribution required for display)
# Targeting ~1MB per image to stay well within 50MB total

cd /home/mike/photoCoach/images

echo "Downloading PhotoCoach scene images..."

# ── Missing original ──────────────────────────────────────
curl -L -o architecture.jpg     "https://images.unsplash.com/photo-1486718448742-163732cd1544?w=1200&q=75" &

# ── New Scenes (30) ───────────────────────────────────────

# Scene 13: Foggy Forest — long exposure, mood, ISO low
curl -L -o foggy_forest.jpg     "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=75" &

# Scene 14: Aurora Borealis — night sky, long exposure
curl -L -o aurora.jpg           "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=75" &

# Scene 15: Desert Dunes at Sunrise
curl -L -o desert_dunes.jpg     "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&q=75" &

# Scene 16: Snowy Mountain Peak
curl -L -o snowy_mountain.jpg   "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&q=75" &

# Scene 17: Milky Way Night Sky
curl -L -o milky_way.jpg        "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=75" &

# Scene 18: Studio Portrait (low key)
curl -L -o studio_portrait.jpg  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&q=75" &

# Scene 19: Hummingbird in Flight
curl -L -o hummingbird.jpg      "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=1200&q=75" &

# Scene 20: Fire Performance
curl -L -o fire_performance.jpg "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=75" &

# Scene 21: Food Photography (top-down)
curl -L -o food_photo.jpg       "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=75" &

# Scene 22: Ocean Waves Long Exposure
curl -L -o ocean_waves.jpg      "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200&q=75" &

# Scene 23: Autumn Forest Path
curl -L -o autumn_forest.jpg    "https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=1200&q=75" &

# Scene 24: Lightning Storm
curl -L -o lightning.jpg        "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1200&q=75" &

# Scene 25: Inside a Cathedral
curl -L -o cathedral.jpg        "https://images.unsplash.com/photo-1548625149-720754952438?w=1200&q=75" &

# Scene 26: Motorcycles Racing
curl -L -o motorcycle_race.jpg  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=75" &

# Scene 27: Old Rusty Car — detail/texture
curl -L -o old_car.jpg          "https://images.unsplash.com/photo-1543796076-c7bb4dc4534d?w=1200&q=75" &

# Scene 28: Underwater Coral Reef
curl -L -o coral_reef.jpg       "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=75" &

# Scene 29: Dancing performer on stage
curl -L -o stage_performance.jpg "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=1200&q=75" &

# Scene 30: Frost and Ice Crystals (macro)
curl -L -o frost_macro.jpg      "https://images.unsplash.com/photo-1511884042945-f8a1eed3ef3a?w=1200&q=75" &

# Scene 31: Industrial Smokestacks at Dusk
curl -L -o industrial_dusk.jpg  "https://images.unsplash.com/photo-1533536347418-0f55af1adb60?w=1200&q=75" &

# Scene 32: Bicycle on cobblestone street
curl -L -o bicycle_street.jpg   "https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?w=1200&q=75" &

# Scene 33: Bonsai tree macro
curl -L -o bonsai.jpg           "https://images.unsplash.com/photo-1599598425947-5202edd56fdb?w=1200&q=75" &

# Scene 34: Surfer on a big wave
curl -L -o surfer.jpg           "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1200&q=75" &

# Scene 35: Hot Air Balloons
curl -L -o hot_air_balloons.jpg "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1200&q=75" &

# Scene 36: Jazz musician (low light concert)
curl -L -o jazz_concert.jpg     "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&q=75" &

# Scene 37: Lavender Fields
curl -L -o lavender_fields.jpg  "https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1200&q=75" &

# Scene 38: Snow Leopard portrait (wildlife telephoto)
curl -L -o snow_leopard.jpg     "https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=1200&q=75" &

# Scene 39: Neon signs Tokyo / Shibuya style
curl -L -o neon_city.jpg        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=75" &

# Scene 40: Glassware / product still life
curl -L -o product_glass.jpg    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=75" &

# Scene 41: Children playing in rain
curl -L -o children_rain.jpg    "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1200&q=75" &

# Scene 42: Smoky campfire at night
curl -L -o campfire.jpg         "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=75" &

wait
echo ""
echo "All downloads complete. Checking sizes..."
du -sh /home/mike/photoCoach/images/
echo "Individual files:"
ls -lh /home/mike/photoCoach/images/ | awk '{print $5, $9}'
