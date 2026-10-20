# Kuvat

Tämä luettelo tehdään automaattisesti pelin koodista (`npm run kuvalista`), joten älä muokkaa sitä käsin.

Peli piirtää kaikki kuvat itse. Voit korvata minkä tahansa kuvan omalla kuvallasi:

1. Tee kuva esimerkiksi kuvageneraattorilla. Jokaisen kuvan kohdalla on valmis kuvaus, jonka voit antaa generaattorille sellaisenaan.
2. Nimeä tiedosto täsmälleen luettelon mukaan, esimerkiksi `hirsipuu-luuranko-1.png`. Myös .jpg- ja .webp-tiedostot käyvät, kunhan nimen alkuosa on sama.
3. Avaa GitHubissa kansio [`public/assets/`](public/assets/), valitse **Add file → Upload files**, raahaa kuva sivulle ja paina **Commit changes**.
4. Peli päivittyy muutamassa minuutissa. Jos kuva puuttuu tai ei aukea, peli käyttää koodilla piirrettyä kuvaa.

Hyvä tietää:

- Kuvan ei tarvitse olla täsmälleen ilmoitetun kokoinen. Isompi kuva on hyvä, kunhan mittasuhde on suunnilleen sama. Peli sovittaa kuvan paikalleen vääristämättä sitä.
- **Läpinäkyvä tausta** tarkoittaa, että kuvassa on vain itse kohde ja kaikki muu on läpinäkyvää (PNG-tiedosto). Jos generaattori ei osaa tehdä läpinäkyvää taustaa, pyydä yksiväristä taustaa ja kerro siitä Claude Codelle. Taustan voi poistaa jälkikäteen.
- Saman pelin kuvat kannattaa tehdä samalla tyylillä, esimerkiksi samassa keskustelussa generaattorin kanssa.

## Yleiset kuvat

### `yleinen-tausta.png` – Yleinen taustakuva

- **Koko:** 1280 × 720 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, tumma ja tunnelmallinen mutta ei lapsellinen; violetti, musta ja kuunvalon oranssi.

**Kuvaus generaattorille:**

> Yöllinen Halloween-maisema leveänä taustakuvana: tumma violetinmusta tähtitaivas, oikeassa yläkulmassa suuri lämpimänkeltainen täysikuu pehmeine hehkuineen, kaukana matalia kukkuloita, vasemmalla lehdetön kiemurainen puu siluettina, maassa muutama hautakivi ja risti siluetteina ja matala usva maan rajassa. Kuvan keskiosa on rauhallinen ja tumma, koska sen päälle tulee tekstiä ja valikoita. Ei ihmisiä, ei tekstiä, ei tunnettuja hahmoja. Tyyli: Pelkistetty piirroskuva, tumma ja tunnelmallinen mutta ei lapsellinen; violetti, musta ja kuunvalon oranssi. Koko 1280 × 720 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

## Viimeinen sana (hirsipuu)

### `valikko-hirsipuu.png` – Hirsipuun esikatselukuva valikkoon

- **Koko:** 360 × 200 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, tumma violetti yö, luunvalkoinen ja puun ruskea, ei lapsellinen.

**Kuvaus generaattorille:**

> Pieni valikkokuva hirsipuupelille: yöllinen maisema, vasemmalla puinen hirsipuu, jonka köydessä roikkuu luurangon pääkallo, oikealla muutama arvattavan sanan kirjain ja tyhjä viiva. Selkeä ja tunnistettava pienenäkin. Tyyli: Pelkistetty piirroskuva, tumma violetti yö, luunvalkoinen ja puun ruskea, ei lapsellinen. Koko 360 × 200 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `hirsipuu-tausta.png` – Hirsipuun taustakuva

- **Koko:** 1280 × 720 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, tumma ja tunnelmallinen, ei lapsellinen.

**Kuvaus generaattorille:**

