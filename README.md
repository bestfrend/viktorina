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

### PWA įdiegimas

Produkcinį paketą `dist/zodziu-praktika/browser` reikia pateikti per HTTPS (kompiuteryje bandymui tinka ir `localhost`). `npm.cmd run dev` skirtas kūrimui; veikimas be interneto įjungiamas produkciniame pakete.

- Kompiuteryje „Chrome“ arba „Edge“ atverkite programėlę ir pasirinkite naršyklės veiksmą „Įdiegti programą“.
- „Android“ naršyklės meniu pasirinkite „Įdiegti programą“ arba „Pridėti prie pagrindinio ekrano“.
- „iPhone“ naršyklėje „Safari“ pasirinkite „Bendrinti“ → „Pridėti prie pradžios ekrano“.

Po pirmo sėkmingo įkėlimo ir service worker aktyvavimo programėlės failai pasiekiami be interneto. Mokymosi duomenys saugomi tame įrenginyje.

### Publikavimas per GitHub Pages

Projektą įkelkite į atskirą GitHub saugyklą. Nemokamam GitHub Free planui su Pages ji turi būti vieša. Saugyklos **Settings → Pages → Build and deployment → Source** pasirinkite **GitHub Actions**.

Įkėlus pakeitimus į `main` šaką, `.github/workflows/pages.yml` paleidžia testus, sukuria produkcinį PWA paketą ir jį publikuoja. Publikavimą galima paleisti ir rankiniu būdu per **Actions → Deploy PWA to GitHub Pages → Run workflow**. Darbo eigos rezultatuose rodoma programėlės HTTPS nuoroda.

Darbo eiga nustato `base-href` pagal tikrąjį Pages adresą, todėl programėlės failai ir service worker veikia ir adresu `https://vartotojas.github.io/saugykla/`.

Kompiuteryje ir telefone duomenys yra atskiri. Pakeitus svetainės domeną ar adresą, ankstesni vietiniai duomenys automatiškai neperkeliami.

### Mokymasis

Pasirinkite mokinį, sukurkite sąrašą, įrašykite jo kalbas bei žodžių poras. Redagavimo ekrane kalbų nustatymai suskleisti; juos galima išskleisti ir išsaugoti. Vienoje formoje galima pridėti vieną porą arba suvesti kelių porų abiejų kalbų žodžius ta pačia tvarka, atskiriant kableliais. Pridėtos poros iškart matomos apačioje; kartojimo indeksas nuo 1 rodomas skaičiumi prie šalinimo mygtuko, o užvedus paaiškinamas užuomina. Pasirinkus sąrašą rodomas viktorinos pradžios ekranas, kuriame galima pasirinkti 1, 3 arba 5 minutes ir krumpliaračiu viršuje atverti žodžių redagavimą. Laikas skaičiuojamas tik nuo „Pradėti“ paspaudimo. Įrašius atsakymą Enter jį patvirtina; tuščiame lauke Enter praleidžia žodį ir įskaičiuoja jį kaip neatsakytą. Telefone galima naudoti matomą „Praleisti“ mygtuką. Išėjus prieš pasirinkto laiko pabaigą, raundo rezultatai ir žodžių sekos atmetami. Pasibaigus laikui jie išsaugomi vienu vietinės saugyklos įrašu kartu su pasirinkta trukme. Seni rezultatai be kiekvieno atsakymo duomenų pašalinami.

Viktorinos metu viename slenkamame laukelyje rodomi neteisingi ir praleisti atsakymai: `įrašyta → teisinga` arba `→ teisinga`. Naujausias įvykis yra viršuje. Tas pats sąrašas lieka po „Puikus darbas!“ suvestine, iki pradedant kitą bandymą; į saugomų rezultatų istoriją jis neįrašomas.

Duomenys saugomi tik naršyklės `localStorage`, atskirai pagal mokinio ID. Išvalius naršyklės duomenis jie prarandami. Sinchronizavimo, paskyrų ir atsarginių kopijų šioje versijoje nėra. Saugyklos klaida rodoma vartotojui.

Kartojimo svoriai sekoms 0, 1, 2, 3, 4 ir 5+ yra 12, 8, 5, 3, 2 ir 1. Ką tik parodytas žodis gauna 0,35 daugiklį. Atsakymai lyginami neatsižvelgiant į didžiąsias raides ir diakritiką. Šios taisyklės yra bandomosios ir aprašytos `.app-architect/requirements.md`.

## Patikra

Rezultatų istorijoje pagrindinis procentas skaičiuojamas pagal teisingo vertimo ilgį: trumpesniam nei 10 simbolių skiriamas svoris 1, 10–20 simbolių – 1,5, ilgesniam nei 20 – 2. „Rezultatai tik sau“ dar įvertina indeksą prieš atsakymą: `1 / min(indeksas, 6)` ir ilgio priedas 0, 0,5 arba 1. Procentas yra teisingų atsakymų svorių suma, padalinta iš visų atsakymų svorių sumos. Seni rezultatai be šiam skaičiavimui būtinų duomenų pašalinami pirmą kartą įkėlus naują versiją; sąrašai ir poros išlieka.

`npm test` tikrina laikmatį, atsakymų vertinimą, sekas, svertinį parinkimą ir rezultato įrašymo klaidą. `npm run build` sugeneruoja PWA ir `ngsw.json`. Offline elgseną galima rankiniu būdu patikrinti: atverkite produkcinę versiją per localhost, palaukite service worker įdiegimo, DevTools įjunkite Offline, perkraukite puslapį ir patikrinkite išsaugotą mokinį bei sąrašus.
