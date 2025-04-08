import getQueryString from './getQueryString';

const Promise = require('bluebird');
const superagent = require('superagent');

export default class I18n {

  /**
   * @property {function} warn - Warning handler function. Takes a message parameter.
   *   Defaults to console.warn
   * @property {function} error - Error handler function. Takes a message parameter.
   *   Defaults to console.error
   */
  constructor() {
    this.reset();
    this.warn = (message => console.warn(message));
    this.error = (message => console.error(message));
  }

  /**
   * Resets the state of loaded translations and configuration
   */
  reset() {
    this.lang = '';
    this.strings = {};
    this.status = {};
    this.defaultOptions = {
      queryStringVariable: 'lang',
      translationsDirectory: 'tr',
      defaultLanguage: 'en',
      fallbackToDefaultLanguage: true,
    };
    this.config = {};
  }

  /**
   * Initialize the library
   *
   * Call this method before any others
   *
   * @param {object} options
   *  - queryStringVariable (default: 'lang'): Name of the query string variable used to
   *    specify the language
   *  - translationsDirectory (default: 'tr'): Relative path to the directory holding the
   *    translations files
   *  - defaultLanguage (default: 'en'): Default language to use if no query string is specified
   *  - fallbackToDefaultLanguage (default: true): Use default language when the requested language
   *    does not exist or the requested string does not exist in the language.
   * @return {Promise}
   *  Returns a promise resolved after the translation file is loaded
   */
  init(options = {}) {
    this.reset();
    this.config = Object.assign({}, this.defaultOptions, options);

    const queryString = getQueryString();
    const langVar = this.config.queryStringVariable;
    if (langVar !== undefined && queryString[langVar] !== undefined) {
      this.lang = queryString[langVar];
    } else {
      this.lang = this.config.defaultLanguage;
    }

    return this.loadLang(this.config.defaultLanguage)
      .then(() => this.setLang(this.lang));
  }

  /**
   * Sets the current language. The translation will be loaded if it was
   * not previously loaded or if a reload is requested.
   *
   * @param {string} code Language code
   * @param {boolean} reload Reload the translation file
   *
   * @return {Promise}
   *  Returns a promise resolved after the translation file is loaded
   */
  setLang(code, reload = false) {
    this.lang = code;

    if (reload === true || this.strings[this.lang] === undefined) {
      return this.loadLang(code);
    }
    return Promise.resolve(code);
  }

  /**
   * Loads the specified language into the cache
   *
   * If the language was previously loaded this method causes a reload.
   *
   * @param {string} code Language code
   *
   * @return {Promise}
   *  Returns a promise resolved after the translation file is loaded
   */
  loadLang(code) {
    this.status[code] = {
      loading: true,
      loaded: false,
      failed: false,
      message: '',
    };
    const trFile = `${this.config.translationsDirectory}/${code}.json`;
    return new Promise((resolve) => {
      superagent
        .get(trFile)
        .set('Accept', 'json')
        .then((response) => {
          this.status[code].loading = false;
          this.status[code].loaded = true;
          this.strings[code] = response.body;
          resolve(code);
        }).catch((err) => {
          const errorMessage = `Error loading ${trFile}: ${err.message}`;
          this.status[code].loading = false;
          this.status[code].failed = true;
          this.status[code].message = errorMessage;
          this.warn(errorMessage);
          this.strings[code] = {};
          resolve(code);
        });
    });
  }

  /**
   * Returns the current language
   *
   * @return {string}
   */
  getLang() {
    return this.lang;
  }

  /**
   * Gets the status of the translations
   *
   * Status is only returned for languages that were loaded (selected language and
   * default language).
   *
   * @return {object} A map indexed by the language code containing objects with these properties:
   *   - loading (boolean): True if the language is loading
   *   - loaded (boolean): True if the language finished loading successfuly
   *   - failed (boolean): True if there were errors while loading
   *   - message (String): Error message
   */
  getStatus() {
    return this.status;
  }

  /**
   * Returns the string dictionary of the current language
   *
   * @return {object}
   *   A dictionary of strings indexed by string ID
   */
  getStrings() {
    if (this.config.fallbackToDefaultLanguage && this.lang !== this.config.defaultLanguage) {
      return Object.assign({}, this.strings[this.config.defaultLanguage], this.strings[this.lang]);
    } else if (this.strings[this.lang] !== undefined) {
      return this.strings[this.lang];
    }

    return {};
  }

  /**
   * Returns a string translated to the current language
   *
   * If the string ID is not found an empty string will be returned.
   * If a language is specified, it must have been previously loaded.
   *
   * @param {string} stringID
   *  ID of the string to translate
   * @param {string} lang
   *   Language code (optional). If not specified the current language will be used.
   * @return {string}
   *  The translation
   */
  t(stringID, lang = null) {
    const strings = lang !== null ? this.strings[lang] : this.strings[this.lang];
    const defStrings = this.strings[this.config.defaultLanguage];

    if (strings !== undefined && strings[stringID] !== undefined) {
      return strings[stringID];
    } else if (this.config.fallbackToDefaultLanguage) {
      if (defStrings[stringID] !== undefined) {
        return defStrings[stringID];
      }
    }
    return '';
  }
}
