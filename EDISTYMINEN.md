# Edistyminen

Tämä tiedosto kertoo, mitä on tehty, mikä on kesken ja mitä tehdään seuraavaksi. Claude Code lukee sen jokaisen työrupeaman alussa ja päivittää sen rupeaman lopussa.

**Peli:** https://pasihaverinen90-hash.github.io/Halloween/
**Ilta:** 31.10.2026

## Tilanne

| Vaihe | Tila |
| --- | --- |
| 1. Pohja ja hirsipuu | Valmis, Pasi hyväksyi 20.10. |
| 2. Kuva-arvoitukset | Valmis, Pasi hyväksyi 20.10. |
| 3. Lentopeli | Valmis, Pasi hyväksyi 20.10. ("riittävän hyvä tähän vaiheeseen") |
| 4. Räiskintä | Valmis, Pasi hyväksyi 20.10. ("Paljon parempi"; Paholaiselle +10 % kestävyyttä) |
| 5. Ristikko | Valmis, Pasi hyväksyi 21.10. ("toimii hyvin") |
| 6. Tasohyppely | Valmis, Pasi testasi kaiken 22.10. ja pyysi siirtymään kurpitsalinkoon |
| 7. Kurpitsalinko | Ensimmäinen versio valmis 22.10., Pasi testaa |
| 8. Viimeistely | Ei aloitettu (CSV-vienti ja kuvien vaihtaminen tehtiin jo vaiheessa 1) |

## Pasin kanssa sovitut asiat