> Leveä yöllinen taustakuva hirsipuupeliin: tumma violetti taivas, vasemmalla suuri kalpea kuu, matala kukkula ja kuivaa heinää, maan rajassa ohutta usvaa. Kuvan vasen kolmannes jätetään rauhalliseksi, koska siihen piirretään hirsipuu ja luuranko, ja oikea puolisko tummaksi ja tasaiseksi, koska sen päällä on tekstiä. Älä piirrä kuvaan hirsipuuta, ihmisiä tai tekstiä. Tyyli: Pelkistetty piirroskuva, tumma ja tunnelmallinen, ei lapsellinen. Koko 1280 × 720 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `hirsipuu-teline.png` – Hirsipuu (puinen teline)

- **Koko:** 440 × 560 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, paksut tummat ääriviivat, ruskea puu ja vaalea köysi.

**Kuvaus generaattorille:**

> Vanha puinen hirsipuu sivulta katsottuna: pystypaalu vasemmalla, yläpalkki oikealle, vino tukipuu ja leveä lankkualusta pienen multakummun päällä. Yläpalkin oikeasta päästä roikkuu köysi, jonka päässä on silmukka. Silmukan keskikohta on noin 68 % kuvan leveydestä vasemmalta ja 21 % korkeudesta ylhäältä. Ei luurankoa, ei ihmisiä. Tyyli: Pelkistetty piirroskuva, paksut tummat ääriviivat, ruskea puu ja vaalea köysi. Koko 440 × 560 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `hirsipuu-luuranko-1.png` – Luuranko, osa 1: pääkallo

- **Koko:** 72 × 84 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen.

**Kuvaus generaattorille:**

> Ihmisen pääkallo alaleukoineen, tummat silmäkuopat. Osa 1/8 luurangosta, joka kootaan hirsipuuhun pala kerrallaan. Kuvassa vain tämä yksi osa, suorassa asennossa edestä katsottuna. Tyyli: Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen. Koko 72 × 84 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `hirsipuu-luuranko-2.png` – Luuranko, osa 2: kaula ja selkäranka

- **Koko:** 26 × 150 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen.

**Kuvaus generaattorille:**

> Pystysuora selkäranka kaulanikamista lantioon, nikamat erillisinä palasina. Osa 2/8 luurangosta, joka kootaan hirsipuuhun pala kerrallaan. Kuvassa vain tämä yksi osa, suorassa asennossa edestä katsottuna. Tyyli: Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen. Koko 26 × 150 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `hirsipuu-luuranko-3.png` – Luuranko, osa 3: rintakehä

- **Koko:** 112 × 100 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen.

**Kuvaus generaattorille:**

> Rintakehä: rintalasta ja neljä paria kaarevia kylkiluita, ilman selkärankaa. Osa 3/8 luurangosta, joka kootaan hirsipuuhun pala kerrallaan. Kuvassa vain tämä yksi osa, suorassa asennossa edestä katsottuna. Tyyli: Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen. Koko 112 × 100 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `hirsipuu-luuranko-4.png` – Luuranko, osa 4: lantio

- **Koko:** 100 × 52 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen.

**Kuvaus generaattorille:**

> Lantioluu edestä katsottuna, perhosen muotoinen. Osa 4/8 luurangosta, joka kootaan hirsipuuhun pala kerrallaan. Kuvassa vain tämä yksi osa, suorassa asennossa edestä katsottuna. Tyyli: Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen. Koko 100 × 52 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `hirsipuu-luuranko-5.png` – Luuranko, osa 5: vasen käsivarsi

- **Koko:** 56 × 150 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen.

**Kuvaus generaattorille:**

> Kuvassa vasemmalla puolella oleva käsivarsi: olkaluu, kyynärvarren luut ja luiset sormet, roikkuu alaspäin. Osa 5/8 luurangosta, joka kootaan hirsipuuhun pala kerrallaan. Kuvassa vain tämä yksi osa, suorassa asennossa edestä katsottuna. Tyyli: Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen. Koko 56 × 150 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `hirsipuu-luuranko-6.png` – Luuranko, osa 6: oikea käsivarsi

