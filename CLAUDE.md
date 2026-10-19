# Halloween-peli-ilta – ohjeet Claude Codelle

Tämä tiedosto kertoo, mitä tässä repossa rakennetaan ja miten. Lue se kokonaan ennen kuin teet mitään, ja palaa siihen jokaisen uuden vaiheen alussa.

## Projekti lyhyesti

Rakennetaan selainpeli kaveriporukan Halloween-iltaan. Siinä on seitsemän minipeliä. Pelaajia on 6–9, ja he pelaavat vuorotellen samalla tietokoneella näppäimistöllä. Jokainen pelaaja pelaa kaikki pelit haluamassaan järjestyksessä. Jokaisesta pelistä saa enintään 1000 pistettä, ja kokonaispisteet ratkaisevat illan voittajan.

Pelin tarina ja yhteinen teema päätetään myöhemmin. Älä keksi tarinaa tai maailmaa ilman Pasin lupaa. Käytä toistaiseksi yleistä Halloween-tunnelmaa.

## Aikataulu

- Ilta pidetään 31.10.2026. Pasilla on käytössään muutama ilta projektin edistämiseen.
- Pelit tehdään yksi kerrallaan. Kutakin peliä hiotaan, kunnes Pasi toteaa sen riittävän hyväksi, ja vasta sitten siirrytään seuraavaan.
- Pidä yllä tiedostoa `EDISTYMINEN.md`. Kirjaa siihen jokaisen työrupeaman lopuksi, mitä tehtiin, mikä on kesken ja mitä tehdään seuraavaksi. Lue se ensimmäisenä aina uuden rupeaman alussa.
- Jos näyttää siltä, ettei kaikkea ehditä tehdä ennen iltaa, kerro siitä Pasille hyvissä ajoin.

## Työskentely Pasin kanssa

- Pasi omistaa projektin, mutta ei osaa koodata. Hän ei lue koodia eikä virheilmoituksia.
- Kirjoita Pasille aina suomeksi ja selkokielellä. Kerro jokaisen vaiheen lopuksi, mitä tehtiin, miten sitä testataan ja mitä Pasin pitää itse tehdä.
- Pasi kertoo ongelmista kuvakaappauksilla ja omin sanoin. Selvitä niiden perusteella itse, mikä on vialla.
- Pasi haluaa, että häneltä kysytään mieluummin liikaa kuin liian vähän. Pelien säännöt ja pisteytys on sovittu tässä tiedostossa. Jos jokin jää epäselväksi tai haluat poiketa sovitusta, kysy ensin. Teknisistä ratkaisuista saat päättää itse.
- Testaa itse ennen kuin pyydät Pasia testaamaan. Pelin pitää olla jokaisen vaiheen jälkeen toimiva ja julkaistu.

## Tekniikka

- Peli tehdään Phaser 3:lla, Vitellä ja TypeScriptillä.
- Peli julkaistaan GitHub Pagesiin GitHub Actionsilla aina, kun main-haaraan tulee muutoksia. Aseta Viten `base` repon nimen mukaan. Jos Pages ei ole vielä päällä, ohjeista Pasia: Settings → Pages → Source: GitHub Actions.
- Palvelinta tai tietokantaa ei käytetä. Tulokset tallennetaan selaimen localStorageen, ja niistä tehdään varmuuskopiotiedostoja (ks. Tallennus).
- Peliä pelataan tietokoneen selaimella koko näytön tilassa. Pohjaresoluutio on 1280 × 720, ja Phaserin skaalaus sovittaa sen näyttöön.
- Kaikkea ohjataan näppäimistöllä, eikä hiirtä tarvita missään vaiheessa.
- Kaikki pelin tekstit kirjoitetaan suomeksi.
- Pelit tuottavat ääniefektit itse. Musiikkia ei tehdä, koska Pasi soittaa taustamusiikin muualta. Pidä efektit sen verran hiljaisina, etteivät ne peitä musiikkia.

## Rakenne

Peli rakennetaan modulaarisesti. Jokainen minipeli on oma moduulinsa, joka pelaa yhden yrityksen tai kierroksen ja palauttaa sen pisteet. Yhteinen ydin hoitaa kaiken muun: yritysten laskemisen, tallennuksen, tulosnäkymät ja paluun valikkoon. Pelit eivät tiedä yrityksistä tai tallennuksesta mitään.

