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

## Yölento (lentopeli)

### `valikko-lentopeli.png` – Lentopelin esikatselukuva valikkoon

- **Koko:** 360 × 200 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pieni valikkokuva lentopelille: noita lentää luudalla yötaivaalla kohti aukkoa, jonka yläpuolella roikkuu häkki ja alapuolella seisoo kaapuun pukeutunut inkvisiittori soihtu kädessä. Oikealta lentää vastaan pari lepakkoa. Täysikuu taustalla. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 360 × 200 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `lentopeli-tausta.png` – Lentopelin taivas

- **Koko:** 1280 × 720 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Leveä yötaivas: tummanvioletti liukuväri, tähtiä ja oikealla ylhäällä suuri täysikuu hehkuineen. Ei maata, ei rakennuksia, ei tekstiä. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1280 × 720 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `lentopeli-kaukaiset.png` – Kaukaiset kukkulat, linna ja kirkko

- **Koko:** 1280 × 260 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Kaukaisia kukkuloita siluettina, niillä pieni linna torneineen ja kirkko suippoine torneineen. Kuva toistuu vaakasuunnassa saumattomasti: vasen ja oikea reuna jatkuvat toisiinsa. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1280 × 260 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `lentopeli-maa.png` – Maa

- **Koko:** 1280 × 80 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Kapea tumma maakaistale, jossa kuivaa heinää ja muutama pieni hautakivi. Kuva toistuu vaakasuunnassa saumattomasti. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1280 × 80 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `lentopeli-noita.png` – Noita luudalla

- **Koko:** 150 × 100 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Noita lentää luudalla oikealle: suippo musta hattu, violetti viitta liehuu, oranssit hiukset, vaaleanvihreät kasvot. Ystävällinen mutta ei lapsellinen. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 150 × 100 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `lentopeli-kissa.png` – Musta kissa

- **Koko:** 70 × 60 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Istuva musta kissa keltaisin silmin ja kiemuraisella hännällä, sivulta katsottuna. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 70 × 60 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `lentopeli-inkvisiittori.png` – Inkvisiittori

- **Koko:** 100 × 150 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Keksitty keskiaikainen noitavainoaja: tummanpunainen kaapu, suippo huppu jonka alta näkyvät vain hehkuvat silmät, palava soihtu kädessä, seisoo edestä katsottuna. Ei oikea henkilö. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 100 × 150 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `lentopeli-pylvas.png` – Kivipylväs (pala)

- **Koko:** 80 × 100 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pala harmaata kivipylvästä edestä katsottuna, tiilimäiset kivet. Kuva toistuu pystysuunnassa saumattomasti: ylä- ja alareuna jatkuvat toisiinsa. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 80 × 100 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `lentopeli-hakki.png` – Riippuva häkki

- **Koko:** 96 × 120 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Ruosteinen rautahäkki, joka roikkuu ylhäältä, sisällä lepakko. Edestä katsottuna. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 96 × 120 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `lentopeli-ketju.png` – Ketju (pala)

- **Koko:** 28 × 56 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pala pystysuoraa rautaketjua. Kuva toistuu pystysuunnassa saumattomasti. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 28 × 56 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `lentopeli-lepakko.png` – Lepakko

- **Koko:** 84 × 56 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Lepakko lentää suoraan katsojaa kohti siivet levällään: tumma violetti siipikalvo, jonka alareuna on aaltoileva, pienet terävät korvat ja hehkuvat oranssit silmät. Ohut vaalea ääriviiva erottaa sen yötaivaasta. Peli heiluttaa siipiä itse, joten yksi kuva riittää. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 84 × 56 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `lentopeli-maali.png` – Maali: maaginen portti

- **Koko:** 240 × 560 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Korkea kivinen kaariportti, jonka keskellä hehkuu violetti taikaportaali. Portin juurella kaksi kurpitsalyhtyä. Edestä katsottuna. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 240 × 560 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

## Kiirastuli (räiskintä)

### `valikko-raiskinta.png` – Räiskinnän esikatselukuva valikkoon