- **Salasana** tulosnäkymiin ja korjaustilaan on sovittu. Koodissa on vain sen tiiviste (`src/config.ts`), ei itse salasanaa.
- **Hirsipuu:** jo kokeiltu kirjain ei tee mitään eikä vähennä pisteitä.
- **Testipeliä ei tehdä valikkoon.** Kolmen yrityksen kulku testataan automaattisesti näkymättömällä testipelillä (`src/testGame.ts`), joka ei koskaan näy pelaajille.
- **Tasapisteet:** pelaajat jakavat sijan (esimerkiksi 1., 2., 2., 4.).
- **Hiominen lopuksi (20.10.):** kaikkien pelien kysymykset, kuvat ja yksityiskohdat muokataan vasta, kun kaikki pelit on tehty ja testattu toimiviksi. Pelit tehdään ensin toimiviksi yksi kerrallaan.
- **Lentopeli:** maali on noin 90 sekunnin lennon päässä (säädetään testauksen perusteella). Maa on lattia, jota pitkin noita voi liukua; vain esteet ovat vaarallisia. Taivas on katto.
- **Lentopeli, Pasin palaute 20.10.:** kissoja liian usein, peli liian helppo ja esteet aina katosta asti (vain yksi reitti). Pasin ehdotuksesta mukaan tulivat vastaan lentävät lepakot. Nyt esteitä on neljää tyyppiä (häkki + inkvisiittori, pelkkä inkvisiittoritorni, pelkkä riippuva häkki ja lepakkoparvi), ja usein esteen ohi pääsee sekä yli että ali. Kissoja on kolme koko matkalla (noin 22 sekunnin välein), aina lepakoiden vieressä.
- **Räiskintä (Pasi 20.10.):** Paholainen saapuu 3 minuutin kohdalla (ei 5), jotta ilta ei veny. Vihollispisteet (400) ovat osuus kaikista vihollisista, ja viholliset tulevat kaikille samassa järjestyksessä. Liitonarkku ja pyhä malja lasketaan vihollisiin. Paholaisesta saa 300 pistettä vain kaatamalla sen. Paavi kestää 10 osumaa. Pasi muutti myöhemmin 20.10.: matkan varrella putoaa kolme kultaista ristiä (noin 50, 100 ja 150 s), joista kukin palauttaa yhden.
- **Räiskintä, Pasin palaute 20.10.:** vihollisia aivan liian vähän, kuva saa olla kauempaa (enemmän pelialuetta), paavi saa liikkua myös pystysuunnassa, lisää vaikeampia vihollisia, ja Paholainen oli tylsä. Boosteihin voi myöhemmin lisätä erilaisia lisäaseita (ei vielä).
- **JSON-varmuuskopiot pois käytöstä (Pasi 20.10.):** kiitosnäkymä ei lataa varmuuskopiota, eikä korjaustilassa ole "Lataa varmuuskopio"- ja "Tuo varmuuskopio"-toimintoja. Tulokset tallentuvat edelleen selaimeen, ja CSV-vienti säilyy. Poikkeaa CLAUDE.md:n Tallennus-kohdasta Pasin päätöksellä. Kytkin: `CONFIG.storage.jsonBackups`.
- **Ristikko (Pasi 20.10.):** Välilyönti vaihtaa suuntaa, ja nuoli ristisuuntaan kääntää ensin suunnan. Enter kahdesti antaa vihjeen. Pasi muutti 21.10.: vihje paljastaa 3 satunnaista puuttuvaa kirjainta koko ristikosta ja vie 10 s (ennen 1 kirjain kohdistimen kohdalta, −5 s). Ristikossa on 18–20 sanaa (nyt 20 Pasin listasta, loput varasanoina tiedostossa). Täydet 400 aikapistettä saa, kun ratkaisee alle 3 minuutissa, ja sen jälkeen pisteet vähenevät tasaisesti nollaan 10 minuutin kohdalla. Kokonaan paljastettu sana ei tuo sanapisteitä, mutta sana, johon on itse kirjoitettu vähintään yksi kirjain, tuo. Kun aika loppuu, ratkaisematta jääneet kirjaimet näytetään punaisina. Valmiin sanan jälkeen kohdistin siirtyy seuraavaan sanaan. Hiirellä voi valita ruudun tai vihjeen (poikkeus CLAUDE.md:n "ei hiirtä" -periaatteeseen, ja näppäimistö riittää edelleen). Tab-hyppyä ei tehty.
- **Enteet (Pasi 20.10.):** vastausaika 12 s. Täydet 100 pistettä saa 5 sekunnin sisällä, ja sen jälkeen pisteet laskevat tasaisesti nollaan.
- **Tasohyppely, yritykset ja kauppa (Pasi 22.10.):** 5 yritystä, ja jokainen jatkuu sen kentän alusta, jossa edellinen päättyi, kentän alun tavaroilla. Poikkeaa CLAUDE.md:n kohdista "3 yritystä" ja "seuraava yritys alkaa ensimmäisestä kentästä" Pasin päätöksellä. Päänoidan kaatuminen päättää pelin. Pisteitä ei näytetä pelin aikana. Kynttilöistä saa kolikoita kauppaan (ks. rupeama 7).
- **Tasohyppely, lisäykset (Pasi 21.10.):** tikarinheitto C:llä (rajattu määrä, ks. rupeama 7) ja 5 ruoskan tasoa, jotka eivät katoa osumasta. Poikkeaa CLAUDE.md:n kohdasta "Muita voimaesineitä ei ole" Pasin päätöksellä.
- **Tasohyppely (Pasi 21.10.):** nimi "MonsterSlayer3000". Sankarina vampyyrimetsästäjä (valkoinen tukka, pitkä tummanpunainen takki). Kenttä kestää noin 90 sekuntia (ei 2 minuuttia), jotta ilta ei veny. Jokaisen kentän alussa on 5 health-pistettä (ei 3), ja kerätyt puolikkaat vain korjaavat, eivät nosta viiden yli. Vihollisen osuma vie 1, ja kuoppaan putoaminen vie 1 ja palauttaa reunalle. Osumasta tulee pieni kimpoaminen, joka ei koskaan heitä kuoppaan. Hyppy on moderni (suuntaa voi muuttaa ilmassa, pidempi painallus hyppää korkeammalle), ja tuplahyppy on käytössä. Alanuoli kyyristää, ja ylänuoli + X lyö ylöspäin. Portaita ei ole, mutta kentissä on kiipeilyosuuksia. Vaarat: kuopat, liikkuvat tasot, sortuvat lattiat ja heiluvat terät (ei piikkejä). Kaadetut viholliset eivät palaa. Pikselitaide on tarkempaa (yksi pikseli on 3 × 3 pistettä). Kentässä on noin 12 kynttilää. Kynttilät antavat pisteitä, ja aina samat 1–2 kynttilää pudottavat esineen. Viholliset pudottavat esineen sattumalta (noin joka 10.), ja ruoskan päivitys taataan kerran kentässä (jos sitä ei ole tullut puoliväliin mennessä, seuraava kaatuva vihollinen pudottaa sen). Ruoskassa on 5 tasoa (muutettu kolmesta), ja täyden ruoskan jälkeen päivitys muuttuu puolikkaaksi health-pisteeksi. Useimmat viholliset kaatuvat yhdestä lyönnistä, haarniskat, sudet ja sienet kestävät 2–3. Vaikeus kasvaa tasaisesti kentästä toiseen. Päänoita on keskivaikea, ja sillä on 3 vaihetta. Se kutsuu apuun korppeja ja maasta nousevia luurankoja. Health-pisteitä ei palauteta ennen päänoitaa. **Pisteet:** matka 600 (200 per kenttä), kynttilät 100 (osuus kaikista) ja päänoita 300 osuutena sen menettämästä kestävyydestä. Poikkeaa CLAUDE.md:n jaosta 700 + 300 Pasin päätöksellä. Viholliset: hautausmaalla maasta nousevat zombit, syöksyvät lepakot ja korpit, linnassa kirveitä heittävät haarniskat, aaltoillen lentävät liekehtivät kallot ja katosta laskeutuvat hämähäkit, ja noidan metsässä leijuvat virvatulet, itiöitä ampuvat myrkkysienet ja juoksevat sudet.
- **Kurpitsalinko (Pasi 22.10.; kentän koko, luurankojen määrä, pisteet ja yritykset muuttuivat palautteessa, ks. alempi kohta):** voima heiluu ylös ja alas, kun välilyöntiä pidetään pohjassa. Kurpitsa räjähtää ensimmäisestä kosketuksesta, tekee kuopan ja kaataa lähellä olevat luurangot. Linko on paikallaan vasemmalla ja ampuu oikealle. Edellisen laukauksen rata näkyy pisteviivana. Kenttä on noin puolitoista ruutua leveä, ja kamera seuraa kurpitsaa. Luurankoja on yhteensä noin 15 (2, 2, 3, 4 ja 4). Kentästä 3 alkaen 1–2 luurankoa ottaa pari askelta jokaisen laukauksen jälkeen. Luuranko hajoaa myös pudotessaan korkealta, vallihautaan tai kentän ulkopuolelle. Maasto tuhoutuu (Claude Coden ratkaisu, CLAUDE.md sallii). Pisteet = 1000 × luurangot ÷ laukaukset (enintään 1000). Ohitusta ei ole: kenttä päättyy vasta, kun kaikki luurangot on kaadettu. Pelin aikana näkyvät vain laukaukset ja jäljellä olevat luurangot, ja pisteet näkyvät yrityksen jälkeen. Kentissä on lisäksi ruutitynnyreitä (räjähtävät osumasta, ketjureaktio) ja puurakenteita (tornit ja sillat, jotka hajoavat osumasta). Nimi "Piiritys". Lingon takana on kurpitsapäinen soturi. Kentät: 1. Linnan edusta (avoin kumpu), 2. Vallihauta ja silta, 3. Linnanpiha torneineen, 4. Muurit ja vartiotornit, 5. Hautaholvi matalan katon alla. Kuoppa on keskikokoinen (noin luurangon korkuinen). Aseita on viisi (Pasi 22.10.), ja ne valitaan numeroilla 1–5: 1. tavallinen kurpitsa (loputtomasti), 2. rypälekurpitsa (hajoaa viiteen pikkukurpitsaan), 3. ohjautuva kurpitsa (kääntyy kohti lähintä luurankoa), 4. kurpitsasäde (suora säde, joka läpäisee maaston; ei tunnetun sarjan nimeä eikä ulkonäköä) ja 5. iso kurpitsapommi (suuri räjähdys). Jokaista erikoisasetta saa käyttää kerran kentässä. Erikoisaseen laukaus lasketaan pisteissä yhtenä laukauksena.
- **Kurpitsalinko, palaute 22.10.:** katapultin varsi oli väärällä puolella. Kentät ovat isompia (noin 2 ruutua leveitä) ja enemmän klassikon kaltaisia: pidemmät matkat, vuoria, laaksoja ja esteitä, eivätkä kaikki maalit ole samassa linjassa. Luurankoja on 5–8 kentässä. Yrityksiä on 2 (ensimmäinen on ikään kuin harjoitus). Pisteet lasketaan kentittäin, 200 per kenttä: laukauksia enintään luurangot + 1 = 200, + 2–5 = 150, + 6–10 = 100, + 11–15 = 50 ja sitä enemmän 25. Tähdätessä näkyy pienoiskartta, ja kameraa voi siirtää A- ja D-näppäimillä.
- **Kurpitsalinko, palaute 23.10.:** voimamittari näyttää edellisen laukauksen voiman, ja edellinen kulma näkyy haaleana viivana. Ohjautuva kurpitsa kääntyy vasta lakipisteen jälkeen (Claude Coden ehdotus, Pasi hyväksyi). Pasi 23.10. myöhemmin: kääntyminen oli liian hidasta, joten nyt se kääntyy jyrkästi kohti lähintä elossa olevaa luurankoa missä tahansa kentässä. Erikoisaseet säilyvät kentästä toiseen, eivätkä ne nollaudu. Alussa on rypäle 3, pommi 3, ohjautuva 2 ja säde 1, ja jokaisen uuden kentän alussa tulee +1 rypäle (säde oli liian hyvä). Jokaisessa kentässä on laatikko, jonka sisältö on kiinteä ja joka aukeaa, kun räjähdys osuu siihen. Lisäksi kentässä leijuu kaksi symbolia: −1 helpossa ja luontevassa paikassa ja −3 hankalassa paikassa. Kun ammus lentää symbolin läpi, kentän laukauksista vähennetään symbolin luku. Pisteet ovat armollisemmat: täydet 200 saa, kun laukauksia on enintään luurangot + 3, + 4–7 = 150, + 8–12 = 100, + 13–17 = 50 ja sitä enemmän 25. Pasi 23.10.: ruudun oikeassa yläkulmassa ei näytetä ammuttuja laukauksia eikä ihannetulosta, vaan siinä lukee vain jäljellä olevien luurankojen määrä. Kentän lopussa näkyy yhä, montako laukausta kului.
- **Täydellinen tulos päättää pelin (Pasi 20.10.):** kun toimintapelin yrityksestä tulee 1000 pistettä, loput yritykset jäävät väliin. Koskee kaikkia toimintapelejä.
- **Kuva-arvoitukset:** 5 kuva-arvoitusta (Pasi tekee kuvat, yksi kuva per arvoitus) ja 5 emojiarvoitusta (Claude Code). Kuva-arvoitukset: hirviö, ihmissusi, verikuu, silmämuna ja kummitusjuna. Arvoitukseen saa lisätä vihjeen (kohta `kysymys`). Ensimmäiset versiot tehdään nyt, ja niitä muokataan myöhemmin.
- **GitHub Pages** on päällä (Source: GitHub Actions), Pasi kytki sen 19.10.2026.

