# Worker report: compass prior art from hackathons, open source and makers

Date: 2026-11-21. Scope: prior art for a KCL First Year Hackathon Track 2 ("Retro Remix") team whose project centres on reinventing the compass. Read-only research. Nothing was logged in to, starred or commented on.

Status key:
- **page read**: I opened the project page or repo README, or a full article about it.
- **article read**: I read a third-party write-up (Hackaday or Makezine), not the builder's own page.
- **lead only**: I saw it in search results but did not open it.

"Winner" means a Devpost winner ribbon or prize line on the project page itself, unless noted otherwise.

## A. Hackathon projects (Devpost)

### 1. Treasure Tracker: hackathon winner
- URL: https://devpost.com/software/pirate-compass · code: https://github.com/TrevorGuo/Compass
- Platform/date: Devpost, Jan 2022. **IDEA Hacks 2022 (UCLA), winner: "Bose Headphones" prize.** A UCLA Samueli news story also names it a winner.
- Reinvents: Jack Sparrow's compass. It stores up to 4 GPS waypoints using 4 side buttons, and the needle points to the one you select instead of north.
- Stack: Teensy/Arduino Nano, GPS, LSM9DS1 magnetometer, limited-range servo with 3D-printed 2:1 gears, painted cardboard case.
- Worked/limits: Magnetometer calibration was the hardest part; they used someone else's AHRS calibration code. With no continuous servo, the needle could not travel a full 360°, so software "snaps back" the other way. Planned 3D-printed parts never arrived.
- Status: page read (Devpost and README).
- Lesson: The plain "points to saved places" pirate compass already won in 2022. Doing only that would be a duplicate. The physical needle and the theatrical case are what judges remember.

### 2. Kompas
- URL: https://devpost.com/software/kompas · code: https://github.com/bskdany/kompas (MIT)
- Platform/date: Devpost, Hack the North 2025 (Sep 2025). No prize shown.
- Reinvents: A handheld compass that "points to ANY location on Earth", such as a shawarma shop, the LCBO, friends or internship offices. A 16-LED ring replaces the needle. The case is 3D-printed with a Minecraft look.
- Stack: Raspberry Pi Pico 2W, LIS3MDL magnetometer, DFRobot GNSS, LiPo, WS2813 LED ring. Firmware is Arduino C and caches the last fix in flash for when GNSS signal is lost.
- Worked/limits: GPS accurate to about 2 m outdoors. Problems: the E7 building blocked GPS, the magnetometer had to be recalibrated whenever hardware changed, electromagnetic interference, and 3 failed prints. They planned 4 units but finished only 2.5. Their own "What's next" is "Talk to Kompas… search where you need to go based on context" and "Kompases point to each other". That is the AI and social version, which they did not build.
- Status: page read.
- Lesson: The team itself named an AI-chosen destination and devices pointing at each other as the next step. Treat the hardware basics as solved prior art. Indoor GPS will fail at a KCL venue.

### 3. Friend Compass
- URL: https://devpost.com/software/friend-compass · code: https://github.com/supershoop/FriendCompass
- Platform/date: Devpost, Hack the North 2025. No prize. First hackathon for the team.
- Reinvents: A phone compass that shows the friends you met at the event as markers. Tap one to lock on and see its distance. Location travels over SMS (Twilio) because one creator had no data plan. You sign in by scanning your HTN badge.
- Stack: Android Studio app (the page says "Kitlio", probably Kotlin), Twilio SMS with a Node backend, DynamoDB.
- Worked/limits: The tools were new to the team. They could only test at the very end because one member had an iPhone. They dropped the project after the event.
- Status: page read.
- Lesson: "Friend compass at the hackathon" has been done. The SMS-only twist is a nice "low-tech transport" idea.