```
src/
  core/      pelaajat, yritykset, tallennus, pisteet, salasana
  scenes/    aloitus, päävalikko, ohjeruutu, kiitosnäkymä, tulokset, korjaustila
  ui/        yhteiset näkymät: "Yritys 1/3", yrityksen tulos, tauko
  games/     yksi kansio kullekin pelille
  games/registry.ts   luettelo peleistä; pelin lisääminen tai poisto on yksi rivi
content/     sanat, arvoitukset ja vihjeet muokattavina tiedostoina
public/assets/   Pasin omat kuvat, jotka korvaavat koodilla piirretyt
```

Kaikki pistekaavat, aikarajat ja vaikeusasetukset pidetään yhdessä asetustiedostossa, jotta niitä on helppo säätää testauksen jälkeen.

## Pelin kulku

1. **Aloitusnäkymä:** Pelaaja luo itselleen nimen, joka näkyy tulostauluilla. Kahdella pelaajalla ei voi olla samaa nimeä.
2. **Päävalikko:** Pelit näkyvät esikatselukuvina ruudukossa. Peli valitaan nuolinäppäimillä ja Enterillä. Jo pelattu peli näkyy harmaana, eikä sitä voi valita uudelleen.
3. **Ohjeruutu:** Ennen pelin alkua näytetään paikallaan pysyvä ohje, jossa kerrotaan näppäimet, säännöt ja pisteytys. Peli alkaa, kun pelaaja painaa Enteriä. Harjoituskierrosta ei ole.
4. **Yritykset:** Toimintapeleissä pelataan kolme yritystä putkeen, ja paras yritys jää voimaan. Ennen jokaista yritystä näytetään "Yritys 1/3", ja jokaisen yrityksen jälkeen sen pisteet ja paras tulos siihen mennessä. Pulmapelit (hirsipuu, kuva-arvoitukset, ristikko) pelataan yhtenä kierroksena.
5. **Paluu valikkoon:** Kun peli on pelattu, tulos tallentuu ja pelaaja palaa päävalikkoon.
6. **Kiitosnäkymä:** Kun kaikki pelit on pelattu, näytetään kiitos ja pelaajan omat pisteet. Tulokset tallennetaan, ja varmuuskopio ladataan. "Seuraava pelaaja" vie takaisin aloitusnäkymään.

Esc pysäyttää pelin taukotilaan. Yritys ei kulu eikä katoa tauon aikana.

## Pisteet

- Jokaisesta pelistä saa enintään 1000 pistettä. Pisteet riippuvat vain pelaajan omasta suorituksesta: täydellinen suoritus antaa 1000, eikä 1000 voi ylittyä.
- Kokonaispisteet ovat kaikkien pelien pisteiden summa.
- Pelikohtaiset kaavat ovat alla kunkin pelin kohdalla.

## Tulokset, palkintojenjako ja korjaustila

- Pelaaja näkee omat pisteensä pelatessaan. Muiden tulokset ja kaikki tulosnäkymät aukeavat vain Pasin salasanalla. Salasana on tehty vain tätä iltaa varten. Kysy se Pasilta ja tallenna koodiin tiivisteenä, älä selväkielisenä.
- **Palkintojenjako:** Kokonaiskilpailun kolme parasta nostetaan palkintokorokkeille, ja voittaja julistetaan näyttävästi.
- **Tulokset pelin mukaan:** Kunkin pelin top-lista.
- **Tulokset pelaajan mukaan:** Yhden pelaajan kaikkien pelien pisteet.
- **Korjaustila** aukeaa näppäinyhdistelmällä Ctrl + Shift + K ja Pasin salasanalla. Siellä voi
  - muuttaa tai poistaa yksittäisen tuloksen
  - antaa pelaajalle pelin uudelleen, jos peli esimerkiksi jumittui
  - jatkaa kesken jääneen pelaajan vuoroa
  - ladata ja tuoda takaisin varmuuskopion
  - tyhjentää kaikki tulokset, kun toiminto on vahvistettu kahdesti.

## Tallennus

- Tulokset tallennetaan localStorageen jokaisen yrityksen jälkeen, jotta mitään ei katoa, vaikka selain sulkeutuisi kesken.
- Kiitosnäkymässä ladataan automaattisesti varmuuskopio JSON-tiedostona. Tiedoston nimessä on päivämäärä ja kellonaika.
- Korjaustilasta voi ladata varmuuskopion milloin tahansa ja tuoda sen takaisin. Tulokset voi viedä myös CSV-tiedostona, jonka saa avattua taulukkolaskentaohjelmassa.