- **Koko:** 56 × 150 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen.

**Kuvaus generaattorille:**

> Kuvassa oikealla puolella oleva käsivarsi: olkaluu, kyynärvarren luut ja luiset sormet, roikkuu alaspäin. Osa 6/8 luurangosta, joka kootaan hirsipuuhun pala kerrallaan. Kuvassa vain tämä yksi osa, suorassa asennossa edestä katsottuna. Tyyli: Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen. Koko 56 × 150 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `hirsipuu-luuranko-7.png` – Luuranko, osa 7: vasen jalka

- **Koko:** 50 × 124 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen.

**Kuvaus generaattorille:**

> Kuvassa vasemmalla puolella oleva jalka: reisiluu, sääriluu ja jalkaterä, roikkuu alaspäin. Osa 7/8 luurangosta, joka kootaan hirsipuuhun pala kerrallaan. Kuvassa vain tämä yksi osa, suorassa asennossa edestä katsottuna. Tyyli: Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen. Koko 50 × 124 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `hirsipuu-luuranko-8.png` – Luuranko, osa 8: oikea jalka

- **Koko:** 50 × 124 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen.

**Kuvaus generaattorille:**

> Kuvassa oikealla puolella oleva jalka: reisiluu, sääriluu ja jalkaterä, roikkuu alaspäin. Osa 8/8 luurangosta, joka kootaan hirsipuuhun pala kerrallaan. Kuvassa vain tämä yksi osa, suorassa asennossa edestä katsottuna. Tyyli: Pelkistetty piirroskuva, paksut tummat ääriviivat, luunvalkoinen väri ja kevyt varjostus. Kaikki kahdeksan osaa samalla tyylillä ja samassa mittakaavassa, ei lapsellinen. Koko 50 × 124 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

## Enteet (kuva-arvoitukset)

### `valikko-arvoitukset.png` – Kuva-arvoitusten esikatselukuva valikkoon

- **Koko:** 360 × 200 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, tumma violetti, kristallipallon pehmeä hehku, ei lapsellinen.

**Kuvaus generaattorille:**

> Pieni valikkokuva arvoituspelille: pöydällä hehkuva ennustajan kristallipallo, jonka sisällä on iso kysymysmerkki. Ympärillä tummaa ja muutama pieni Halloween-kuvio, kuten lepakko ja kurpitsa. Tyyli: Pelkistetty piirroskuva, tumma violetti, kristallipallon pehmeä hehku, ei lapsellinen. Koko 360 × 200 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `arvoitukset-tausta.png` – Kuva-arvoitusten taustakuva

- **Koko:** 1280 × 720 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, tumma ja tunnelmallinen, ei lapsellinen.

**Kuvaus generaattorille:**

> Leveä taustakuva ennustajan salongista: tumma seinä, jossa haalea kuvioitu tapetti, molemmissa reunoissa tummanpunaiset samettiverhot ja alanurkissa palavat kynttilät. Kuvan keskiosa on tasaisen tumma, koska sen päällä näkyvät arvoitukset ja vastausvaihtoehdot. Ei ihmisiä eikä tekstiä. Tyyli: Pelkistetty piirroskuva, tumma ja tunnelmallinen, ei lapsellinen. Koko 1280 × 720 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `arvoitus-ihmissusi.png` – Kuva-arvoitus: ihminen + susi

- **Koko:** 600 × 280 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät muodot ja paksut ääriviivat, tumma Halloween-tunnelma mutta ei lapsellinen. Kohteet on helppo tunnistaa pienestäkin kuvasta.

**Kuvaus generaattorille:**

