# Edistyminen

Tämä tiedosto kertoo, mitä on tehty, mikä on kesken ja mitä tehdään seuraavaksi. Claude Code lukee sen jokaisen työrupeaman alussa ja päivittää sen rupeaman lopussa.

**Peli:** https://pasihaverinen90-hash.github.io/Halloween/
**Ilta:** 31.10.2026

## Tilanne

| Vaihe | Tila |
| --- | --- |
| 1. Pohja ja hirsipuu | Valmis, Pasi hyväksyi 20.10. |
| 2. Kuva-arvoitukset | Ei aloitettu |
| 3. Lentopeli | Ei aloitettu |
| 4. Räiskintä | Ei aloitettu |
| 5. Ristikko | Ei aloitettu |
| 6. Tasohyppely | Ei aloitettu |
| 7. Kurpitsalinko | Ei aloitettu |
| 8. Viimeistely | Ei aloitettu (CSV-vienti ja kuvien vaihtaminen tehtiin jo vaiheessa 1) |

## Pasin kanssa sovitut asiat

- **Salasana** tulosnäkymiin ja korjaustilaan on sovittu. Koodissa on vain sen tiiviste (`src/config.ts`), ei itse salasanaa.
- **Hirsipuu:** jo kokeiltu kirjain ei tee mitään eikä vähennä pisteitä.
- **Testipeliä ei tehdä valikkoon.** Kolmen yrityksen kulku testataan automaattisesti näkymättömällä testipelillä (`src/testGame.ts`), joka ei koskaan näy pelaajille.
- **Tasapisteet:** pelaajat jakavat sijan (esimerkiksi 1., 2., 2., 4.).
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

## Aikataulu

Iltaan on 11 päivää, ja jäljellä on kuusi peliä ja viimeistely. Aikataulu on tiukka mutta mahdollinen, jos jokaisesta pelistä saadaan palaute nopeasti. Jos aika alkaa loppua, Pasi päättää, mikä peli jätetään pois tai mitä yksinkertaistetaan.

## Tekninen muistio Claude Codelle

- Rakenne: `src/core` (tulokset, tallennus, pisteet, salasana, varmuuskopiot, äänet), `src/ui` (yhteiset osat ja päällekkäisnäkymät), `src/scenes` (näkymät), `src/games/<id>/` (yksi kansio per peli: `meta.ts`, `assets.ts`, `index.ts`, pelinäkymä, puhdas `logic.ts`), `src/content` (sisältötiedostojen lukijat), `scripts` (sisällön tarkistus, `ASSETS.md`-generaattori).
- Uusi peli: oma kansio ja yksi rivi tiedostoon `src/games/registry.ts`. Pelinäkymä saa `GameContext`in (`finish`, `checkpoint`, `sfx`) eikä tiedä yrityksistä tai tallennuksesta.
- Asetukset (pisteet, aikarajat, vaikeus) kuuluvat tiedostoon `src/config.ts`.
- Kuvien muuttamisen jälkeen aja `npm run kuvalista` (testi varmistaa, että `ASSETS.md` on ajan tasalla).
- Näppäimet aina `onKeys`/`onChar`-apureilla (`src/ui/input.ts`). Käsittelijä palauttaa `false`, jos se ei käyttänyt näppäintä; muuten painallus merkitään käytetyksi kaikissa näkymissä.
- Phaser-sudenkuopat: näkymäolio käytetään uudelleen, joten tila nollataan `init`/`create`-metodeissa. Näkymäluokassa ei saa olla kenttiä nimeltä `data`, `input`, `game` tai `scene`. Tween-animaatiot pysäytetään ennen kohteiden tuhoamista. Pelisilmukka on suojattu poikkeuksilta (`main.ts`).
- Koordinaatit ovat aina 1280 × 720 (`W`, `H`). Isolla näytöllä kangas piirretään kaksinkertaisena, ja kamerat zoomataan automaattisesti.
- Selaintestit: `npm run e2e` (Playwright, tuotantoversio, 1280 × 720). Ä, Ö ja Å lähetetään synteettisinä näppäintapahtumina. Testiselain piirtää ohjelmallisesti ja hitaasti, joten ajastimiin perustuvat vaiheet (esim. rumpujen pärinä) kestävät testissä pidempään kuin oikeasti.