### 4. X Marks the Spot: XHacks 2026, a retro-themed hackathon (closest analogue to Track 2)
- URL: https://devpost.com/software/x-marks-the-spot-agbuiy · code: https://github.com/iancdev/xhacks
- Platform/date: Devpost, Feb 2026. **SystemsHacks 2026: XHacks (SFU).** The theme was "bridge the past, present, and future… modernizing legacy technology… retro-futuristic systems", close to KCL Track 2. **Not a winner:** the gallery's 10 winner ribbons do not include it. Devpost's search API flags it `winner:true`, but I could not confirm any prize.
- Reinvents: The compass ("obsolete technology") plus a treasure map. A phone web app finds nearby points of interest with Google Maps and Gemini. Starting an "adventure" locks the physical needle on a hidden destination, and you only learn the place by walking there. You can set the radius and the number of stops.
- Stack: ESP32, IMU, servo, 3D print, WebSockets, React PWA, Google Maps API, Gemini.
- Worked/limits: Moving the Figma design into HTML went badly. They shorted an ESP32. Ideas they did not build: a mode where friends choose your treasure spot, currency/gamification, and a social feed.
- Status: page read (project page and hackathon gallery).
- Lesson: **This is the most direct precedent.** It was a mystery-destination AI compass at a retro-themed hackathon, and it did not win. Our pitch needs a stronger twist than "LLM picks a place and the needle points there."

### 5. Hatohpuhtato
- URL: https://devpost.com/software/hatohpuhtato · code: https://github.com/NeatPatel/bithacks-2025
- Platform/date: Devpost, BitHacks 2025 (Apr 2025). No prize shown.
- Reinvents: A Minecraft compass made physical. A GPS forward-azimuth calculation drives a needle to a set destination: a lost hiker's way back, a parked car or a set point.
- Stack: ESP32, NEO-6M GPS, gyroscope, LCD, Arduino C++.
- Limits: Very short writeup. It uses a gyro and no magnetometer.
- Status: page read.
- Lesson: The "Minecraft compass IRL" angle is crowded (see also items 6, 25 and 34).

### 6. Compass, the nearest-bar compass
- URL: https://devpost.com/software/compass-lga6p4 · code: https://github.com/BananaMiku/Compass
- Platform/date: Devpost, Hack(H)er413 2026 (Feb 2026). No prize shown.
- Reinvents: A motorised needle that points to the nearest bar.
- Stack: ESP32, BNO055 IMU with on-chip sensor fusion, Adafruit Ultimate GPS, motor, MicroPython, Google Maps.
- Limits: The ESP32 had too little RAM to complete Google's TLS handshake, so it could not make live web requests. GPS module limits.
- Status: page read.
- Lesson: Use a phone or laptop as the brain. Do not put live web calls on the microcontroller.

### 7. CampMap / Campus Compass
- URL: https://devpost.com/software/team-afk · code and live demo: https://github.com/Choc-Shake/hackedbeta-2026 (https://choc-shake.github.io/hackedbeta-2026/?demo)
- Platform/date: Devpost, HackED Beta 2026 (Nov 2026). No prize shown.
- Reinvents: A phone web app styled after the Dragon Ball radar. Turn a dial to pick a building, lock on, and the grid rotates so the light shows the real direction of the nearest entrance. A triple-tap finds the nearest washroom.
- Stack: Plain HTML, CSS and JS on GitHub Pages using the DeviceOrientation and Geolocation APIs. The data is a one-time OpenStreetMap export of 88 buildings and 315 entrances.
- Worked/limits: **The original idea, pointing to the nearest washroom indoors, failed.** GPS does not work indoors, and concrete walls bent the phone compass by **more than 100°**. Their indoor magnetic-fingerprint experiment (Pi + Sense HAT) gave walks that did not match each other. They pivoted to outdoors only. The `?demo` mode lets it work without a phone.
- Status: page read (Devpost and README).
- Lesson: **This is the key risk for a KCL indoor demo.** Phone compasses are unreliable inside buildings. Build a demo mode or a simulated heading from day one.

### 8. Love Compass: Points to the One You Love
- URL: https://devpost.com/software/love-compass-points-to-the-one-you-love
- Platform/date: Devpost, RevenueCat Shipaton 2026 (Sep 2026). No prize shown. A shipped consumer app.
- Reinvents: "The mythical compass that doesn't point North… points to the one you love." Two paired phones show each other's great-circle bearing. When both open the app at once, the dial glows ("mutual open glow"). There are no accounts, and pairing uses one-time tokens.
- Stack: Flutter/Dart, Node/TypeScript/Express on Cloud Run, PostgreSQL, RevenueCat, AdMob, Codemagic.
- Limits: Little evidence about how it performs. The creator says it was built with Claude and Gemini agents.
- Status: page read.
- Lesson: The romantic partner compass is already on app stores. The "glows when you are both looking" signal is a good small-interaction idea.