## Claude Coden tekemät ratkaisut (Pasi voi muuttaa)

- **Pelien väliaikaiset nimet:** 1. Viimeinen sana (hirsipuu). Ehdotukset seuraaville: 2. Enteet (kuva-arvoitukset), 3. Yölento (lentopeli), 4. Kiirastuli (räiskintä), 5. Kalmanristikko (ristikko), 6. MonsterSlayer3000 (tasohyppely, Pasin valinta), 7. Piiritys (kurpitsalinko).
- **Tasohyppelyn yksityiskohdat (Pasi voi muuttaa):** Päänoita kestää 30 osumaa perusruoskalla ja 15 salamaruoskalla. Se lentää enimmäkseen korkealla, mutta laskeutuu välillä lepäämään matalalle ja syöksyy areenan poikki pään korkeudella. Syöksyn alta pääsee kyyristymällä, ja ruoskanisku keskeyttää syöksyn. Kolmannessa vaiheessa maasta nousee vihreitä tulipatsaita, joista varoitetaan hetkeä ennen. Heiluvan terän alta pääsee kyyristymällä. Vihollisista ei saa pisteitä, joten pisteet tulevat vain matkasta, kynttilöistä ja päänoidasta. Kynttilä on noin 2,8 pisteen arvoinen. Kentän alussa näytetään 1,6 sekunnin ajan kentän nimi. Kentät on mitoitettu noin 75–90 sekunniksi, ja pituus säädetään testauksen jälkeen. Kentät ovat tekstikarttoina tiedostossa `src/games/tasohyppely/levels.ts`, ja luvut ovat tiedostossa `src/config.ts` (kohta `tasohyppely`).
- **Tasohyppelyn maasto ei tuhoudu:** sortuvat lattiat palaavat 4 sekunnin kuluttua, jotta kiipeilyosuudella ei voi jäädä jumiin.
- **Sisältötiedostot** ovat korttimuodossa (`sana: …` / `vihje: …`, korttien välissä tyhjä rivi). Ohje: `content/README.md`.
- **Kesken jäänyt kierros jatkuu:** hirsipuu tallentaa tilanteen jokaisen arvauksen jälkeen. Jos selain suljetaan kesken, Pasi jatkaa vuoroa korjaustilasta, ja peli jatkuu täsmälleen samasta kohdasta. Toimintapeleissä kesken jäänyt yritys ei kulu, ja peli jatkuu seuraavasta yrityksestä.
- **Korjaustila:** "Poista tulos" tekee pelistä pelaamattoman. "Anna peli uudelleen" tekee saman ja tarjoaa pelaajan vuoron aloittamista heti. Lisäksi korjaustilasta voi poistaa yksittäisen pelaajan (esimerkiksi testipelaajat).
- **Ikkunan vaihtaminen kesken pelin** laittaa pelin tauolle.
- **Varmuuskopio** ladataan myös ennen varmuuskopion tuontia ja ennen kaiken tyhjentämistä.

## Työrupeamat

### 19.–20.10.2026 – rupeama 1 (vaihe 1)

Tehty:
- Projektipohja (Phaser 3, Vite, TypeScript) ja automaattinen julkaisu GitHub Pagesiin. Julkaisu tarkistaa ensin sisältötiedostot ja ajaa testit; virheellinen sisältö pysäyttää julkaisun ja virhe kerrotaan suomeksi.
- Aloitusnäkymä (nimi, sama nimi ei kelpaa), päävalikko (esikatselukuvat, pelattu peli harmaana), ohjeruutu, yritysten kulku (3 yritystä toimintapeleissä, yksi kierros pulmapeleissä), tauko (Esc), tallennus jokaisen yrityksen jälkeen, kiitosnäkymä ja automaattinen varmuuskopio.
- Tulosnäkymät salasanalla: palkintojenjako (sijat paljastetaan yksi kerrallaan, voittajalle fanfaari ja konfetti), tulokset pelin mukaan ja pelaajan mukaan.
- Korjaustila (Ctrl + Shift + K): tulosten muutos ja poisto, pelin antaminen uudelleen, kesken jääneen vuoron jatkaminen, varmuuskopion lataus ja tuonti, CSV-vienti, pelaajan poisto, kaiken tyhjennys kahdella vahvistuksella.
- Hirsipuu "Viimeinen sana": 5 sanaa vihjeineen, luuranko kahdeksassa osassa, Å, Ä ja Ö mukana, pisteet CLAUDE.md:n mukaan.
- Koodilla piirretyt kuvat, jotka Pasi voi korvata omillaan (`ASSETS.md`).
- 163 yksikkötestiä ja 11 selaintestiä, jotka pelaavat koko kulun läpi.