- **Koko:** 360 × 200 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pieni valikkokuva räiskintäpelille: ylhäältä päin nähty yöllinen hautausmaa, alalaidassa valkoasuinen paavihahmo kultaisen paimensauvan kanssa ampuu valonsäteitä ylöspäin, ylhäällä aaveita, lentävä kurpitsalyhty, lepakko, luuranko, pikkupiru ja viikatemies, keskellä ylhäällä uhkaava sarvipäinen Paholainen. Keksitty hahmo, ei oikea paavi. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 360 × 200 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `raiskinta-hautausmaa.png` – Hautausmaa ylhäältä päin

- **Koko:** 1280 × 720 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Yöllinen hautausmaa vinosti ylhäältä päin nähtynä: tumma ruoho, mutkitteleva kivipolku keskellä, hautakiviä, ristejä ja hautakumpuja riveissä, ohutta usvaa. Kuva toistuu pystysuunnassa saumattomasti: ylä- ja alareuna jatkuvat toisiinsa. Ei hahmoja. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1280 × 720 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `raiskinta-paavi.png` – Paavi

- **Koko:** 90 × 110 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Keksitty, hyväntahtoinen paavihahmo edestä: valkoinen kaapu kultaisella raidalla, punainen olkaviitta, korkea valkoinen hiippa jossa kultainen risti, punaiset posket, kädessä kultainen paimensauva jonka kärki hehkuu. Ei mikään oikea paavi. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 90 × 110 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-haamu.png` – Aave

- **Koko:** 64 × 70 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Valkoinen lakanamainen aave mustin silmin ja avoimin suin, aaltoileva helma, kylmä sininen hehku. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 64 × 70 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-lepakko.png` – Lepakko

- **Koko:** 70 × 46 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Lepakko lentää suoraan katsojaa kohti siivet levällään: tumma violetti siipikalvo, aaltoileva alareuna, pienet terävät korvat ja hehkuvat oranssit silmät. Ohut vaalea ääriviiva. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 70 × 46 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-kurpitsa.png` – Lentävä kurpitsalyhty

- **Koko:** 70 × 64 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Oranssi kurpitsalyhty, jonka kaiverretut kasvot hehkuvat keltaisina ja jolla on pienet tummat lepakonsiivet. Ilkikurinen ilme. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 70 × 64 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-luuranko.png` – Luuranko

- **Koko:** 56 × 70 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Luuranko edestä kädet ylhäällä ja jalat harallaan, punaisina hehkuvat silmäkuopat, luunvalkoinen. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 56 × 70 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-piru.png` – Pikkupiru

- **Koko:** 60 × 56 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pieni tumma violetinmusta piru: lepakonsiivet, pienet vaaleat sarvet, vihreinä hehkuvat silmät, ilkikurinen virne ja kiemurainen häntä. Eri hahmo kuin iso Paholainen. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 60 × 56 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-viikatemies.png` – Viikatemies

- **Koko:** 90 × 110 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Viikatemies edestä: musta huppukaapu repaleisella helmalla, hupun varjossa pääkallo violetein hehkuvin silmin, luinen käsi pitää viikatetta jonka terä on hopeinen. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 90 × 110 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-liitonarkku.png` – Liitonarkku

- **Koko:** 110 × 72 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Kultainen arkku, jonka sivuilla kantotangot ja kannella kaksi siivekästä kultaista hahmoa vastakkain, ympärillä lämmin hehku. Yksinkertainen oma tulkinta. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 110 × 72 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-malja.png` – Pyhä malja

- **Koko:** 60 × 76 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Kultainen malja jalokivin, ympärillä säteilevä valo. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 60 × 76 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-paholainen.png` – Paholainen (loppuvastus)

- **Koko:** 260 × 240 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Keksitty uhkaava Paholainen edestä: punainen iho, suuret kaartuvat sarvet, keltaisina hehkuvat silmät, ilkeä virne torahampain, suippo musta parta, levitetyt lepakonsiivet ja kolmikärkinen hanko kädessä. Pelottava mutta ei verinen. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 260 × 240 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-valo.png` – Paavin valonsäde