### 9. Near You: hackathon winner
- URL: https://devpost.com/software/closeness · code: https://github.com/Neilblaze/near-you
- Platform/date: Devpost, Feb 2021. **Hackthrob, winner: Best Hardware Hack (Digi-Key).**
- Reinvents: A "personal internet-less compass" for finding your date in a crowd. ESP8266 NodeMCUs run as access points in a mesh and use Wi-Fi signal strength instead of GPS. It adds a buzzer, LEDs and a temperature sensor.
- Limits: Breadboard only. Signal-strength direction finding is coarse. Built in a virtual hackathon.
- Status: page read.
- Lesson: Using radio signal strength to find someone without GPS can win hardware prizes, but it is crude.

### 10. DownToFrnd: hackathon winner
- URL: https://devpost.com/software/down-to-friend · video: https://youtu.be/hAMClGtcZ7U
- Platform/date: Devpost, Feb 2020. Entered at SteelHacks 2020 and **TartanHacks 2020, winner: Best Alexa Hack (Project Olympus).**
- Reinvents: A compass that points to a compatible person. You answer a questionnaire, and a neckband with 4 vibration motors buzzes toward a matched person nearby, then everywhere at once within 2 ft.
- Stack: Arduino, vibration motors, laser-cut and heat-bent acrylic band. An earlier Circuit Playground infrared link did not supply enough current.
- Status: page read.
- Lesson: The "points to who you are looking for, not where" idea is old (2020) and has won before. Wearable haptics make it striking.

### 11. Seek
- URL: https://devpost.com/software/seek-jq9v70 · code: https://github.com/greshr/seek
- Platform/date: Devpost, Hack The South 2020 (UK). No prize shown.
- Reinvents: Digital hide and seek. Hider devices (ESP8266 + GPS) send their position, the seeker's web app shows a compass bearing to them, and the seeker scans NFC on a hider to score.
- Limits: The GPS needed a cone cut from a Coke can to get a fix. They never finished the PHP link between devices. **A web page could not read the phone's magnetometer** without a native app, so heading did not work.
- Status: page read.
- Lesson: This is a UK precedent for a multiplayer compass game. Today `DeviceOrientationEvent` with iOS permission solves the web-heading problem, but test it early.

### 12. Direct Message
- URL: https://devpost.com/software/direct-message
- Platform/date: Devpost, COVID-19 Global Hackathon 1.0 (Mar 2020). Started as an AUT Creative Technologies project in 2019.
- Reinvents: A messenger where you must physically turn and face the person you are messaging. Chat closes when you look away.
- Stack: HTML5, Node, socket.io, Heroku.
- Status: page read.
- Lesson: This uses the compass as a social gesture rather than a navigation aid. A strong art concept, worth borrowing as a mechanic ("face them to talk").

### 13. wandAR ("compass")
- URL: https://devpost.com/software/wandar · code: https://github.com/ShehryarX/compass
- Platform/date: Devpost, Hack the North 2019. The page's media captions include "3rd Place Facebook API Prize" (no ribbon parsed).
- Reinvents: An AR "compass" that shows events and friend-recommended places around you, ranked with k-nearest neighbours over the Facebook friend graph.
- Stack: ARKit, Facebook Graph, Firebase, Node.
- Limits: The team notes slow updates and imprecise GPS and compass data.
- Status: page read.
- Lesson: The "your friends are your compass" recommendation idea is 2019-era. The Facebook API it relied on is gone.

### 14. Agora: "Your mood is the compass"
- URL: https://devpost.com/software/agora-sm71rq · code: https://github.com/remziog/agoraevent
- Platform/date: Devpost, Qloo Agentic Hackathon (Oct 2026). No prize shown.
- Reinvents: An agentic city guide for Istanbul. You speak or type what you love, a Gemini agent queries Qloo's taste graph, and the top 3 venues appear on a compass dial with true bearings. It explains each choice under "How Agora decided".
- Stack: React/TanStack, Vercel AI SDK, Gemini, Qloo, Supabase, Cloudflare Workers, Web Speech API, WebGL.
- Status: page read.
- Lesson: **This is the closest example of an LLM agent with a compass interface.** It uses the compass as a results display, not as an instrument you hold. Showing the agent's reasoning ("How Agora decided") is a good pattern.