Kesken:
- Pasi testaa vaiheen 1 kahdella testipelaajalla.
- Pasi tekee halutessaan hirsipuun kuvat (`ASSETS.md`).

Seuraavaksi:
- Pasin palautteen mukaiset korjaukset vaiheeseen 1.
- Vaihe 2, kuva-arvoitukset. Claude Code ehdottaa kuvista muodostuvien arvoitusten ideat ja tekee emojiarvoitukset. Pasi tekee kuvat.

### 20.10.2026 – rupeama 2 (vaiheen 1 palaute)

Tehty:
- Pasi testasi vaiheen 1: kaikki toimii.
- Pasin pyynnöstä tulosvalikon napeista poistettiin selitteet, joten napeissa on nyt vain otsikko.

Kesken:
- Pasi saattaa antaa myöhemmin omat hirsipuun sanat. Hän voi muokata tiedostoa `content/hirsipuu.txt` itse tai lähettää sanat Claude Codelle.

Seuraavaksi:
- Vaihe 2, kuva-arvoitukset, kun Pasi antaa luvan aloittaa.

### 20.10.2026 – rupeama 3 (vaihe 2)

Tehty:
- Kuva-arvoitukset "Enteet": 10 arvoitusta (5 monivalintaa, 5 avointa), 20 sekuntia per arvoitus, pisteet 100 → 50 ajan mukaan, avoimessa −20 per väärä vastaus, väärä monivalinta ja aikaraja 0. Tauko pysäyttää ajan. Kesken jäänyt kierros jatkuu samasta arvoituksesta.
- Sisältötiedosto `content/kuva-arvoitukset.txt` tarkistuksineen ja ohjeineen.
- Kuva-arvoitusten väliaikaiset kuvat emojeista, kunnes Pasi tekee omat (`ASSETS.md`).
- Emojifontiksi Twemoji (COLR-muoto). Ensimmäinen kokeiltu fontti (Noto, SVG-muoto) ei näy Chromessa lainkaan.
- Avoimen vastauksen vertailussa ei välitetä isoista kirjaimista, välilyönneistä, väliviivoista eikä välimerkeistä.

Kesken:
- Pasi testaa kuva-arvoitukset ja tekee viisi kuvaa (`ASSETS.md`: arvoitus-ihmissusi, -verikuu, -silmamuna, -hirvi, -kummitusjuna).

Seuraavaksi:
- Pasin palautteen mukaiset korjaukset, sitten vaihe 3 (lentopeli).

### 20.10.2026 – rupeama 4 (vaihe 3)

Tehty:
- Lentopeli "Yölento": noita lentää välilyönnillä, esteinä riippuvat häkit ja pylväillä seisovat inkvisiittorit, mustat kissat lisäelämiä (enintään 3), törmäys vie kissan ja pysäyttää vauhdin, maali noin 90 sekunnin lennon päässä (29 330 px). Ensimmäiset 20 sekuntia helppoja, sitten vauhti kasvaa ja aukot kapenevat vähitellen. Rata on kaikille sama. Pisteet: maali 1000, muuten matkan osuus.
- Simulaatio: rata on lennettävissä maaliin ilman törmäyksiä.

Pasin palaute: peli toimii, mutta kissoja tulee liian usein, peli on liian helppo ja esteet tulevat aina katosta asti. Lisäksi kolmea yritystä ei tarvita, jos ensimmäisellä pääsee maaliin.

Korjattu samassa rupeamassa:
- Rata rakennetaan nyt esteistä, joita on neljää tyyppiä, ja lepakot lentävät vastaan. Reittejä on usein kaksi (yli tai ali). Radan rakentaja tarkistaa, että jokaisesta aukosta ehtii seuraavaan esteeseen. Yksikkötestin autopilotti lentää radan maaliin ja kerää kaikki kissat törmäämättä.
- Vaikeampi: vauhti nyt 270–460 (ennen 250–420), aukot 240–165 px (ennen 260–190) ja esteiden väli 520–350 px (ennen 560–400). Lisäksi reitti heittelee enemmän ylös ja alas. Maali on edelleen noin 90 sekunnin päässä (31 800 px).
- Kissoja on 3 (noin 22, 44 ja 66 sekunnin kohdalla), ja ne ovat lepakoiden vieressä.
- 1000 pistettä päättää toimintapelin heti (yhteinen ydin), ja ohjeruudussa kerrotaan siitä.

Kesken:
- Pasi testaa lentopelin uudelleen. Vaikeus säädetään tiedostossa `src/config.ts` (kohta `lentopeli`).

Seuraavaksi:
- Vaihe 4, räiskintä, kun Pasi hyväksyy lentopelin.

### 20.10.2026 – rupeama 5 (vaihe 4)

Pasi hyväksyi lentopelin ("riittävän hyvä tähän vaiheeseen").

Tehty:
- Räiskintä "Kiirastuli": keksitty paavihahmo liikkuu nuolilla ja ampuu itse. Alla vierii hautausmaa. Viholliset ovat aaveita, lepakoita, ampuvia kurpitsalyhtyjä ja luurankojen marssiryhmiä (kuten klassikoissa). Aallot ovat kaikille samat, ja niitä tulee koko ajan tiheämmin (256 vihollista 168 sekunnissa).
- Liitonarkku ja pyhä malja (30, 70, 110 ja 150 s) nostavat aseen tasoa (1–5). Joka 18. sekunti yksi vihollinen pudottaa boostin: nopea tuli, hajaammus tai suojakehä.
- 3 minuutin kohdalla väliteksti "Kaiken pahan alku ja juuri esittäytyy vihdoin…" ja Paholainen, joka kiihtyy kolmessa vaiheessa (tuliviuhka, tähdätyt tulipallot, tulisade).
- Pisteet: 400 × tuhottujen osuus + 300 × selviytyty aika + 300 Paholaisesta.
- Yhteiset osat: pohjassa pidettävien näppäinten apuväline (`heldKeys`), lepakon piirros yhteisessä tiedostossa (`src/games/shared/bat.ts`), testien `selectGame`.