- **Koko:** 14 × 34 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pystysuora kirkas valonsäde: valkoinen kärki, kultainen hehku joka häipyy alaspäin. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 14 × 34 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-tulipallo.png` – Tulipallo

- **Koko:** 28 × 28 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pyöreä tulipallo: keltainen keskus, oranssi ja punainen reuna, pehmeä hehku. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 28 × 28 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-luu.png` – Heitetty luu

- **Koko:** 32 × 14 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pieni luunvalkoinen luu vaakasuunnassa, nuppimaiset päät. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 32 × 14 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-kirous.png` – Kirouspallo

- **Koko:** 24 × 24 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pyöreä violetti energiapallo: vaalea keskus, tumma violetti reuna, pehmeä hehku. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 24 × 24 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-boosti-tuli.png` – Boosti: nopea tuli

- **Koko:** 48 × 48 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pyöreä punainen merkki, jossa keltainen salama. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 48 × 48 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-boosti-haja.png` – Boosti: hajaammus

- **Koko:** 48 × 48 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pyöreä sininen merkki, jossa kolme vaaleaa sädettä viuhkana. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 48 × 48 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-boosti-suoja.png` – Boosti: suojakehä

- **Koko:** 48 × 48 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pyöreä violetti merkki, jossa kultainen sädekehä. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 48 × 48 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-suojakeha.png` – Suojakehä

- **Koko:** 130 × 140 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Läpikuultava kultainen valorengas, joka ympäröi hahmon. Keskusta läpinäkyvä. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 130 × 140 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-suojapallo.png` – Suojapallo

- **Koko:** 28 × 28 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pieni kultainen valopallo, jonka keskellä on risti, ympärillä lämmin hehku. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 28 × 28 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-pyhavesi.png` – Pyhä vesi

- **Koko:** 32 × 42 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pyöreä lasipullo, jossa on kirkkaan sinistä vettä, korkki ja kultainen risti kyljessä, ympärillä sininen hehku. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 32 × 42 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `raiskinta-kesto.png` – Kestopiste (pieni risti)

- **Koko:** 22 × 26 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pieni kultainen risti mustalla ääriviivalla. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 22 × 26 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

## Kalmanristikko (ristikko)

### `valikko-ristikko.png` – Ristikon esikatselukuva valikkoon

- **Koko:** 360 × 200 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pieni valikkokuva ristikkopelille: tummalla taustalla pala vanhan paperin värisiä ristikkoruutuja, joissa on kirjaimia, nurkassa hämähäkinseitti ja langassa roikkuva hämähäkki. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 360 × 200 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `ristikko-tausta.png` – Ristikon tausta

- **Koko:** 1280 × 720 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Hämärä vanha työhuone: tumma violetti seinä, hämähäkinseitit yläkulmissa, oikeassa yläkulmassa langassa roikkuva hämähäkki ja alakulmissa palavat kynttilät. Keskiosa on rauhallinen, koska ristikko ja vihjeet piirretään sen päälle. Ei tekstiä. Tyyli: Pelkistetty piirroskuva, selkeät ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1280 × 720 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

## MonsterSlayer3000 (tasohyppely)

### `tasohyppely-esikatselu.png` – Valikon esikatselukuva

- **Koko:** 360 × 200 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Vampyyrimetsästäjä lyö ruoskalla zombia kuutamoisella hautausmaalla, kynttilä palaa taustalla. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 360 × 200 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `tasohyppely-metsastaja.png` – Vampyyrimetsästäjä

- **Koko:** 72 × 96 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 11 kuvaa vierekkäin vasemmalta oikealle: seisoo, juoksee 1, juoksee 2, juoksee 3, hyppää, kyykistyy, nostaa ruoskan, lyö, lyö kyykyssä, lyö ylöspäin, saa osuman

**Kuvaus generaattorille:**

> Pelin sankari: vampyyrimetsästäjä, jolla on valkoinen tukka, pitkä tummanpunainen takki, harmaa kaulahuivi, tummat housut ja ruskeat nahkasaappaat. Ruoskaa ei piirretä kuvaan, sillä peli piirtää sen erikseen. Hahmo katsoo oikealle. Kaikki ruudut ovat samankokoisia, ja hahmon jalat ovat ruudun alareunassa. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 11 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (seisoo, juoksee 1, juoksee 2, juoksee 3, hyppää, kyykistyy, nostaa ruoskan, lyö, lyö kyykyssä, lyö ylöspäin, saa osuman). Yksi ruutu on 72 × 96 pikseliä, koko kuva 792 × 96 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-ruoska.png` – Ruoska

