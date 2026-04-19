const fs = require('fs');
const path = require('path');

const translations = {
  "en": { "placeholder": "Select a language", "title": "Languages" },
  "fr": { "placeholder": "Sélectionnez une langue", "title": "Langues" },
  "ar": { "placeholder": "اختر لغة", "title": "اللغات" },
  "de": { "placeholder": "Sprache auswählen", "title": "Sprachen" },
  "it": { "placeholder": "Seleziona una lingua", "title": "Lingue" },
  "es": { "placeholder": "Selecciona un idioma", "title": "Idiomas" },
  "ca": { "placeholder": "Selecciona un idioma", "title": "Idiomes" },
  "pl": { "placeholder": "Wybierz język", "title": "Języki" },
  "pt-BR": { "placeholder": "Selecione um idioma", "title": "Idiomas" },
  "tr": { "placeholder": "Bir dil seçin", "title": "Diller" },
  "zh-CN": { "placeholder": "选择语言", "title": "语言" },
  "ja": { "placeholder": "言語を選択", "title": "言語" },
  "nb-NO": { "placeholder": "Velg et språk", "title": "Språk" },
  "nn-NO": { "placeholder": "Vel eit språk", "title": "Språk" },
  "sr": { "placeholder": "Izaberite jezik", "title": "Jezici" },
  "id": { "placeholder": "Pilih bahasa", "title": "Bahasa" }
};

const localesDir = path.join(__dirname, 'i18n', 'locales');

fs.readdirSync(localesDir).forEach(file => {
  if (file.endsWith('.json')) {
    const lang = file.replace('.json', '');
    const filePath = path.join(localesDir, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (translations[lang]) {
        data.languageSelector = translations[lang];
      } else {
        // Fallback to English
        data.languageSelector = translations["en"];
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
      console.log(`Updated ${file}`);
    } catch(e) {
      console.error(`Error updating ${file}:`, e);
    }
  }
});