Kesken:
- Pasi testaa räiskinnän. Vaikeus säädetään tiedostossa `src/config.ts` (kohta `raiskinta`).

Pasin palaute ensimmäiseen versioon: vihollisia liian vähän, kuva lähemmäs kuin pitäisi, Paholainen tylsä. Korjattu samassa rupeamassa:
- Kuva on kauempaa (kaikki 72 % koosta, `viewScale`), ja tausta toistuu saumattomasti myös sivusuunnassa.
- Paavi liikkuu nuolilla neljään suuntaan ruudun alaosassa.
- Vihollisia on noin 690 (ennen 256). Uudet, vaikeammat viholliset: pikkupirut syöksyvät paavia kohti, ja viikatemiehet kestävät 10 osumaa ja ampuvat viiden kirouspallon viuhkoja. Kurpitsat ampuvat lopussa kolme tulipalloa kerralla.
- Paholainen raivostuu kahdesti (2/3 ja 1/3 kestävyydestä), ja raivon vaiheet näkyvät palkissa. Hyökkäyksiä on kahdeksan: tuliviuhka, tähdätty sarja, tulisade, tulikierre, tulirengas, pikkupirujen kutsu, rynnäkkö paavia kohti ja katoaminen. Kestävyys on 462 (Pasi 20.10.: +10 %).
- JSON-varmuuskopiot otettiin pois käytöstä Pasin pyynnöstä (ks. yllä).

Pasin palaute toiseen versioon: vaikeahko, mutta hän pääsi Paholaisen viimeiseen vaiheeseen, kun keskittyi ampumiseen. Vihollismäärä saa pysyä, kunhan aseisiin tulee enemmän apua. Lisäelämiä saa pudota pari, koska loppuun jäi vain 3. Väliaikaisten boostien pitää pudota sattumalta tuhotuista vihollisista. Lisää pysyviä parannuksia, esimerkiksi paavia kiertävä suojapallo, ja alkuun noin 3 ruudun tyhjentävää pommia. Korjattu samassa rupeamassa:
- Boostit putoavat sattumalta tuhotuista vihollisista (5 %, enintään yksi neljässä sekunnissa): nopea tuli, hajaammus, suojakehä tai pyhä vesi.
- Pyhiä esineitä on seitsemän (20, 40, 65, 90, 115, 140 ja 160 s). Liitonarkku parantaa asetta, ja pyhä malja tuo paavia kiertävän suojapallon (enintään 3), joka pysäyttää ammuksia ja vahingoittaa vihollisia.
- Pyhä vesi (välilyönti, alussa 3, enintään 5): 6 vahinkoa kaikkiin näkyviin vihollisiin, ammukset katoavat, ja Paholaiselle tulee 30 vahinkoa. Nimi on oma, koska "holy hand grenade" on tunnetusta elokuvasta.
- Kolme kultaista ristiä (+1 kesto) putoaa noin 50, 100 ja 150 sekunnin kohdalla.
- Viholliset ovat samat kuin Pasin testaamassa versiossa. Osuman jälkeinen suoja-aika on 1,5 s (ennen 1,2 s).

Seuraavaksi:
- Vaihe 5, ristikko, kun Pasi hyväksyy räiskinnän. Kysy Pasilta näppäimet (CLAUDE.md: ehdota liikkuminen, suunnan vaihto ja kirjaimen paljastus).
- Myöhemmin (Pasi): boosteihin erilaisia lisäaseita.

### 20.10.2026 – rupeama 6 (vaihe 5)

Pasi hyväksyi räiskinnän ("Paljon parempi") ja pyysi Paholaiselle 10 % lisää kestävyyttä (420 → 462).

Tehty:
- Ristikko "Kalmanristikko": ruudukko tehdään automaattisesti sanoista (`src/games/ristikko/logic.ts`). Haku peruu ja kokeilee uudelleen, kun sana ei mahdu, ja sijoittaa ensin sanan, jolla on vähiten vaihtoehtoja. Ruudukko on enintään 22 × 16 ruutua, ja 20 sanan ristikon tekeminen vie noin puoli sekuntia, kun peli avataan. Julkaisun tarkistus kertoo suomeksi, jos sanoista ei saa ristikkoa.
- Pelin säännöt ovat erillään piirtämisestä (`crossword.ts`): kirjoittaminen, väärän sanan tarkistus (−5 s), paljastus (−5 s), automaattinen siirtyminen seuraavaan sanaan, pisteet ja tallennus jokaisen muutoksen jälkeen. Kesken jäänyt ristikko jatkuu samasta kohdasta.
- Ruudulla on ruudukko vasemmalla ja numeroidut vihjeet oikealla (vaaka ja pysty). Nykyinen vihje näkyy ylhäällä, ja aika ja ratkaistut sanat näkyvät kulmissa.
- Hiiri otettiin käyttöön Phaser-asetuksissa, mutta vain ristikko käyttää sitä.
- Enteiden ajoitus muutettiin Pasin toiveen mukaan.

Pasin palaute 21.10.: "Toimi hyvin". Vihje muutettiin: 3 satunnaista puuttuvaa kirjainta koko ristikosta, −10 s. Huomio Pasille: jos pelaaja paljastaa koko ristikon pelkillä vihjeillä, hän saa noin 140 aikapistettä (sanapisteitä ei tule).

Pasi hyväksyi ristikon 21.10. ("toimii hyvin"). Keskustelu tyhjennettiin tämän jälkeen, ja tasohyppely aloitetaan uudessa keskustelussa.

Kesken:
- Ei mitään.

Seuraavaksi:
- Vaihe 6, tasohyppely, kun Pasi hyväksyy ristikon. Kysy ensin reilusti kysymyksiä (Pasin toive 20.10.).

### 21.10.2026 – rupeama 7 (vaihe 6)

Pasi vastasi noin 30 kysymykseen tasohyppelystä (päätökset kohdassa "Pasin kanssa sovitut asiat").