- **Koko:** 168 × 24 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 5 kuvaa vierekkäin vasemmalta oikealle: nahkaruoska, piikkiketju, hopearuoska, liekehtivä ruoska, salamaruoska

**Kuvaus generaattorille:**

> Ojennettu ruoska sivulta, kahvan pää vasemmassa reunassa keskellä. Viisi tasoa lyhimmästä pisimpään: nahkaruoska, piikkiketju, hopearuoska, liekehtivä ruoska ja salamaruoska. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 5 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (nahkaruoska, piikkiketju, hopearuoska, liekehtivä ruoska, salamaruoska). Yksi ruutu on 168 × 24 pikseliä, koko kuva 840 × 24 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-zombi.png` – Zombi

- **Koko:** 48 × 96 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 2 kuvaa vierekkäin vasemmalta oikealle: kävely 1, kävely 2

**Kuvaus generaattorille:**

> Laahustava zombi, harmaanvihreä iho, repaleiset vaatteet, kädet ojossa. Hahmo katsoo oikealle. Kaikki ruudut ovat samankokoisia, ja hahmon jalat ovat ruudun alareunassa. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 2 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (kävely 1, kävely 2). Yksi ruutu on 48 × 96 pikseliä, koko kuva 96 × 96 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-lepakko.png` – Lepakko

- **Koko:** 48 × 36 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 3 kuvaa vierekkäin vasemmalta oikealle: roikkuu siivet suljettuina, siivet ylhäällä, siivet alhaalla

**Kuvaus generaattorille:**

> Tumma lepakko punaisin silmin. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 3 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (roikkuu siivet suljettuina, siivet ylhäällä, siivet alhaalla). Yksi ruutu on 48 × 36 pikseliä, koko kuva 144 × 36 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-korppi.png` – Korppi

- **Koko:** 48 × 42 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 3 kuvaa vierekkäin vasemmalta oikealle: istuu, siivet ylhäällä, siivet alhaalla

**Kuvaus generaattorille:**

> Musta korppi keltaisella nokalla, katsoo oikealle. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 3 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (istuu, siivet ylhäällä, siivet alhaalla). Yksi ruutu on 48 × 42 pikseliä, koko kuva 144 × 42 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-haarniska.png` – Haarniska

- **Koko:** 60 × 96 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 3 kuvaa vierekkäin vasemmalta oikealle: kävely 1, kävely 2, kirves nostettuna heittoon

**Kuvaus generaattorille:**

> Tyhjä, liikkuva ritarihaarniska, jossa on punainen kypäräntöyhtö ja kirves. Hahmo katsoo oikealle. Kaikki ruudut ovat samankokoisia, ja hahmon jalat ovat ruudun alareunassa. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 3 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (kävely 1, kävely 2, kirves nostettuna heittoon). Yksi ruutu on 60 × 96 pikseliä, koko kuva 180 × 96 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-kirves.png` – Kirves

- **Koko:** 30 × 30 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Heitetty pieni kirves (peli pyörittää sitä). Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 30 × 30 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-kallo.png` – Liekehtivä kallo

- **Koko:** 48 × 48 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 2 kuvaa vierekkäin vasemmalta oikealle: liekit 1, liekit 2

**Kuvaus generaattorille:**