### 15. Lumina
- URL: https://devpost.com/software/visionpro-vqmho7 · code: https://github.com/ojaskandy/lumina
- Platform/date: Devpost, UC Berkeley AI Hackathon 2025 (Jun 2025). No prize shown.
- Reinvents: A smart compass for blind users. You say "Take me to a chair", a camera with MobileNet finds it, Gemini 2.5 Flash describes the scene, and a servo needle you can feel points the way.
- Stack: Raspberry Pi 5, camera, microphone, TFLite MobileNet, Gemini on a Vercel backend, LMNT TTS.
- Worked/limits: User research found blind users want to keep their hearing free, which justified a touch-based compass.
- Status: page read.
- Lesson: This shows the LLM-plus-camera compass for accessibility. Accessibility is a well-covered category.

### 16. Argus Touch
- URL: https://devpost.com/software/argus-touch
- Platform/date: Devpost, Cal Hacks 12.0 (Oct 2025). No prize shown.
- Reinvents: "A tactile compass for nearby people". A waistband of 16 servos (4×4) encodes direction as column, object class as row, and distance as pressure. Uses YOLO-11 on an Orbbec depth camera.
- Limits: The PCA9685 kept drawing holding current after stop. Inference ran on a laptop to reach about 30 FPS.
- Status: page read.

### 17. OmniBelt: hackathon winner
- URL: https://devpost.com/software/omnibelt · code: https://github.com/Whyhellotheir/Omnibelt
- Platform/date: Devpost, Oct 2026. **Knight Hacks IX, winner: Best First-Time Hacker.**
- Reinvents: A belt with 7 motors that "steers you like a compass you can feel" toward an object ("Belt, find my keys"), plus a ring for the last half metre and a memory of where things were left. Design rule: **"the AI decides where; the reflexes decide how."** The cloud model never drives a motor directly.
- Stack: ESP32, Jetson Orin Nano, YOLO-World, CLIP, Depth Anything, Gemini, ElevenLabs, ARKit, Swift.
- Status: page read.
- Lesson: This is a useful architecture rule for any AI compass: keep the LLM for choosing goals and let deterministic code do the pointing.

### 18. Wayback Trail
- URL: https://devpost.com/software/wayback-trail · code: https://github.com/anjalist08/vexohacks
- Platform/date: Devpost, VexoHacks (AI wearables), Nov 2026. No prize shown.
- Reinvents: A breadcrumb compass for indoors. ARKit and step counting record your path, and you save places by voice ("this is the kitchen"). It guides you back with a steady buzz while you face the right way and silence when you do not.
- Status: page read.
- Lesson: The "pulse when you face the right way" idea is a neat one-motor haptic compass and a cheap demo.

### 19. Haps Vision
- URL: https://devpost.com/software/haps-vision · code: https://github.com/GeorgiaGriffin/hapsvision
- Platform/date: Devpost, StarkHacks (Apr 2026). No prize shown.
- Reinvents: A wristband that gives left, right and forward turn cues.
- Stack: ESP32 with an on-device ESP-DL gesture model, an MPU-6050 with no magnetometer (so heading comes from integrating the gyro), servos, and Web Bluetooth.
- Limits: **Web Bluetooth on iOS needs the Bluefy browser.** They also had to handle permission prompts for both Bluetooth and DeviceOrientation.
- Status: page read.
- Lesson: If we pair a browser with hardware, iOS is the problem. Demo on Android or Chrome on desktop.

### 20. Light My Way: hackathon winner
- URL: https://devpost.com/software/light-my-way-pot3he · code: https://github.com/airconbear/lightmyway
- Platform/date: Devpost, Feb 2023. **MakeMIT 2023, winner: 1517 Medici Grants.**
- Reinvents: A shoe whose LED segments light the direction to walk, aimed at people with dementia.
- Limits: The prototype was driven from a keyboard because they had no GPS. They used an accelerometer and gyro where they needed an e-compass.
- Status: page read.
- Lesson: Winners can be thin prototypes when the story is strong. Pick the magnetometer early.

