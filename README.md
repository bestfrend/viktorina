# Žodžių praktika

Mobilus Angular standalone ir PrimeNG programos pagrindas. Mokinys gali įrašyti vardą arba pasirinkti anksčiau įrašytą vardą. Tas pats vardas, nepaisant didžiųjų ir mažųjų raidžių, parenka esamą mokinį. Kiekvienam mokiniui sukuriamas stabilus ID.

Vardai ir pasirinkimas saugomi versijuotoje naršyklės vietinėje saugykloje, tik šiame įrenginyje ir naršyklėje. Išvalius naršyklės duomenis jie prarandami. Jei saugyklos perskaityti ar į ją įrašyti nepavyksta, programa parodo klaidą. Duomenys nesiunčiami į serverį. Žodžių sąrašai ir viktorina bus įgyvendinti vėliau.

## Paleidimas ir patikra

Atskirai po kodo peržiūros įdiekite priklausomybes su `npm install`, paleiskite kūrimo serverį su `npm start` arba sukurkite produkcinę versiją su `npm run build`. Produkcinė išvestis yra `dist/zodziu-praktika/browser`. Naudokite Angular 19 palaikomą Node.js versiją.

PWA service worker registruojamas tik produkcinėje versijoje. Veikimui be ryšio patikrinti produkcinę išvestį reikia pateikti per HTTPS arba localhost, pirmą kartą atverti prisijungus prie tinklo ir palaukti service worker aktyvavimo, tuomet atjungti tinklą ir perkrauti puslapį. Manifestas naudoja tekstinę SVG piktogramą; įdiegimo palaikymas skirtingose naršyklėse gali skirtis. Konfigūracija numato programos pateikimą svetainės šaknyje.