## Pelit

Pelit on lueteltu rakennusjärjestyksessä. Vaikeustaso on helposta keskivaikeaan: osa pelaajista on pelannut paljon, yksi tai kaksi tuskin lainkaan. Jokaisen pelin pitää olla ymmärrettävä ohjeruudun perusteella, ja alun pitää olla armollinen.

Pelit saavat toimia tuttujen klassikoiden tapaan, mutta kaikki hahmot, nimet ja grafiikat ovat omia. Älä käytä tunnettujen pelien, elokuvien tai sarjojen hahmoja tai grafiikoita. Älä myöskään kuvaa oikeita, tunnistettavia henkilöitä.

### 1. Hirsipuu (piirrostyyli)

- Pelaaja arvaa 5 sanaa tai lausetta, ja jokaisessa näkyy vihje. Kaikki pelaavat samat sanat.
- Kirjaimet arvataan näppäimistöltä, ja mukana ovat myös Å, Ä ja Ö. Välilyönnit ja välimerkit näkyvät valmiina.
- Kokonaista sanaa ei arvata erikseen. Sana on ratkaistu, kun kaikki sen kirjaimet ovat paikallaan.
- Väärä kirjain saa tulla 8 kertaa. Kahdeksannen väärän kirjaimen jälkeen sana epäonnistuu, ja peli siirtyy seuraavaan.
- Aikarajaa ei ole.
- **Pisteet:** Jokaisesta sanasta saa 200 pistettä, ja jokainen väärä kirjain vähentää 25. Epäonnistunut sana antaa siis 0 pistettä.
- Hirsipuun kuvana kootaan luuranko kahdeksassa osassa, yksi osa kutakin väärää kirjainta kohden. Pasi toimittaa taustan ja luurangon osat. Tee siihen asti korvaavat kuvat.

### 2. Kuva-arvoitukset (piirrostyyli)

- Pelaaja ratkaisee 10 arvoitusta Halloweenista ja kauhuleffoista. Kaikki pelaavat samat arvoitukset.
- Arvoituksia on kahta tyyppiä. Kuvista muodostuvissa sanoissa (esim. kuu + rasti) kuvat tekee Pasi. Emojiarvoitukset, joissa emojeista arvataan sana tai elokuva, tekee Claude Code.
- Puolet arvoituksista on monivalintoja, joissa on neljä vaihtoehtoa, ja puolet avoimia. Tyyppi määritellään sisältötiedostossa arvoituskohtaisesti.
- Jokaiseen arvoitukseen on aikaa 20 sekuntia. Ohitusta ja vihjeitä ei ole.
- **Pisteet:** Oikea vastaus heti antaa 100 pistettä, ja pisteet laskevat tasaisesti 50:een 20 sekunnin aikana.
  - Avoimeen arvoitukseen saa arvata useita kertoja. Jokainen väärä vastaus vähentää 20 pistettä, mutta pisteet eivät mene alle nollan. Isot ja pienet kirjaimet sekä ylimääräiset välilyönnit eivät vaikuta, ja hyväksyttyjä vastauksia voi olla useita.
  - Monivalinnassa saa vastata vain kerran, ja väärä vastaus antaa 0 pistettä.
  - Jos aika loppuu, arvoituksesta saa 0 pistettä, ja peli siirtyy seuraavaan.
- Ehdota Pasille kuvista muodostuvien arvoitusten ideat ja kirjaa niiden tarvitsemat kuvat tiedostoon `ASSETS.md`.

### 3. Lentopeli (piirrostyyli, Flappy Birdin tapaan)

- Noita lentää luudalla, ja välilyönti nostaa sitä ylöspäin.
- Esteinä on paikallaan pysyviä inkvisiittoreita ja muita teemaan sopivia esteitä.
- Matkalta voi kerätä mustia kissoja, jotka toimivat lisäeläminä. Kissoja voi olla enintään 3, ja noita aloittaa ilman kissoja.
- Törmäys vie yhden kissan, ja vauhti pysähtyy ja alkaa kiihtyä uudelleen samasta kohdasta. Törmäys ilman kissaa päättää yrityksen.
- Ensimmäiset 20 sekuntia ovat helppoja, ja sen jälkeen peli vaikeutuu vähitellen.
- Matkan päässä on maali. Ehdota maalin etäisyys Pasille ja säädä se testauksen perusteella.
- **Pisteet:** Maaliin päässyt saa 1000 pistettä, ja yritys päättyy. Muuten pisteet tulevat lennetystä matkasta suhteessa maalin etäisyyteen.
- Pelissä on 3 yritystä, ja paras jää voimaan.

