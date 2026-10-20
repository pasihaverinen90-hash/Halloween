# Halloween-peli-ilta

Selainpeli kaveriporukan Halloween-iltaan 31.10.2026. Pelissä on minipelejä, joita 6–9 pelaajaa pelaa vuorotellen samalla tietokoneella. Kaikkea ohjataan näppäimistöllä.

**Pelaa:** https://pasihaverinen90-hash.github.io/Halloween/

Paina pelin auettua **F11**, niin peli täyttää koko näytön.

## Tiedostot, joita Pasi voi muokata

- [`content/`](content/) – hirsipuun sanat ja muu pelien sisältö. Ohjeet ovat tiedostossa [`content/README.md`](content/README.md).
- [`public/assets/`](public/assets/) – omat kuvat, jotka korvaavat koodilla piirretyt kuvat. Kuvaluettelo ja ohjeet ovat tiedostossa [`ASSETS.md`](ASSETS.md).

Kun muutos tallennetaan main-haaraan, peli julkaistaan automaattisesti muutaman minuutin kuluttua.

## Muut tiedostot

- [`CLAUDE.md`](CLAUDE.md) – projektin säännöt ja suunnitelma
- [`EDISTYMINEN.md`](EDISTYMINEN.md) – mitä on tehty ja mitä tehdään seuraavaksi

## Lisenssit

Emojit: [Twemoji](https://github.com/twitter/twemoji) (grafiikat CC-BY 4.0, fonttiversio [twemoji-colr-font](https://github.com/mrdrogdrog/twemoji-color-font), OFL-1.1). Fontit: Grenze Gotisch, Nunito ja Patrick Hand (OFL-1.1).

## Kehittäjälle

Phaser 3, Vite ja TypeScript.

```bash
npm install
npm run dev        # kehityspalvelin
npm test           # yksikkötestit
npm run e2e        # selaintestit (Playwright)
npm run build      # tuotantoversio kansioon dist/
```