> Lentävä pääkallo, jonka perässä liekit loimuavat vasemmalle. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 2 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (liekit 1, liekit 2). Yksi ruutu on 48 × 48 pikseliä, koko kuva 96 × 48 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-hamahakki.png` – Hämähäkki

- **Koko:** 42 × 36 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 2 kuvaa vierekkäin vasemmalta oikealle: jalat 1, jalat 2

**Kuvaus generaattorille:**

> Iso musta hämähäkki ylhäältä päin, punainen merkki selässä. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 2 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (jalat 1, jalat 2). Yksi ruutu on 42 × 36 pikseliä, koko kuva 84 × 36 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-virvatuli.png` – Virvatuli

- **Koko:** 36 × 36 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 2 kuvaa vierekkäin vasemmalta oikealle: hehku 1, hehku 2

**Kuvaus generaattorille:**

> Leijuva kylmä virvatuli, turkoosi hehku ja valkoinen ydin. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 2 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (hehku 1, hehku 2). Yksi ruutu on 36 × 36 pikseliä, koko kuva 72 × 36 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-sieni.png` – Myrkkysieni

- **Koko:** 48 × 48 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 2 kuvaa vierekkäin vasemmalta oikealle: paikallaan, puhaltaa itiöitä

**Kuvaus generaattorille:**

> Vihainen myrkkysieni, violetti lakki ja vihreät pilkut. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 2 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (paikallaan, puhaltaa itiöitä). Yksi ruutu on 48 × 48 pikseliä, koko kuva 96 × 48 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-itio.png` – Itiö

- **Koko:** 18 × 18 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Pieni hehkuvan vihreä myrkkyitiö. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 18 × 18 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-susi.png` – Susi

- **Koko:** 78 × 48 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 3 kuvaa vierekkäin vasemmalta oikealle: istuu ja ulvoo, juoksee 1, juoksee 2

**Kuvaus generaattorille:**

> Tummanharmaa susi keltaisin silmin, katsoo oikealle. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 3 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (istuu ja ulvoo, juoksee 1, juoksee 2). Yksi ruutu on 78 × 48 pikseliä, koko kuva 234 × 48 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-luuranko.png` – Luuranko

- **Koko:** 48 × 96 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 2 kuvaa vierekkäin vasemmalta oikealle: kävely 1, kävely 2

**Kuvaus generaattorille:**

> Maasta noussut luuranko, kädet ojossa. Hahmo katsoo oikealle. Kaikki ruudut ovat samankokoisia, ja hahmon jalat ovat ruudun alareunassa. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 2 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (kävely 1, kävely 2). Yksi ruutu on 48 × 96 pikseliä, koko kuva 96 × 96 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-paanoita.png` – Päänoita

- **Koko:** 96 × 96 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 4 kuvaa vierekkäin vasemmalta oikealle: lento 1, lento 2, loitsii käsi ylhäällä, saa osuman

**Kuvaus generaattorille:**

> Pelin loppuvastus: vanha päänoita lentää luudalla. Musta suippo hattu, violetti kaapu, harmaa tukka, vihertävä iho ja punaiset silmät. Katsoo oikealle. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 4 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (lento 1, lento 2, loitsii käsi ylhäällä, saa osuman). Yksi ruutu on 96 × 96 pikseliä, koko kuva 384 × 96 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-taikapallo.png` – Taikapallo

- **Koko:** 24 × 24 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 2 kuvaa vierekkäin vasemmalta oikealle: sykkii 1, sykkii 2

**Kuvaus generaattorille:**

> Hehkuva violetti taikapallo. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 2 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (sykkii 1, sykkii 2). Yksi ruutu on 24 × 24 pikseliä, koko kuva 48 × 24 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-kynttila.png` – Kynttilä

- **Koko:** 24 × 48 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 2 kuvaa vierekkäin vasemmalta oikealle: liekki 1, liekki 2

**Kuvaus generaattorille:**

> Palava kynttilä rautaisella jalustalla. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 2 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (liekki 1, liekki 2). Yksi ruutu on 24 × 48 pikseliä, koko kuva 48 × 48 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-sydan-esine.png` – Puolikas sydän

