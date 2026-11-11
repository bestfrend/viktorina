# Žodžių praktika

Telefonui pritaikyta Angular ir PrimeNG žodžių mokymosi PWA. Viename įrenginyje galima sukurti kelis mokinius, kiekvienam atskirus žodžių sąrašus, redaguoti poras ir žaisti 1, 3 arba 5 minučių viktoriną.

## Paleidimas

Reikia Node.js 20.19+, 22.12+ arba 24+ versijos, suderinamos su Angular 21.

```powershell
npm.cmd install
npm.cmd run dev
```

Atverkite `http://127.0.0.1:4200/`. Kūrimo serveris automatiškai perkrauna puslapį pakeitus kodą. Produkcinis paketas ir tiksliniai testai:

```powershell
npm test
npm run build
```

Produkciniai failai yra `dist/zodziu-praktika/browser`. Pateikite juos per HTTPS arba localhost. Po pirmo sėkmingo įkėlimo Angular service worker saugo programos failus; naršyklėje galima įdiegti PWA ir atverti ją be tinklo. `public/manifest.webmanifest` turi 192 ir 512 px PNG piktogramas; jas galima atkurti paleidus `scripts/generate-icons.ps1`.

## Naudojimas ir duomenys

Pasirinkite mokinį, sukurkite sąrašą, įrašykite jo kalbas bei žodžių poras. Redagavimo ekrane kalbų nustatymai suskleisti; juos galima išskleisti ir išsaugoti. Vienoje formoje galima pridėti vieną porą arba suvesti kelių porų abiejų kalbų žodžius ta pačia tvarka, atskiriant kableliais. Pridėtos poros iškart matomos apačioje; prie kiekvienos yra kartojimo indeksas nuo 1. Pasirinkus sąrašą rodomas viktorinos pradžios ekranas, kuriame galima pasirinkti 1, 3 arba 5 minutes. Laikas skaičiuojamas tik nuo „Pradėti“ paspaudimo. „Atsakyti“ vertina įrašytą vertimą; „Praleisti“ įskaičiuoja neatsakytą žodį. Išėjus prieš pasirinkto laiko pabaigą, raundo rezultatai ir žodžių sekos atmetami. Pasibaigus laikui jie išsaugomi vienu vietinės saugyklos įrašu.

Duomenys saugomi tik naršyklės `localStorage`, atskirai pagal mokinio ID. Išvalius naršyklės duomenis jie prarandami. Sinchronizavimo, paskyrų ir atsarginių kopijų šioje versijoje nėra. Saugyklos klaida rodoma vartotojui.

Kartojimo svoriai sekoms 0, 1, 2, 3, 4 ir 5+ yra 12, 8, 5, 3, 2 ir 1. Ką tik parodytas žodis gauna 0,35 daugiklį. Atsakymai lyginami neatsižvelgiant į didžiąsias raides ir diakritiką. Šios taisyklės yra bandomosios ir aprašytos `.app-architect/requirements.md`.

## Patikra

`npm test` tikrina laikmatį, atsakymų vertinimą, sekas, svertinį parinkimą ir rezultato įrašymo klaidą. `npm run build` sugeneruoja PWA ir `ngsw.json`. Offline elgseną galima rankiniu būdu patikrinti: atverkite produkcinę versiją per localhost, palaukite service worker įdiegimo, DevTools įjunkite Offline, perkraukite puslapį ir patikrinkite išsaugotą mokinį bei sąrašus.