### 21. Spidey Sense: hackathon winner
- URL: https://devpost.com/software/spidey-sense-bzmg36
- Platform/date: Devpost, Oct 2026. **IEEE Technothon 2026, winner: 1st place and gift cards.**
- Reinvents: A firefighter helmet that points haptically toward people detected by two mmWave radars. Double-tap the helmet to lock an anchor direction and it works as a compass.
- Limits: Cheap radars give a narrow field of view and slow updates. The compass mode was not tuned.
- Status: page read.

### 22. CauseCompass (compass as metaphor only)
- URL: https://devpost.com/software/causecompass · code: https://github.com/BrandTrieu/cause-compass
- Platform/date: Devpost, Hack the Valley X (Oct 2025). No prize shown.
- What: A "moral compass" for shopping. Gemini summarises company ethics with sources.
- Stack: Next.js, Prisma, Supabase, Gemini, Vercel.
- Status: page read.
- Lesson: "X Compass" named apps are everywhere on Devpost. Search returned 1,808 results and dozens of "Career/Course/Campus/Financial Compass" chatbots. **Using the word compass only as a metaphor would not count as reinventing old tech for Track 2.**

## B. Maker and open-source projects

### 23. Programmable Jack Sparrow Compass / Naviguesser (heavior / LightDutyMagic)
- URL: https://heavior.github.io/jack-sparrow-compass
- Platform/date: Personal site. The idea dates from Burning Man 2022, units have gone to the burn since 2023, and the Naviguesser was announced Mar 2024 for Burning Man 2025.
- Reinvents: A wood-and-brass pirate compass that points to the next destination on a route. It picks the closest unvisited point and respects opening hours. It does a "happy dance" when you arrive and stops when you close the lid. In the Naviguesser, camps submit events that burners upvote on Burn Planner (called "Collective Wisdom"), plus "Special Encounters" for players.
- Stack: Microcontroller, magnetometer, GPS, servo, angular encoder, UV LED to charge a glow-in-the-dark dial, Bluetooth calibration triggered by 3 taps on the lid. A fleet-management web app runs the units. **Generative AI converted Google Maps data into the compass format.**
- Limits: 3–4 days and 70+ parts per unit. Veneer delaminates. Small motors were unreliable. One unit was lost in 2024. Tariffs make scaling hard.
- Status: page read.
- Lesson: This is the best-crafted "compass with a crowd-picked destination" and a reference for how a magical prop should behave (lid, dance, glow). A crowd voting on where the compass points is already built.

### 24. Pizza Compass (Joe Grand / Grand Idea Studio, for Wired)
- URL: https://www.grandideastudio.com/pizza-compass/ · code: https://github.com/joegrand/pizza-compass (CC BY-NC 4.0) · Hackaday: https://hackaday.com/2021/04/28/open-source-pizza-compass-will-show-you-the-way
- Platform/date: Apr 2021, with a Wired video "Engineer Builds a Compass That Finds Pizza".
- Reinvents: Press a button and 8 NeoPixels point to the nearest pizza place from the Google Places API, accessed through Particle cloud webhooks.
- Stack: Particle Boron (LTE), PA6H GPS, LSM303DLHC, NeoPixels, TinyGPS++.
- Limits/comments: It ignores streets and buildings. Readers asked about magnetic declination, why the Particle cloud sits in the middle, and suggested a pub compass.
- Status: page read (project page and Hackaday article).
- Lesson: The canonical "compass to the nearest X". Any "nearest X" pitch is a re-skin of this.

### 25. RadioScout (hardlyhumanfx)
- URL: https://hackaday.com/2025/02/01/antique-style-gps-looks-like-steampunky-fun
- Platform/date: Hackaday article, Feb 2025. The build is documented on TikTok and the device is sold.
- Reinvents: An antique-style GPS in brass and wood. You **dial the latitude and longitude on a rotary phone dial**, 7-segment displays show them, a stepper-driven needle points straight at the target, and a bell rings.
- Limits: Few build details. The creator called the first version a "rough prototype". A viral bagel-shop video drove sales.
- Status: article read; source not opened (TikTok).
- Lesson: Retro input methods (rotary dial) are a strong "surprising but faithful" move, and the theatre went viral. This is good evidence for the retro look.