Tehty:
- Tasohyppely "MonsterSlayer3000": vampyyrimetsästäjä juoksee, hyppää (myös tuplahyppy), kyyristyy ja lyö ruoskalla eteen, ylös ja matalalta. Kolme kenttää: hautausmaa (helppo), linna (keskivaikea, tornin kiipeily ja muurit) ja noidan metsä (vaikein, jättipuun kiipeily ja latvusto). Viimeisen kentän lopussa on päänoita, jolla on kolme vaihetta.
- Viholliset Pasin listan mukaan: zombit, lepakot, korpit, haarniskat (heittävät kirveitä), liekehtivät kallot, hämähäkit, virvatulet, myrkkysienet (ampuvat itiöitä) ja sudet. Päänoita kutsuu apuun korppeja ja luurankoja. Vaarat: kuopat, liikkuvat tasot (sivu- ja pystysuunnassa), sortuvat lattiat ja heiluvat terät.
- 36 kynttilää (12 per kenttä), joista neljä pudottaa aina esineen. Viholliset pudottavat esineen 10 %:n todennäköisyydellä, ja ruoskan päivitys taataan kerran kentässä.
- Pisteet: matka 600, kynttilät 100 ja päänoita 300 osuutena sen menettämästä kestävyydestä. Pisteet näkyvät pelatessa.
- Kaikki grafiikka on koodilla piirrettyä pikselitaidetta (yksi pikseli 3 × 3), ja `ASSETS.md`:ssä on 35 uutta korvattavaa kuvaa (valikon esikatselukuva mukaan lukien).
- Testit: yksikkötesti pelaa jokaisen kentän läpi oikealla hyppyfysiikalla ja tarkistaa, että jokaiseen kynttilään ylettyy. Viholliset ja päänoita testataan erikseen, ja selaintesti pelaa koko kulun kolmella yrityksellä.

Pasin palaute 21.10.: ohjaus toimii, ja ensimmäinen kenttä on ok. Linnassa pääsi hyppäämään heiluvien terien hallin katolle, eikä sieltä päässyt pois (soft lock). Pasi toivoi kaukoaseeksi tikarinheittoa ja lisää ruoskan versioita. Korjattu samassa rupeamassa:
- Tornin vasen seinä ja alas laskeutuvan kuilun oikea seinä ulottuvat nyt kentän yläreunaan asti, joten hallin katolle ei pääse. Uusi yksikkötesti etsii jumipaikat: se kokeilee kaikista saavutettavista paikoista, pääseekö niistä vielä maaliin. Vanhasta kartasta testi löysi 48 jumipaikkaa.
- Tikarinheitto (Pasin valinnat): C heittää, alussa 5 tikaria ja enintään 15. Tikarit säilyvät koko yrityksen, ja tikarinippu (+5) putoaa vihollisilta. Satunnaisista pudotuksista 30 % on ruoskan päivityksiä, 35 % tikareita ja loput puolikkaita sydämiä. Tikari tekee saman vahingon kuin perusruoska.
- Ruoskassa on 5 tasoa: nahka, piikkiketju, hopea, liekki ja salama. Taso säilyy osumista huolimatta (Pasin valinta).
- Ohjeruutu tiivistää näppäinrivit, kun tekstiä on paljon.

Pasin palaute 22.10.: jumipaikkoja ei löytynyt, mutta Pasi ei päässyt päänoidalle asti. Tikareita pitää olla enemmän, koska kolmannessa kentässä on paljon vihollisia, jotka ampuvat kauempaa. Korjattu samassa rupeamassa Pasin valinnoilla:
- Yrityksiä on 5. Kun sydämet loppuvat, seuraava yritys jatkuu saman kentän alusta, ja tavarat ovat kuten kentän alkaessa (ostokset perutaan). "Yritys 2/5" -ruudussa kerrotaan, mistä kentästä jatketaan. Päänoidan kaatuminen päättää pelin, eikä loppuja yrityksiä pelata. Jokaisen kentän alku tallennetaan, joten keskeytynyt yritys jatkuu samasta kentästä.
- Pisteitä ei näytetä pelin aikana, vaan vasta yrityksen jälkeen kuten muissa peleissä.
- Jokaisesta kynttilästä saa kolikon. Ennen kenttiä 2 ja 3 avautuu kauppa: 5 tikaria 3 kolikolla, lisäsydän 6 kolikolla (enintään 3, eli 8 sydäntä), seuraava ruoska 8 kolikolla ja teroitus 6 kolikolla (+25 % vahinkoa, enintään 4). Teroituksen yläraja on Claude Coden valinta.
- Tikareita on alussa 10 (ennen 5), ja vihollisten satunnaisista pudotuksista puolet on tikareita.
- Ydin: peli voi määrätä oman yritysmääränsä (`attempts`), antaa seuraavalle yritykselle tiedon (`finish(score, { carry })`, tallentuu tietueen kenttään `carry`) ja päättää pelin kesken (`complete`). Ohjeruudun yrityssäännön voi korvata (`attemptRule`), ja "Yritys 2/5" -ruutu näyttää pelin huomautuksen (`attemptNote`).
- `heldKeys` laskee nyt jokaisen painalluksen erikseen (kaksi nopeaa napautusta ovat kaksi). Kaupan nuolet käsitellään heti, samassa järjestyksessä kuin Enter.

Kesken:
- Pasi testaa tasohyppelyn uudelleen: jatkaminen kentän alusta, kauppa, tikarit, päänoita sekä kenttien pituus ja vaikeus.

Seuraavaksi:
- Pasin palautteen mukaiset korjaukset tasohyppelyyn.
- Pasin toive 21.10.: salasana pelikertojen väliin (ks. "Tulossa"). Tarkenna ensin Pasilta.
- Vaihe 7, kurpitsalinko. Kysy ensin Pasilta reilusti kysymyksiä.

## Tulossa (Pasin toiveet)

- Ei mitään uutta. Salasana pelikertojen väliin tehtiin 22.10. (ks. rupeama 8).

### 22.10.2026 – rupeama 8 (salasana pelikertojen väliin)

Pasin toive 21.10. ja tarkennukset 22.10.: salasana pysyy ennallaan, ja isot ja pienet kirjaimet erotellaan.

Tehty:
- Peli aukeaa vain Pasin salasanalla, joka kerta kun sivu ladataan. Lukkoa ei voi ohittaa Escillä, joten uudelleenlataus ei anna kenellekään uutta kierrosta.
- Jos jonkun vuoro jäi kesken, salasanan jälkeen kysytään, jatketaanko sitä. "Jatka vuoroa" vie suoraan pelaajan valikkoon. Korjaustilan "Jatka kesken jäänyttä vuoroa" toimii edelleen.
- Kiitosnäkymän "Seuraava pelaaja" vaatii salasanan. Peruutus jättää kiitosnäkymän näkyviin.
- Selaintestit avaavat pelin salasanalla (`unlock`), ja uusi testi `lukitus.spec.ts` tarkistaa lukituksen.

Pasi 22.10.: "salasana toimi hyvin, testasin kaiken". Siirrytään kurpitsalinkoon.

Kesken:
- Ei mitään.

Seuraavaksi:
- Pasin palautteen mukaiset korjaukset tasohyppelyyn, sitten vaihe 7, kurpitsalinko. Kysy ensin reilusti kysymyksiä.

