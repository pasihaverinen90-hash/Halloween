# Pelien sisältö

Tässä kansiossa ovat pelien sanat ja vihjeet. Voit muokata niitä itse suoraan GitHubissa ilman ohjelmointia.

| Tiedosto | Mitä siinä on |
| --- | --- |
| [`hirsipuu.txt`](hirsipuu.txt) | Hirsipuun 5 sanaa tai lausetta ja niiden vihjeet |
| [`kuva-arvoitukset.txt`](kuva-arvoitukset.txt) | Kuva-arvoitukset: turnauksen 11 arvoitusta ja freeplayn lisäarvoitukset |
| [`ristikko.txt`](ristikko.txt) | Ristikon 16–22 sanaa ja niiden vihjeet (nyt 20) sekä varasanoja |

## Näin muokkaat tiedostoa

1. Avaa tiedosto GitHubissa, esimerkiksi [`hirsipuu.txt`](hirsipuu.txt).
2. Paina oikeassa yläkulmassa olevaa kynän kuvaa (**Edit this file**).
3. Tee muutokset. Katso alta, miten tiedosto kirjoitetaan.
4. Paina vihreää painiketta **Commit changes…**. Kirjoita halutessasi lyhyt kuvaus, esimerkiksi "Vaihdoin hirsipuun sanat", ja valitse **Commit directly to the main branch**.
5. Paina vielä kerran **Commit changes**.

Peli julkaistaan automaattisesti uudelleen. Se kestää muutaman minuutin. Voit seurata julkaisua repon **Actions**-välilehdeltä: keltainen pallo tarkoittaa, että julkaisu on käynnissä, ja vihreä ruksi, että se onnistui. Lataa sen jälkeen peli selaimessa uudelleen (F5).

## Näin tiedosto kirjoitetaan

Tiedosto koostuu korteista. Jokainen kortti on yksi sana, ja korttien välissä on yksi tyhjä rivi. Kortin jokainen rivi alkaa sanalla ja kaksoispisteellä:

```
sana: Lepakko
vihje: Siivekäs yölentäjä, joka nukkuu pää alaspäin.

sana: Karkki vai kepponen
vihje: Näin lapset kysyvät ovella Halloween-iltana.
```

- `#`-merkillä alkavat rivit ovat muistiinpanoja, eikä peli lue niitä.
- Isoilla ja pienillä kirjaimilla ei ole väliä. Peli näyttää sanat isoilla kirjaimilla.
- Vihjeessä saa olla kaksoispisteitä ja muita välimerkkejä. Vain rivin ensimmäinen kaksoispiste erottaa sanan `vihje` itse vihjeestä.

### Hirsipuun säännöt