### 4. Räiskintä (piirrostyyli, Space Invadersin tapaan)

- Ampujana on keksitty paavihahmo, ei kukaan oikea paavi. Hahmo liikkuu nuolilla sivuttain ruudun alalaidassa ja ampuu automaattisesti.
- Alla vierii hautausmaa, ja ylhäältä tulee Halloween-hahmoja, joista osa ampuu takaisin. Vihollisia tulee koko ajan enemmän.
- Erikoiskohteista, kuten liitonarkusta ja pyhästä maljasta, saa pisteitä ja parannuksia aseisiin. Lisäksi pelissä on boosteja ja parempia aseita.
- Paavi kestää 10 osumaa.
- Viiden minuutin kohdalla näytetään väliteksti siitä, että kaiken pahan alku ja juuri esittäytyy vihdoin, ja sen jälkeen tulee bossi: Paholainen.
- **Pisteet:** Tuhotuista vihollisista saa enintään 400, kuljetusta matkasta enintään 300 ja bossin kaatamisesta 300.
- Pelissä on 3 yritystä, ja paras jää voimaan.

### 5. Ristikko (piirrostyyli)

- Pelissä on yksi iso ristikko, jossa on yli 15 sanaa. Sanat risteävät tiiviisti kuin Scrabblessa, ja helpot Halloween-vihjeet näkyvät listana. Kaikki pelaavat saman ristikon.
- Ruudukko muodostetaan automaattisesti sana- ja vihjelistasta, jotta Pasi voi vaihtaa sanoja koskematta mihinkään muuhun.
- Aikaa on 10 minuuttia.
- Kun sanan kaikki ruudut on täytetty, peli tarkistaa sen automaattisesti. Oikea sana lukittuu. Väärä sana välähtää punaisena, sen lukitsemattomat väärät kirjaimet poistuvat, ja jäljellä olevasta ajasta vähennetään 5 sekuntia.
- Yksittäisen kirjaimen saa paljastaa, ja jokainen paljastus vähentää 5 sekuntia.
- Ratkaisusanaa ei ole.
- **Pisteet:** 60 % pisteistä tulee oikeista sanoista suhteessa sanojen kokonaismäärään ja 40 % jäljellä olevasta ajasta.
- Ehdota Pasille, millä näppäimillä liikutaan ruudukossa, vaihdetaan sanan suuntaa ja paljastetaan kirjain.

### 6. Tasohyppely (pikselitaide, Castlevanian tapaan)

- Päähahmona on oma vampyyrisankari, ei mikään tunnettu pelihahmo.
- Pelissä on kolme kenttää: hautausmaa zombeineen, linna haarniskoineen ja noidan metsä maagisine olentoineen. Kentät pelataan peräkkäin, ja yksi kenttä kestää noin pari minuuttia.
- Nuolet liikuttavat, välilyönti hyppää ja X lyö ruoskalla.
- Viimeisen kentän lopussa on bossina päänoita, joka kaatuu riittävällä määrällä osumia.
- Hahmolla on jokaisen kentän alussa 3 health-pistettä. Kerättävistä esineistä saa puolikkaan health-pisteen tai ruoskan päivityksen, joka pidentää ulottuvuutta ja lisää vahinkoa. Päivitys säilyy saman yrityksen ajan. Muita voimaesineitä ei ole.
- Kentissä on kuoppia, joihin voi pudota. Aikarajaa ei ole.
- Kun health-pisteet loppuvat, yritys päättyy, ja seuraava yritys alkaa ensimmäisestä kentästä.
- **Pisteet:** Edetystä matkasta saa kolmen kentän aikana enintään 700 pistettä ja bossin kaatamisesta 300.
- Pelissä on 3 yritystä, ja paras jää voimaan.

### 7. Kurpitsalinko (piirrostyyli, Wormsin tapaan)