- **Koko:** 24 × 24 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Puolikas punainen sydän (vasen puolisko), kerättävä esine. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 24 × 24 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-ruoska-esine.png` – Ruoskan päivitys

- **Koko:** 30 × 30 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Kerällä oleva kultainen ruoska, kerättävä esine. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 30 × 30 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-tikari.png` – Heitettävä tikari

- **Koko:** 30 × 12 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Lentävä heittotikari sivulta, kärki oikealle. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 30 × 12 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-tikarit-esine.png` – Tikarinippu

- **Koko:** 30 × 30 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Viuhkaksi aseteltu nippu heittotikareita, kerättävä esine. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 30 × 30 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-kolikko.png` – Kolikko

- **Koko:** 24 × 24 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Kiiltävä kultakolikko, jonka saa jokaisesta kynttilästä. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 24 × 24 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-sydan.png` – Sydän tilarivillä

- **Koko:** 30 × 27 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 3 kuvaa vierekkäin vasemmalta oikealle: täysi, puolikas, tyhjä

**Kuvaus generaattorille:**

> Pieni sydän, joka näyttää jäljellä olevat health-pisteet. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 3 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (täysi, puolikas, tyhjä). Yksi ruutu on 30 × 27 pikseliä, koko kuva 90 × 27 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-heilurin-tera.png` – Heilurin terä

- **Koko:** 72 × 48 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Kuunsirpin muotoinen terästerä, kiinnityslenkki ylhäällä keskellä. Peli piirtää tangon. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 72 × 48 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-portti.png` – Kentän maaliportti

- **Koko:** 96 × 144 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Goottilainen kivikaari, jonka rautaovien raoista hohtaa lämmin valo. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 96 × 144 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-palat-hautausmaa.png` – Maaston palat: hautausmaa

- **Koko:** 48 × 48 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 6 kuvaa vierekkäin vasemmalta oikealle: pinta, sisus, taso, sortuva lattia, liikkuva taso vasen, liikkuva taso oikea

**Kuvaus generaattorille:**

> Maaston ruudut, jotka toistuvat saumattomasti vierekkäin. Hautausmaan multaa: pinta, jossa on ruohoa, multaa sisältä (kiviä ja luita), kivilaatta, halkeillut kivi, joka sortuu, ja puinen lankku. Taso, liikkuvan tason puolikkaat ja pinta ovat ruudun yläreunassa. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 6 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (pinta, sisus, taso, sortuva lattia, liikkuva taso vasen, liikkuva taso oikea). Yksi ruutu on 48 × 48 pikseliä, koko kuva 288 × 48 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-taivas-hautausmaa.png` – Taivas: hautausmaa

- **Koko:** 1280 × 720 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Violetti yötaivas, iso vaalea täysikuu oikealla ylhäällä ja tähtiä. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1280 × 720 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `tasohyppely-maisema-hautausmaa.png` – Kaukainen maisema: hautausmaa

- **Koko:** 1280 × 400 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Kaukaisia kumpuja, pieni kappeli kukkulalla, kuolleita puita ja ristejä tummina siluetteina. Kuvan vasen ja oikea reuna jatkuvat saumattomasti toisiinsa, koska kuva toistuu sivuttain. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1280 × 400 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-koriste-hautausmaa.png` – Koristeet: hautausmaa

- **Koko:** 48 × 96 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 4 kuvaa vierekkäin vasemmalta oikealle: hautakivi, risti, kurpitsalyhty, kuollut pensas

**Kuvaus generaattorille:**

> Pieniä koristeita, jotka seisovat maassa (ruudun alareunassa). Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 4 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (hautakivi, risti, kurpitsalyhty, kuollut pensas). Yksi ruutu on 48 × 96 pikseliä, koko kuva 192 × 96 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-palat-linna.png` – Maaston palat: linna

- **Koko:** 48 × 48 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 6 kuvaa vierekkäin vasemmalta oikealle: pinta, sisus, taso, sortuva lattia, liikkuva taso vasen, liikkuva taso oikea

**Kuvaus generaattorille:**

> Maaston ruudut, jotka toistuvat saumattomasti vierekkäin. Linnan kivitiiliä: pinta, tiilet sisältä, puinen palkki, halkeillut tiili, joka sortuu, ja rautaritilä. Taso, liikkuvan tason puolikkaat ja pinta ovat ruudun yläreunassa. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 6 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (pinta, sisus, taso, sortuva lattia, liikkuva taso vasen, liikkuva taso oikea). Yksi ruutu on 48 × 48 pikseliä, koko kuva 288 × 48 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-taivas-linna.png` – Taivas: linna

