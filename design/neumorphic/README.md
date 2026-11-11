# Šviesesnis Neumorphic UI — ekranų peržiūra

Dešimt PNG vaizdų rodo tą patį mobilų srautą ir keturias viktorinos būsenas. Visi sugeneruoti built-in `imagegen` redagavimo režimu, naudojant atitinkamą `../*.png` plokščio maketo ekraną kaip turinio nuorodą ir `../variants/neumorphic-v1.png` kaip stiliaus nuorodą. Fonui prašyta vos šviesesnio atspalvio. Pavyzdinė foninė pikselio šviesumo reikšmė pakilo nuo 0,945 iki 0,957.

Visus vaizdus vienoje vietoje atidaro `galerija.html`.

| Failas | Būsena |
| --- | --- |
| `00-mokinys.png` | Mokinio pasirinkimas |
| `00a-sarasai.png` | Mokinio sąrašai |
| `01-zodziu-ivedimas.png` | Sąrašo redagavimas ir porų peržiūra |
| `01b-viktorina-paruosta.png` | Viktorinos pradžia |
| `02-viktorina.png` | Aktyvi viktorina, 42 s |
| `02a-viktorina-10s.png` | Geltonas laikas, 10 s |
| `02b-viktorina-3s.png` | Raudonas laikas, 3 s |
| `02c-teisingas-atsakymas.png` | Žalias pateikto žodžio laukelis |
| `02d-neteisingas-atsakymas.png` | Raudonas pateikto žodžio laukelis |
| `03-rezultatai.png` | Teisingai, neteisingai, neatsakyta |

## Bendras generavimo aprašas

> Use case: ui-mockup. Asset type: one portrait mobile app screen style variant. Image 1 is the exact content and layout edit target; preserve every Lithuanian label, value, button, order and screen size from Image 1. Image 2 is a Neumorphic UI style reference only; do not copy its content. Apply the same light Neumorphic UI as Image 2, with a just slightly lighter pale-gray background, soft paired shadows, raised cards/buttons, inset fields, dark readable text and blue primary action. Exactly one full phone-width interface image, no physical device, no added text, no watermark. Text accuracy is critical.

Kiekvieno varianto užklausoje papildomai įrašyta konkreti būsena: 00:10 geltonas laikmatis, 00:03 raudonas laikmatis, žalias arba raudonas pateikto žodžio laukelis, arba trys rezultatų kortelės.