- Sanoja pitää olla **tasan 5**. Ne pelataan tiedoston järjestyksessä, joten aloita helpolla sanalla.
- Sanassa saa olla kirjaimia A–Ö, välilyöntejä ja tavallisia välimerkkejä (- , . ! ? ' : ; ( ) "). Välilyönnit ja välimerkit näkyvät pelaajalle valmiina.
- Numeroita ei voi arvata, joten kirjoita ne kirjaimin.
- Yksi sana saa olla enintään 14 kirjainta, ja koko lauseen pitää mahtua kolmelle riville (noin 40 merkkiä).
- Vihje saa olla enintään 90 merkkiä.

### Kuva-arvoitusten säännöt

Esimerkki kahdesta arvoituksesta:

```
tyyppi: avoin
kuva: arvoitus-halloween.jpg
kysymys: Mikä elokuva?
vastaus: Halloween

tyyppi: avoin
kuva: arvoitus-hohto.jpg
kysymys: Mikä elokuva?
vastaus: Hohto; The Shining; Shining
vain: freeplay
```

- Turnauksen arvoituksia pitää olla **tasan 11**. Lisäksi tiedostossa voi olla kuinka monta tahansa arvoitusta, joissa on rivi `vain: freeplay`. Ne pelataan vain freeplayssä.
- **tyyppi** on `avoin` tai `monivalinta`. Avoimeen pelaaja kirjoittaa vastauksen ja saa yrittää monta kertaa. Monivalinnassa vastataan kerran neljästä vaihtoehdosta. Nyt kaikki arvoitukset ovat avoimia.
- Arvoituksessa on joko **kuva** tai **emojit**.
  - **kuva** on kuvatiedoston nimi kansiossa `public/assets/`, esimerkiksi `arvoitus-halloween.jpg`. Nimen pitää alkaa sanalla `arvoitus-`, ja siinä saa olla vain pieniä kirjaimia, numeroita ja väliviivoja. Pystykuva näytetään ruudun vasemmalla puolella, vaakakuva keskellä. Kuvan perään voi lisätä lyhyen tekstin plusmerkillä, esimerkiksi `arvoitus-hirvi.png + Ö`. Jos kuvaa ei vielä ole, peli näyttää tilalla väliaikaisen kuvan tai tekstin "Kuva puuttuu".
  - **emojit**-riville voi kopioida emojeja esimerkiksi verkosta tai puhelimesta.
- **kysymys** näkyy arvoituksen yläpuolella, ja siihen voi lisätä vihjeen: `kysymys: Mikä sana? Sen löytää huvipuistosta.`
- **vastaus**: avoimeen arvoitukseen voi antaa useita hyväksyttyjä vastauksia puolipisteillä erotettuina. Isoilla ja pienillä kirjaimilla, välilyönneillä, väliviivoilla ja välimerkeillä ei ole väliä. Ä ja A ovat kuitenkin eri kirjaimia.
- **väärät** kuuluu vain monivalintaan: tasan kolme väärää vaihtoehtoa puolipisteillä erotettuina. Vaihtoehtojen järjestys sekoitetaan pelissä, mutta se on kaikille sama.

## Jos tiedostoon jää virhe

Julkaisun yhteydessä tiedosto tarkistetaan automaattisesti. Jos siinä on virhe:

- **Julkaisu pysähtyy, ja peli näyttää edelleen edellistä toimivaa versiota.** Rikkinäinen tiedosto ei siis koskaan päädy pelaajille.
- Actions-välilehdellä näkyy punainen rasti.
- Avaa epäonnistunut ajo ja katso kohta **Summary**. Siellä kerrotaan suomeksi, millä rivillä virhe on ja miten sen voi korjata, esimerkiksi:
  > Rivi 7: kaksoispiste puuttuu. Kirjoita rivi muodossa "avain: teksti", esimerkiksi "vihje: Nukkuu pää alaspäin".
- Korjaa tiedosto samalla tavalla kuin muokkasit sitä. Julkaisu yritetään uudelleen heti, kun tallennat korjauksen.

Jos et saa virhettä korjattua, kerro siitä Claude Codelle. Voit myös palauttaa tiedoston aiemman version GitHubin **History**-näkymästä.

### Ristikon säännöt

Peli tekee ristikon automaattisesti sanoista, joten riittää, että vaihdat sanat ja vihjeet. Kaikki pelaavat saman ristikon.

```
sana: Kalmisto
vihje: Vanha nimi hautausmaalle
```

- Sanoja pitää olla **16–22**. Suositus on 18–20.
- Sana on yksi sana ilman välilyöntejä: vain kirjaimia A–Ö, 3–13 kirjainta.
- Vihje saa olla enintään 60 merkkiä. Peli näyttää vihjeen perässä sanan pituuden.
- Tiedoston lopussa on varasanoja `#`-merkeillä. Voit vaihtaa sanan ottamalla #-merkit pois varasanan riveiltä ja lisäämällä ne poistettavan sanan riveille.
- Jos sanoista ei saada ristikkoa, joka mahtuu ruudulle, julkaisu pysähtyy ja virhe kerrotaan. Silloin vaihda jokin pitkä sana lyhyempään tai sellaiseen, jossa on yleisiä kirjaimia (esimerkiksi A, I, K, L, S, T, U).