### 26. Compass belt (blinry)
- URL: https://blinry.org/compass-belt/ · Hackaday: https://hackaday.com/2023/09/05/hands-free-compass-uses-haptic-feedback
- Platform/date: Blog, Aug 2023. Open hardware and firmware in four repos (Fritzing hardware, CadQuery clip, MicroPython firmware, Android app). The post is CC BY-SA.
- Reinvents: A haptic belt with 8 coin motors. A phone app sends the target angle over USB serial.
- Stack: Raspberry Pi Pico, ULN2803A driver, 3D-printed clips on a belt with eyelets.
- Limits: You must hold the phone upright and stay cabled to it. Tested on one short walk. Hackaday commenters found it bulky.
- Status: page read.

### 27. North Paw (Sensebridge / Noisebridge)
- URL: https://makezine.com/?p=231774 (Make, Jan 2012) · other: https://www.cyborganthropology.com/North_Paw
- Platform/date: A kit from about 2009–2012 for roughly $149–160, with designs and code published. It descends from Osnabrück University's feelSpace belt research.
- Reinvents: An anklet with 8 motors where the one facing north always buzzes. Over time wearers report sensing north rather than feeling a buzz. Successor: NorthSense by CyborgNest.
- Status: article read (Make). The original Sensebridge page was not opened.
- Lesson: The "compass as a new sense" idea is about 15 years old and well known. A haptic north-finder alone is not new.

### 28. Ariadne Headband (Vojtech Pavlovsky)
- URL: https://hackaday.io/project/160367-ariadne-headband · Hackaday: https://hackaday.com/2018/09/28/give-yourself-a-sixth-sense-with-an-arduino
- Platform/date: **2018 Hackaday Prize entry.**
- Reinvents: A headband with 4 motors and a digital compass, linked over Bluetooth to an Android app with modes (keep north, follow the city grid).
- Status: article read; the hackaday.io page was not opened.

### 29. Minecraft GPS Compass (Adafruit Learn)
- URL: https://learn.adafruit.com/minecraft-gps-compass
- Platform/date: Adafruit Learn guide, 2025–26 (Feather RP2350).
- Reinvents: The Minecraft compass on a 3.5" TFT, pointing to saved and renameable waypoints, with magnetic declination, marine mode and on-device calibration.
- Stack: CircuitPython, PA1010D GPS, LSM6DSOX + LIS3MDL 9-DoF.
- Status: page read.
- Lesson: There is a polished open-source version of "Minecraft compass IRL". Copy its calibration and declination handling.

### 30. Jack Sparrow Compass, McDonald's edition (DaanHooglander)
- URL: https://github.com/DaanHooglander/Jack-Sparrow-Compass · 3D files: https://www.printables.com/model/688733-jack-sparrow-compass
- Platform/date: GitHub, Dec 2023, a mechanical engineering bachelor's elective.
- Reinvents: Points to "what you want most", here the nearest McDonald's in Dutch cities and Vienna.
- Stack: ATmega2560, Neo-8M, QMC5883L, 28BYJ-48 stepper, and a Hall sensor to home the needle.
- Status: page read (README).
- Lesson: A Hall sensor homing a stepper is the robust way to get a 360° needle, better than the servo hacks above.

### 31. Find Each Other Compass (ClaudeMarais)
- URL: https://github.com/ClaudeMarais/FindEachOtherCompass_ESP32-C3
- Platform/date: GitHub, 2022–2025, 10 stars.
- Reinvents: A compass that points north and to a teammate, for airsoft. It fits in a MOLLE pouch.
- Stack: XIAO ESP32-C3, BN-880 GPS with HMC5883 magnetometer, MPU6050, OLED, buzzer.
- Status: page read (README).

