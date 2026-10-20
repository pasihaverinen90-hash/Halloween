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
| 5. Ristikko | Valmis Pasin testattavaksi (20.10.) |
| 6. Tasohyppely | Ei aloitettu |
| 7. Kurpitsalinko | Ei aloitettu |
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
- **Ristikko (Pasi 20.10.):** Välilyönti vaihtaa suuntaa, ja nuoli ristisuuntaan kääntää ensin suunnan. Enter kahdesti paljastaa kirjaimen (−5 s). Ristikossa on 18–20 sanaa (nyt 20 Pasin listasta, loput varasanoina tiedostossa). Täydet 400 aikapistettä saa, kun ratkaisee alle 3 minuutissa, ja sen jälkeen pisteet vähenevät tasaisesti nollaan 10 minuutin kohdalla. Kokonaan paljastettu sana ei tuo sanapisteitä, mutta sana, johon on itse kirjoitettu vähintään yksi kirjain, tuo. Kun aika loppuu, ratkaisematta jääneet kirjaimet näytetään punaisina. Valmiin sanan jälkeen kohdistin siirtyy seuraavaan sanaan. Hiirellä voi valita ruudun tai vihjeen (poikkeus CLAUDE.md:n "ei hiirtä" -periaatteeseen, ja näppäimistö riittää edelleen). Tab-hyppyä ei tehty.
- **Enteet (Pasi 20.10.):** vastausaika 12 s. Täydet 100 pistettä saa 5 sekunnin sisällä, ja sen jälkeen pisteet laskevat tasaisesti nollaan.
- **Täydellinen tulos päättää pelin (Pasi 20.10.):** kun toimintapelin yrityksestä tulee 1000 pistettä, loput yritykset jäävät väliin. Koskee kaikkia toimintapelejä.
- **Kuva-arvoitukset:** 5 kuva-arvoitusta (Pasi tekee kuvat, yksi kuva per arvoitus) ja 5 emojiarvoitusta (Claude Code). Kuva-arvoitukset: hirviö, ihmissusi, verikuu, silmämuna ja kummitusjuna. Arvoitukseen saa lisätä vihjeen (kohta `kysymys`). Ensimmäiset versiot tehdään nyt, ja niitä muokataan myöhemmin.
- **GitHub Pages** on päällä (Source: GitHub Actions), Pasi kytki sen 19.10.2026.

## Claude Coden tekemät ratkaisut (Pasi voi muuttaa)

- **Pelien väliaikaiset nimet:** 1. Viimeinen sana (hirsipuu). Ehdotukset seuraaville: 2. Enteet (kuva-arvoitukset), 3. Yölento (lentopeli), 4. Kiirastuli (räiskintä), 5. Kalmanristikko (ristikko), 6. Verikuu (tasohyppely), 7. Piiritys (kurpitsalinko).
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

Kesken:
- Pasi testaa ristikon.

Seuraavaksi:
- Vaihe 6, tasohyppely, kun Pasi hyväksyy ristikon. Kysy ensin reilusti kysymyksiä (Pasin toive 20.10.).

## Aikataulu

Iltaan on 11 päivää, ja jäljellä on kaksi peliä (tasohyppely ja kurpitsalinko) sekä viimeistely. Aikataulu on tiukka mutta mahdollinen, jos jokaisesta pelistä saadaan palaute nopeasti. Jos aika alkaa loppua, Pasi päättää, mikä peli jätetään pois tai mitä yksinkertaistetaan.

**Illan kesto:** kaikki pelaavat samalla koneella vuorotellen. Arvio yhden pelaajan koko vuorosta on 45–70 minuuttia (räiskintä enintään noin 12 minuuttia, ristikko 10, tasohyppely 3 yritystä × noin 6 minuuttia). Kahdeksalla pelaajalla vuorot kestävät siis useita tunteja. Pasille kerrottu 20.10.

## Tekninen muistio Claude Codelle

- Rakenne: `src/core` (tulokset, tallennus, pisteet, salasana, varmuuskopiot, äänet), `src/ui` (yhteiset osat ja päällekkäisnäkymät), `src/scenes` (näkymät), `src/games/<id>/` (yksi kansio per peli: `meta.ts`, `assets.ts`, `index.ts`, pelinäkymä, puhdas `logic.ts`), `src/content` (sisältötiedostojen lukijat), `scripts` (sisällön tarkistus, `ASSETS.md`-generaattori).
- Uusi peli: oma kansio ja yksi rivi tiedostoon `src/games/registry.ts`. Emojeja käyttävä peli listaa ne kentässä `preloadText` (fontti ladataan ennen alkua). Pelinäkymä saa `GameContext`in (`finish`, `checkpoint`, `sfx`) eikä tiedä yrityksistä tai tallennuksesta.
- Asetukset (pisteet, aikarajat, vaikeus) kuuluvat tiedostoon `src/config.ts`.
- Kuvien muuttamisen jälkeen aja `npm run kuvalista` (testi varmistaa, että `ASSETS.md` on ajan tasalla).
- Näppäimet aina `onKeys`/`onChar`-apureilla (`src/ui/input.ts`). Käsittelijä palauttaa `false`, jos se ei käyttänyt näppäintä; muuten painallus merkitään käytetyksi kaikissa näkymissä.
- Phaser-sudenkuopat: näkymäolio käytetään uudelleen, joten tila nollataan `init`/`create`-metodeissa. Näkymäluokassa ei saa olla kenttiä nimeltä `data`, `input`, `game` tai `scene`. Tween-animaatiot pysäytetään ennen kohteiden tuhoamista. Pelisilmukka on suojattu poikkeuksilta (`main.ts`).
- Koordinaatit ovat aina 1280 × 720 (`W`, `H`). Isolla näytöllä kangas piirretään kaksinkertaisena, ja kamerat zoomataan automaattisesti.
- Selaintestit: `npm run e2e` (Playwright, tuotantoversio, 1280 × 720). Ä, Ö ja Å lähetetään synteettisinä näppäintapahtumina. Testiselain piirtää ohjelmallisesti ja hitaasti, joten ajastimiin perustuvat vaiheet (esim. rumpujen pärinä) kestävät testissä pidempään kuin oikeasti. Pausella tai ikkunalla peitetty näkymä jatkuu vasta seuraavassa ruudunpäivityksessä: odota testissä `waitForScene`, ennen kuin painat näppäimiä sille, ja tarkista tulos `waitForState`-odotuksella.