> Kuva-arvoitus, jonka vastaus on IHMISSUSI: vasemmalla tavallinen ihminen seisomassa, keskellä iso plusmerkki ja oikealla harmaa susi. Tumma, yksivärinen tausta. Ei tekstiä eikä kirjaimia. Tyyli: Pelkistetty piirroskuva, selkeät muodot ja paksut ääriviivat, tumma Halloween-tunnelma mutta ei lapsellinen. Kohteet on helppo tunnistaa pienestäkin kuvasta. Koko 600 × 280 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `arvoitus-verikuu.png` – Kuva-arvoitus: veripisara + kuu

- **Koko:** 600 × 280 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät muodot ja paksut ääriviivat, tumma Halloween-tunnelma mutta ei lapsellinen. Kohteet on helppo tunnistaa pienestäkin kuvasta.

**Kuvaus generaattorille:**

> Kuva-arvoitus, jonka vastaus on VERIKUU: vasemmalla iso punainen veripisara, keskellä plusmerkki ja oikealla täysikuu. Tumma, yksivärinen tausta. Ei tekstiä eikä kirjaimia. Tyyli: Pelkistetty piirroskuva, selkeät muodot ja paksut ääriviivat, tumma Halloween-tunnelma mutta ei lapsellinen. Kohteet on helppo tunnistaa pienestäkin kuvasta. Koko 600 × 280 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `arvoitus-silmamuna.png` – Kuva-arvoitus: silmä + kananmuna

- **Koko:** 600 × 280 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät muodot ja paksut ääriviivat, tumma Halloween-tunnelma mutta ei lapsellinen. Kohteet on helppo tunnistaa pienestäkin kuvasta.

**Kuvaus generaattorille:**

> Kuva-arvoitus, jonka vastaus on SILMÄMUNA: vasemmalla ihmisen silmä, keskellä plusmerkki ja oikealla valkoinen kananmuna. Tumma, yksivärinen tausta. Ei tekstiä eikä kirjaimia. Tyyli: Pelkistetty piirroskuva, selkeät muodot ja paksut ääriviivat, tumma Halloween-tunnelma mutta ei lapsellinen. Kohteet on helppo tunnistaa pienestäkin kuvasta. Koko 600 × 280 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `arvoitus-hirvi.png` – Kuva-arvoitus: hirvi (peli lisää perään + Ö)

- **Koko:** 420 × 280 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät muodot ja paksut ääriviivat, tumma Halloween-tunnelma mutta ei lapsellinen. Kohteet on helppo tunnistaa pienestäkin kuvasta.

**Kuvaus generaattorille:**

> Kuva-arvoitus, jonka vastaus on HIRVIÖ: komea hirvi isoine sarvineen sivulta katsottuna. Tumma, yksivärinen tausta. Ei tekstiä eikä kirjaimia, sillä peli lisää kuvan perään itse "+ Ö". Tyyli: Pelkistetty piirroskuva, selkeät muodot ja paksut ääriviivat, tumma Halloween-tunnelma mutta ei lapsellinen. Kohteet on helppo tunnistaa pienestäkin kuvasta. Koko 420 × 280 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `arvoitus-kummitusjuna.png` – Kuva-arvoitus: kummitus + juna

- **Koko:** 600 × 280 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät muodot ja paksut ääriviivat, tumma Halloween-tunnelma mutta ei lapsellinen. Kohteet on helppo tunnistaa pienestäkin kuvasta.

**Kuvaus generaattorille:**

> Kuva-arvoitus, jonka vastaus on KUMMITUSJUNA: vasemmalla valkoinen lakanakummitus, keskellä plusmerkki ja oikealla vanha höyryjuna. Tumma, yksivärinen tausta. Ei tekstiä eikä kirjaimia. Tyyli: Pelkistetty piirroskuva, selkeät muodot ja paksut ääriviivat, tumma Halloween-tunnelma mutta ei lapsellinen. Kohteet on helppo tunnistaa pienestäkin kuvasta. Koko 600 × 280 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.