### 32. LodeStone (Hack Club Stardance #2842, ThePangel)
- URL: https://stardance.hackclub.com/projects/2842
- Platform/date: Hack Club Stardance, 2026, in development.
- Reinvents: A handheld LoRa mesh compass for finding friends at festivals. Pairing uses a Morse-style tap PIN, with gesture menus, quick messages and an SOS mode that flashes red.
- Stack: XIAO ESP32-S3, SX1262 LoRa, L76K GNSS, GY-9250, GC9A01 round display, custom 4-layer PCB.
- Status: page read (no repo linked; a reviewer asked for a journal).
- Lesson: A peer-to-peer friend compass needing no phone or internet is being built by teenagers right now.

### 33. Personal Compass, the wedding gift (Videoschmideo)
- URL: https://hackaday.com/2016/11/05/personal-compass-points-to-your-spawn-point · Instructables: http://www.instructables.com/id/Personal-Compass/
- Platform/date: Instructables and Hackaday, Nov 2016.
- Reinvents: A steampunk wooden box that always points to the park where the couple got engaged, their "spawn point".
- Stack: Arduino, GPS, e-compass, servo with brass gears.
- Limits/comments: Slow boot, fragile lid gears, jittery servo. Readers suggested an automotive gauge stepper, and one imagined a clock whose hands point to different places.
- Status: article read; Instructables returned only its title to WebFetch.
- Lesson: The sentimental single-destination compass is a 2016 idea.

### 34. Satellite tracker: ISS/HST pointer (BetaHuhn)
- URL: https://github.com/BetaHuhn/satellite-tracker (MIT)
- Platform/date: GitHub, 2019–2020.
- Reinvents: A pointer that aims at the ISS or Hubble in the sky. A stepper sets azimuth, a servo sets elevation, and positions come from the n2yo API.
- Limits: North must be calibrated by hand through its web page using a phone compass.
- Status: page read (README).
- Note: Many other ISS pointers exist (Instructables, Make 2015, Practical Engineering 2016). It is a crowded niche.

### 35. Hunting Game: IRL Manhunt (commercial app, for reference)
- URL: https://apps.apple.com/us/app/id6471968553
- Platform/date: iOS app since 2023, v6.1.2 (Nov 2026), rated 4.8 from 274 ratings.
- Reinvents: Multiplayer manhunt. Chasers see a live map. **Runners get only a compass pointing at the nearest chaser.** Since v6.0.3 there are 5 visibility levels.
- Limits: The free tier caps at 4 players. One reviewer reported a stranger following their group and police being called.
- Status: page read (App Store).
- Lesson: An "information-limited compass" game already exists commercially. Safety and privacy are the hard questions with social location features.

## C. Leads only (not opened)
- Minecraft lodestone compass by chaosgoo (Hackster news and Yanko Design, Sep 2025). Hackster returned 403 to both WebFetch and curl.
- Glitter Positioning System (Adafruit, LoRa + GPS + NeoPixel ring that points boxes at each other).
- Open Ocean Buddy Locator (Hackster bbtinkerer, 2019).
- Cornell ECE5725 "Where's LoRa?" (2023).
- Devpost: Shepherd smart cane (winner), NavSense haptic gloves (winner), Budddi festival friend compass, Echo (gesture to send appreciation to someone nearby), Landlubber Compass, Virtrue (a wearable showing the gap between your values and actions, a literal moral compass), Aethos & Aletheia "Moral-Compass Engine", LandMark, Retrace (finger-ring camera that buzzes you back to objects), Lodestone daily magnet puzzle, Canvas Compass (trip planning across many tabs), The Credibility Compass (browser extension).
- Mukesh Sankhla "Pathfinder" GNSS waypoint device (Hackster).
- Online-compass web pages (onlinecompass.github.io) and visitor-globe sites. These only point north or show maps and are not real prior art.