- **Koko:** 1280 × 720 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Tumma yötaivas ja punainen verikuu vasemmalla ylhäällä. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1280 × 720 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `tasohyppely-maisema-linna.png` – Kaukainen maisema: linna

- **Koko:** 1280 × 720 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Linnan sisäseinä: tummaa kiveä, pylväitä, korkeita kuunvalaisia ikkunoita ja punaisia viirejä. Kuvan vasen ja oikea reuna jatkuvat saumattomasti toisiinsa, koska kuva toistuu sivuttain. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1280 × 720 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-koriste-linna.png` – Koristeet: linna

- **Koko:** 48 × 96 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 4 kuvaa vierekkäin vasemmalta oikealle: kallokasa, rikkinäinen pylväs, ketjut, kivipatsas

**Kuvaus generaattorille:**

> Pieniä koristeita, jotka seisovat maassa (ruudun alareunassa). Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 4 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (kallokasa, rikkinäinen pylväs, ketjut, kivipatsas). Yksi ruutu on 48 × 96 pikseliä, koko kuva 192 × 96 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-palat-metsa.png` – Maaston palat: noidan metsä

- **Koko:** 48 × 48 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 6 kuvaa vierekkäin vasemmalta oikealle: pinta, sisus, taso, sortuva lattia, liikkuva taso vasen, liikkuva taso oikea

**Kuvaus generaattorille:**