### 22.10.2026 – rupeama 9 (vaihe 7)

Pasi vastasi noin 20 kysymykseen kurpitsalingosta (päätökset kohdassa "Pasin kanssa sovitut asiat") ja toivoi klassikon tapaan viisi valittavaa asetta.

Tehty:
- Kurpitsalinko "Piiritys": kurpitsapäinen soturi ampuu katapultilla. ↑↓ muuttaa kulmaa, ←→ muuttaa sitä tarkasti, ja välilyönnin voima heiluu ylös ja alas. Lyhyt apuviiva näyttää suunnan, ja edellisen laukauksen rata jää pisteviivaksi. Tähdätessä koko kenttä näkyy kerralla, ja lennon aikana kamera seuraa kurpitsaa.
- Viisi kenttää ja 15 luurankoa: linnan edusta, vallihauta ja silta, linnanpiha torneineen, muurit ja vartiotorni sekä hautaholvi matalan katon alla. Kentistä 3–5 alkaen osa luurangoista kävelee laukausten välissä.
- Maasto tuhoutuu: räjähdys tekee kuopan, ja puu palaa helpommin kuin maa ja kivi. Luuranko hajoaa myös pudotessaan korkealta, vallihautaan tai kentän ulkopuolelle. Ruutitynnyrit räjähtävät osumasta, ja niistä voi syntyä ketjureaktio.
- Aseet 1–5: kurpitsa (loputtomasti), rypäle (viisi pikkukurpitsaa), ohjautuva, säde (läpäisee kaiken) ja pommi. Jokaista erikoisasetta saa käyttää kerran kentässä.
- Pisteet: 1000 × 15 ÷ laukaukset. Pelin aikana näkyvät laukaukset ja jäljellä olevat luurangot.
- Testit: yksikkötesti varmistaa, että jokaiseen luurankoon osuu yhdellä tavallisella kurpitsalla. Lisäksi testataan maasto, aseet, tynnyrit, putoaminen ja kävely. Selaintesti pelaa kolme yritystä.
- Nopea välilyönnin napautus ampuu pienimmällä voimalla (aiemmin se jäi joskus huomaamatta).

Pasin palaute 22.10.: katapultin varsi oli väärällä puolella, kentät olivat liian pieniä ja liian samassa linjassa, ja pisteet piti laskea kentittäin. Korjattu samassa rupeamassa:
- Varsi lepää ladattuna taaksepäin, kauhassa näkyy valittu ammus, ja heittäessä varsi heilahtaa yli.
- Uudet kentät ovat 2560 leveitä (noin 2 ruutua), ja niissä on kukkuloita, laaksoja, torneja, silta, leijuva kallio, vartiotorneja ja holvi. Luurankoja on 5, 6, 6, 7 ja 8 (yhteensä 32). Holvin katto on kivikumpu, jonka yllä on taivas, ja loppupää on avoin raunio. Testi varmistaa, että jokaiseen luurankoon osuu edelleen yhdellä kurpitsalla.
- Pisteet lasketaan kentittäin (200 per kenttä, Pasin portaat). Yrityksiä on 2.
- Tähdätessä kamera näyttää lingon, ja A/D siirtää kameraa. Ylhäällä näkyy koko kentän pienoiskartta luurankoineen ja tynnyreineen sekä kameran näkymä.
- `heldKeys` hyväksyy nyt myös kirjainnäppäimet (`'a'`, `'d'`).

Pasin palaute 23.10. (ks. "Pasin kanssa sovitut asiat"): tehty samassa rupeamassa. Testit varmistavat, että jokaisen −1:n saa samalla laukauksella, joka kaataa luurangon, ja että jokaiseen −3:een ja laatikkoon ylettyy yhdellä laukauksella.

Kesken:
- Pasi testaa kurpitsalingon uudelleen: aseiden määrät, laatikot, −1- ja −3-symbolit, ohjautuva kurpitsa ja pisteet.

Seuraavaksi:
- Pasin palautteen mukaiset korjaukset, sitten vaihe 8, viimeistely (koko ilta kolmella testipelaajalla).

### 23.10.2026 – seuraavaksi: hiominen

Pasi 23.10.: kun kurpitsalinko on testattu, aloitetaan konseptin, pelien nimien ja pelien hiominen. Jokaiseen peliin tehdään pieniä säätöjä. Sovittu järjestys (Claude Coden ehdotus):
1. Teema ja konsepti: Claude Code tuo vaihtoehdot, ja Pasi valitsee. Tarinaa ei keksitä ilman Pasin lupaa.
2. Pelien lopulliset nimet teeman mukaan.
3. Valikon ulkoasu.
4. Pienet säädöt peli kerrallaan: vaikeus, tekstit, kysymykset ja sanat, äänet ja kuvat.
5. Viimeistely: koko ilta kolmella testipelaajalla ja illan keston tarkistus.

#### Hiomislista (Pasi 23.10., kerätään ensin, ei vielä tehty)

Pasi: "älä vielä koodaa, kerätään kommentteja eri peleistä". Tehdään vasta, kun Pasi antaa luvan.
- **Kurpitsalinko:** kentän lopun ruudussa ei näytetä laukausten määrää. Tilalle tulee yleinen "pääsit läpi" -teksti, ja seuraavaan kenttään siirrytään Enterillä.
- **Kurpitsalinko:** symbolit muuttuvat: −1 → −2 (helppo paikka) ja −3 → −5 (hankala paikka). Niistä pitää olla kunnolla apua.
- **Kaikki pelit:** ohjeruutujen tekstiä vähennetään merkittävästi. Pisteistä kerrotaan vain lyhyesti, mistä niitä saa (esim. "ole nopea", "pääse pitkälle", "tuhotuista vihollisista ja kynttilöistä saa lisäpisteitä"). Laskentakaavoja ei kerrota. Tämä poikkeaa CLAUDE.md:n kohdasta "ohjeessa kerrotaan näppäimet, säännöt ja pisteytys", ja Pasi päätti niin.
- **Kuva-arvoitukset:** täydet pisteet saa 3 sekunnin ajan (ennen 5), ja sitten pisteet alkavat laskea.
- **Nopeutta vaativat pelit:** Esc-tauko poistetaan, jotta kukaan ei voi pysäyttää peliä ja miettiä rauhassa.

## Aikataulu