- Katapultti linkoaa kurpitsoja. Kentät ovat luurankolinnan maastoja, ja niissä luurangot ovat maaleina. Osa luurangoista liikkuu vähän laukausten välissä, mutta ne eivät ammu takaisin.
- Nuolet säätävät kulmaa. Kun välilyöntiä pidetään pohjassa, voima latautuu, ja kurpitsa lähtee, kun näppäimen päästää irti. Lyhyt apuviiva näyttää lähtösuunnan.
- Maasto tuhoutuu osumista, jos se onnistuu kohtuullisella vaivalla. Muuten maasto on kiinteä. Kerro Pasille, kumpaan päädyit.
- Yhdessä yrityksessä on 5 kenttää, jotka ovat joka yrityksellä samat. Kenttä päättyy, kun kaikki luurangot on tuhottu.
- Ammuksia on loputtomasti. Aikarajaa ja tuulta ei ole.
- **Pisteet:** Jos jokaiseen luurankoon kuluu yksi laukaus, pisteitä tulee 1000. Jokainen ylimääräinen laukaus vähentää pisteitä niin, että ensimmäisestä ylimääräisestä rangaistaan eniten ja seuraavista yhä vähemmän. Pisteet eivät voi ylittää 1000:ta, vaikka yksi kurpitsa kaataisi useamman luurangon.
- Pelissä on 3 yritystä, ja paras jää voimaan.

## Pelien nimet

Keksi peleille väliaikaiset nimet. Niiden pitää kuulostaa oikeiden pelien nimiltä, eivätkä ne saa olla lapsellisia tai satumaisia. Lopulliset nimet päätetään teeman yhteydessä.

## Grafiikat ja kuvat

- Piirrä kaikki grafiikat ensin koodilla: tasohyppely pikselitaiteena ja muut pelkistettyinä piirroskuvina. Myös valikon esikatselukuvat piirretään koodilla.
- Jokaisella kuvalla on kiinteä nimi, esimerkiksi `hirsipuu-luuranko-1.png`. Jos `public/assets/` sisältää samannimisen tiedoston, peli käyttää sitä koodilla piirretyn sijaan. Näin Pasi voi vaihtaa kuvia koskematta koodiin.
- Ylläpidä tiedostoa `ASSETS.md`. Siinä luetellaan jokaisesta kuvasta nimi, mitä kuva esittää, koko pikseleinä, tyyli, tarvitaanko läpinäkyvä tausta ja animaatiokuvien järjestys. Kirjoita luettelo niin, että Pasi voi antaa sen sellaisenaan kuvageneraattorille.
- Pasi toimittaa ainakin hirsipuun taustan ja luurangon osat sekä kuva-arvoitusten kuvat.

## Sisältö

- Tee pohjasisältö suomeksi Halloween-aiheesta: hirsipuun sanat ja vihjeet, kuva-arvoitukset vastauksineen sekä ristikon sanat ja vihjeet. Pasi muokkaa niitä itse.
- Sisältö on kansiossa `content/` selkeinä tiedostoina. Kirjoita kansioon `README.md`, joka neuvoo, miten tiedostoja muokataan GitHubin selaineditorilla.
- Tarkista sisältötiedostot julkaisun yhteydessä. Jos tiedosto on rikki, julkaisu pysähtyy, edellinen toimiva versio jää näkyviin, ja virhe kerrotaan suomeksi.

## Vaiheet

1. **Pohja ja hirsipuu:** Tee projektipohja ja GitHub Pages -julkaisu. Rakenna aloitusnäkymä, päävalikko, ohjeruutu, yritysten kulku, tallennus, salasana, tulosnäkymät, korjaustila, kiitosnäkymä ja varmuuskopio. Ensimmäiseksi peliksi tehdään hirsipuu. Pasi testaa koko kulun kahdella testipelaajalla.
2. **Kuva-arvoitukset**
3. **Lentopeli**
4. **Räiskintä**
5. **Ristikko**
6. **Tasohyppely**
7. **Kurpitsalinko**
8. **Viimeistely:** CSV-vienti, kuvien vaihtaminen ja `ASSETS.md`. Lopuksi ajetaan läpi koko ilta kolmella testipelaajalla.

Kukin peli hiotaan valmiiksi Pasin kanssa ennen kuin seuraava aloitetaan.

## Myöhemmin päätettävät

Nämä tehdään vain, jos aikaa jää, ja vasta kun Pasi on päättänyt niistä:

- teema ja tarina sekä pelien lopulliset nimet
- valikon ulkoasu
- bomberman, joka lisätään tarvittaessa omana moduulinaan.