> Maaston ruudut, jotka toistuvat saumattomasti vierekkäin. Metsän maata: sammaleinen pinta, multaa ja juuria, oksa, laho tukki, joka sortuu, ja sammaloitunut kivilaatta. Taso, liikkuvan tason puolikkaat ja pinta ovat ruudun yläreunassa. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 6 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (pinta, sisus, taso, sortuva lattia, liikkuva taso vasen, liikkuva taso oikea). Yksi ruutu on 48 × 48 pikseliä, koko kuva 288 × 48 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-taivas-metsa.png` – Taivas: noidan metsä

- **Koko:** 1280 × 720 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Tummanvihreä yötaivas, utuinen kuu oikealla ylhäällä ja sumua alhaalla. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1280 × 720 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `tasohyppely-maisema-metsa.png` – Kaukainen maisema: noidan metsä

- **Koko:** 1280 × 420 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Tiheän noitametsän puunrunkoja ja oksia tummina siluetteina, välissä tulikärpäsiä. Kuvan vasen ja oikea reuna jatkuvat saumattomasti toisiinsa, koska kuva toistuu sivuttain. Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1280 × 420 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `tasohyppely-koriste-metsa.png` – Koristeet: noidan metsä

- **Koko:** 48 × 96 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 4 kuvaa vierekkäin vasemmalta oikealle: saniainen, kanto ja sieniä, pensas, sammaloitunut kivi

**Kuvaus generaattorille:**

> Pieniä koristeita, jotka seisovat maassa (ruudun alareunassa). Tyyli: Pikselitaide 90-luvun konsolipelin tyyliin, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 4 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (saniainen, kanto ja sieniä, pensas, sammaloitunut kivi). Yksi ruutu on 48 × 96 pikseliä, koko kuva 192 × 96 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

## Piiritys (kurpitsalinko)

### `piiritys-esikatselu.png` – Valikon esikatselukuva

- **Koko:** 360 × 200 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Katapultti heittää kurpitsan kohti linnan muurilla seisovaa luurankoa yöllä. Tyyli: Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 360 × 200 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `piiritys-taivas.png` – Taivas ja luurankolinna

- **Koko:** 1920 × 1140 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Yötaivas, iso kuu oikealla ylhäällä ja luurankolinnan siluetti kaukana horisontissa kuvan alaosassa. Kuva on kentän levyinen. Tyyli: Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1920 × 1140 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `piiritys-holvi.png` – Hautaholvin tausta

- **Koko:** 1920 × 720 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Hautaholvin tumma kiviseinä ja palavia soihtuja. Vasen reuna on avoin yö. Tyyli: Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 1920 × 720 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `piiritys-maa.png` – Maa (toistuva kuvio)

- **Koko:** 128 × 128 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Tummaa multaa ja kiviä, kuvio toistuu saumattomasti joka suuntaan. Tyyli: Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 128 × 128 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `piiritys-kivi.png` – Kivi (toistuva kuvio)

- **Koko:** 128 × 128 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Linnan kivitiiliä, kuvio toistuu saumattomasti joka suuntaan. Tyyli: Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 128 × 128 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `piiritys-puu.png` – Puu (toistuva kuvio)

- **Koko:** 128 × 32 px
- **Tausta:** ei läpinäkyvyyttä, kuva täyttää koko alueen
- **Tyyli:** Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Vaakasuoria puulankkuja nauloineen, kuvio toistuu saumattomasti joka suuntaan. Tyyli: Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 128 × 32 pikseliä. Kuva täyttää koko alueen, ei läpinäkyvyyttä.

### `piiritys-katapultti.png` – Katapultti

- **Koko:** 140 × 90 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Puinen katapultin runko pyörineen sivulta. Heittovarsi piirretään erikseen. Tyyli: Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 140 × 90 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `piiritys-katapultin-varsi.png` – Katapultin heittovarsi

- **Koko:** 110 × 24 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Katapultin heittovarsi ja kauha sivulta. Varsi osoittaa oikealle, ja kiinnityskohta on vasemmassa reunassa. Tyyli: Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 110 × 24 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `piiritys-soturi.png` – Kurpitsapäinen soturi

- **Koko:** 60 × 100 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Soturi, jolla on kaiverrettu kurpitsa päänä, haarniska ja tumma viitta. Katsoo oikealle. Tyyli: Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 60 × 100 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `piiritys-luuranko.png` – Luurankovartija

- **Koko:** 44 × 80 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 3 kuvaa vierekkäin vasemmalta oikealle: seisoo, kävely 1, kävely 2

**Kuvaus generaattorille:**

> Luurankovartija, jolla on ruosteinen keihäs. Katsoo vasemmalle. Tyyli: Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 3 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (seisoo, kävely 1, kävely 2). Yksi ruutu on 44 × 80 pikseliä, koko kuva 132 × 80 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `piiritys-tynnyri.png` – Ruutitynnyri

- **Koko:** 40 × 48 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.

**Kuvaus generaattorille:**

> Punertava ruutitynnyri, jossa on keltainen huutomerkki. Tyyli: Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Koko 40 × 48 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.

### `piiritys-ammukset.png` – Ammukset

- **Koko:** 36 × 36 px
- **Tausta:** läpinäkyvä
- **Tyyli:** Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen.
- **Animaatio:** 5 kuvaa vierekkäin vasemmalta oikealle: kurpitsa, rypälekurpitsa, ohjautuva kurpitsa, kurpitsapommi, pikkukurpitsa

**Kuvaus generaattorille:**

> Viisi kurpitsa-ammusta vierekkäin: tavallinen kurpitsa, kolmen pikkukurpitsan rypäle, vihreänä hehkuva ohjautuva kurpitsa, iso tumma kurpitsapommi sytytyslankoineen ja pieni pikkukurpitsa. Tyyli: Pelkistetty piirroskuva, selkeät tummat ääriviivat, tumma Halloween-yö, ei lapsellinen. Kuvassa on 5 animaatiokuvaa vierekkäin samankokoisina ruutuina vasemmalta oikealle (kurpitsa, rypälekurpitsa, ohjautuva kurpitsa, kurpitsapommi, pikkukurpitsa). Yksi ruutu on 36 × 36 pikseliä, koko kuva 180 × 36 pikseliä. Läpinäkyvä tausta (PNG), kuvassa vain itse kohde.