Iltaan on 10 päivää (21.10.). Jäljellä on tasohyppelyn hiominen, salasanatoive, kurpitsalinko ja viimeistely. Aikataulu on tiukka mutta mahdollinen, jos jokaisesta pelistä saadaan palaute nopeasti. Jos aika alkaa loppua, Pasi päättää, mikä peli jätetään pois tai mitä yksinkertaistetaan.

**Illan kesto:** kaikki pelaavat samalla koneella vuorotellen. Arvio yhden pelaajan koko vuorosta on 45–70 minuuttia (räiskintä enintään noin 12 minuuttia, ristikko 10, tasohyppely 3 yritystä × enintään noin 5 minuuttia). Kahdeksalla pelaajalla vuorot kestävät siis useita tunteja. Pasille kerrottu 20.10.

## Tekninen muistio Claude Codelle

- Rakenne: `src/core` (tulokset, tallennus, pisteet, salasana, varmuuskopiot, äänet), `src/ui` (yhteiset osat ja päällekkäisnäkymät), `src/scenes` (näkymät), `src/games/<id>/` (yksi kansio per peli: `meta.ts`, `assets.ts`, `index.ts`, pelinäkymä, puhdas `logic.ts`), `src/content` (sisältötiedostojen lukijat), `scripts` (sisällön tarkistus, `ASSETS.md`-generaattori).
- Uusi peli: oma kansio ja yksi rivi tiedostoon `src/games/registry.ts`. Emojeja käyttävä peli listaa ne kentässä `preloadText` (fontti ladataan ennen alkua). Pelinäkymä saa `GameContext`in (`finish`, `checkpoint`, `sfx`) eikä tiedä yrityksistä tai tallennuksesta.
- Asetukset (pisteet, aikarajat, vaikeus) kuuluvat tiedostoon `src/config.ts`.
- Kuvien muuttamisen jälkeen aja `npm run kuvalista` (testi varmistaa, että `ASSETS.md` on ajan tasalla).
- Näppäimet aina `onKeys`/`onChar`-apureilla (`src/ui/input.ts`). Käsittelijä palauttaa `false`, jos se ei käyttänyt näppäintä; muuten painallus merkitään käytetyksi kaikissa näkymissä.
- Phaser-sudenkuopat: näkymäolio käytetään uudelleen, joten tila nollataan `init`/`create`-metodeissa. Näkymäluokassa ei saa olla kenttiä nimeltä `data`, `input`, `game` tai `scene`. Tween-animaatiot pysäytetään ennen kohteiden tuhoamista. Pelisilmukka on suojattu poikkeuksilta (`main.ts`).
- Koordinaatit ovat aina 1280 × 720 (`W`, `H`). Isolla näytöllä kangas piirretään kaksinkertaisena, ja kamerat zoomataan automaattisesti.
- Selaintestejä on 21, ja niiden ajo kestää noin 45 minuuttia. Koko illan testi (`pelikulku.spec.ts`) kestää yksinään noin 9 minuuttia, joten aja se taustalla. Aja ne erissä edustalla, ja käytä tarvittaessa `--output /tmp/pw-out`, jos `test-results` katoaa kesken ajon. Playwright tyhjentää kansion `test-results` ajon alussa, joten älä kirjoita lokia sinne. Aja ne taustalla (`run_in_background`), ja odota tulosta silmukalla, joka lukee lokitiedostoa. Yksittäisen pelin testin voi ajaa erikseen: `npx playwright test tests/e2e/<peli>.spec.ts`.
- Jokaisessa pelinäkymässä on `getTestState()` ja testiapurit (esim. `debugSkip`, `debugHurt`, `debugPlace`). Testit kutsuvat niitä `page.evaluate`-funktiossa. Menun peli valitaan `selectGame(page, id)`-apurilla, eikä sen paikkaa ruudukossa tarvitse tietää.
- Hiiri on käytössä Phaser-asetuksissa (`main.ts`), mutta vain ristikko reagoi siihen. Muut pelit ovat pelkän näppäimistön varassa.
- Animaatiokuvat (`AssetSpec.frames`): `width` ja `height` ovat yhden ruudun koko, ja `draw` saa koko nauhan leveyden (ruutu × määrä). Tasohyppely on ensimmäinen peli, joka käyttää niitä.
- `heldKeys(...).takePress(key)` kertoo yksittäisen painalluksen, vaikka näppäin olisi pohjassa alle yhden ruudunpäivityksen ajan (tasohyppelyn hyppy).
- Vierivä peli (tasohyppely): maailma on omassa `Layer`issa pääkameran alla, ja tilarivi on toisessa `Layer`issa omalla `hud`-kamerallaan, koska `scrollFactor(0)` siirtyy kameran zoomauksessa. Taustakuvat ovat maailmassa `scrollFactor(0)`:lla ja siirroksella `W*(ZOOM-1)/2` (`fixedOffset`).
- Kurpitsalingon rakenne: `levels.ts` (kentät muotoina), `terrain.ts` (tuhoutuva maasto 4 yksikön soluina), `logic.ts` (`Battle`: lento, räjähdykset, aseet, putoaminen, kävely ja pisteet), `assets.ts` ja `PiiritysScene.ts`. Maaston kuva on yksi `CanvasTexture`, johon kuopat poistetaan samoilla ympyröillä kuin soluista.
- Tasohyppelyn rakenne: `levels.ts` (kentät tekstinä), `logic.ts` (kartat, fysiikka, matka, pisteet), `enemies.ts` ja `boss.ts` (käytös ilman Phaseria), `pixel.ts`, `sprites.ts` ja `scenery.ts` (pikselitaide), `TasohyppelyScene.ts` (piirto, kamera, tilarivi). Läpipääsytesti (`logic.test.ts`, `reachableSurfaces`) varmistaa kenttämuutosten jälkeen, että maaliin ja jokaiseen kynttilään pääsee.
- Pohjassa pidettävät näppäimet (esim. liikkuminen) luetaan `heldKeys`-apurilla (`src/ui/input.ts`). Se vapauttaa näppäimet tauon ja ikkunan vaihdon yhteydessä.
- Selaintestit: `npm run e2e` (Playwright, tuotantoversio, 1280 × 720). Ä, Ö ja Å lähetetään synteettisinä näppäintapahtumina. Testiselain piirtää ohjelmallisesti ja hitaasti, joten ajastimiin perustuvat vaiheet (esim. rumpujen pärinä) kestävät testissä pidempään kuin oikeasti. Pausella tai ikkunalla peitetty näkymä jatkuu vasta seuraavassa ruudunpäivityksessä: odota testissä `waitForScene`, ennen kuin painat näppäimiä sille, ja tarkista tulos `waitForState`-odotuksella.