## D. Patterns and lessons for our team
1. **"Points to X instead of north" is solved and over-built.** Saved waypoints, nearest pizza/bar/McDonald's, a partner, a friend, the ISS and Minecraft lodestones have all been built many times since 2016. Three of these won prizes (Treasure Tracker, Near You, DownToFrnd), but in 2020–2022. In 2026 a plain re-skin like X Marks the Spot did not win even at a retro-themed hackathon.
2. **Hardware pitfalls repeat:** magnetometer calibration, 360° needle travel with cheap servos (use a stepper plus a Hall sensor for homing), GPS failing indoors, interference, failed 3D prints, ESP32 TLS and RAM limits. Teams that let a phone or laptop do the thinking ship more.
3. **Indoor demos break phone compasses** (CampMap saw >100° error). The KCL demo will be indoors, so plan a simulated heading or demo mode, or point at things whose bearing does not depend on GPS.
4. **Web platform caveats:** iOS needs a permission tap for DeviceOrientation, and Web Bluetooth needs Bluefy on iOS (Haps Vision, Seek).
5. **Good mechanics worth borrowing:** "glows when you both look" (Love Compass), "face them to talk" (Direct Message), "pulse while you face the right way" (Wayback Trail), "AI decides where, reflexes decide how" (OmniBelt), lid open/close and a happy dance on arrival (heavior), dialling coordinates on a rotary dial (RadioScout), a visible agent explanation (Agora).
6. **Naming:** Devpost has well over a thousand "compass" projects and most are metaphor chatbots. Judges will have seen many "X Compass" AI apps.

## E. Gap areas (nobody seemed to have built these)
- **A compass that points at something non-geographic in the digital world**, with a browser agent deciding the bearing. Examples: a needle that swings toward the open tab or page most relevant to your goal; a "research compass" that browses for you and the physical needle shows where the evidence leans or which direction the trail is heading; a compass whose north is your unread priority. I found tab and research-trail extensions (Rabbit Hole and others) but none with a real compass needle or bearing metaphor.
- **A compass pointing at a moving event or idea rather than a place**: the nearest live trending thing, the direction a conversation is coming from, or where the data says opinion is moving (this could use Snowflake data). Agora shows ranked bearings for places only.
- **A compass that behaves like the original instrument**: lodestone or magnetism, a needle that has to "settle", a dip needle, declination, a mariner's dead-reckoning log. Every project I saw treats the compass as a direction readout. None turned historical navigation practice (dead reckoning, the traverse board, compass rose winds) into the interaction.
- **A compass for groups that needs no app per person and works indoors**: for example, many browser tabs or phones in one room jointly steering a shared needle, or the room voting live. Heavior's Burning Man crowd voting works across a city, not a room, and not in real time.
- **An honest "uncertain" compass**: no project visualises its confidence (calibration, GPS accuracy, the agent's confidence) as needle wobble, even though jitter was the top complaint in comments.
- **A data-backed compass**: no project I saw used a warehouse or analytics backend. A Snowflake-backed "where do people like you go next" bearing or a historical voyage dataset is open ground.

## F. Search coverage
- **Devpost:** WebFetch returned 403 on every page. A curl GET with a browser user-agent worked for project pages, hackathon galleries and the unauthenticated JSON endpoint `devpost.com/software/search?query=…&order_by=popular`. Queries: compass, magnetic compass, compass points, haptic compass, pirate compass, compass friends, wayfinding, retro compass, compass needle, compass LLM, compass agent, compass browser extension, compass gemini, points north, lodestone, sextant, astrolabe, jack sparrow, compass retro, compass nostalgia (3–8 pages each, sorted by popularity), plus "points to", magnetic compass and haptic navigation sorted by recency. "compass" alone returned 1,808 projects, mostly metaphor names.
- **GitHub (`gh search repos`):** jack sparrow compass, friend compass, haptic compass, compass points to, north paw, compass belt haptic, qibla compass arduino, iss compass, compass points home. Mostly tiny repos with no stars. I read 10 READMEs with `gh`.
- **Web search:** Devpost friend, haptic and winner queries; Jack Sparrow builds on Hackaday, Instructables and Hackster; North Paw; hackaday.io LoRa friend finder; moral/AI compass; ISS pointer; LLM wish-compass; multiplayer compass games; browser compass extensions; Reddit friend/partner compass; web/internet compass.
- **Blocked or partial:** Devpost through WebFetch (403; worked around with curl). Hackster.io returned 403 to both WebFetch and curl, so those projects stay leads only. Instructables returned only the title. Reddit threads did not appear in search results at all, so Reddit is not covered. Qibla compass hackathon projects were not found beyond Namaz Takip (Devpost, lead only).
- **Not done:** I did not use yt-dlp or read video captions, did not read Devpost comments (they need login or JS), and did not check judges' notes.
