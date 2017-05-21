import getQueryString from './getQueryString';

const Promise = require('bluebird');
const superagent = require('superagent');

export default class I18n {

  constructor() {
    this.lang = '';
    this.strings = {};
    this.defaultOptions = {
      queryStringVariable: 'lang',
      translationsDirectory: 'tr',
      defaultLanguage: 'en',
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
   * @return {Promise}
   *  Returns a promise resolved after the translation file is loaded
   */
  init(options = {}) {
    this.constructor(); // reset state
    this.config = Object.assign(this.defaultOptions, options);
    return this.setLangFromQueryString();
  }

  /**
   * Set the current language using the query string
   *
   * Reads the query string in the URL looking for the queryStringVariable defined in the
   * init options. If found sets the language to the language code specified in the variable.
   * If the query string variable is not present it sets the language to the default.
   *
   * @return {Promise}
   *  Returns a promise resolved after the translation file is loaded
   */
  setLangFromQueryString() {
    const queryString = getQueryString();
    const langVar = this.config.queryStringVariable;
    if (queryString[langVar] !== undefined && queryString[langVar] !== this.getLang()) {
      return this.setLang(queryString[langVar]);
    }
    return this.setLang(this.config.defaultLanguage);
  }

  /**
   * Sets the current language
   *
   * @param {string} code Language code
   *
   * @return {Promise}
   *  Returns a promise resolved after the translation file is loaded
   */
  setLang(code) {
    return new Promise((accept, reject) => {
      superagent
        .get(`${this.config.translationsDirectory}/${code}.json`)
        .set('Accept', 'json')
        .then((response) => {
          this.lang = code;
          this.strings = response.body;
          accept();
        })
        .catch((err) => {
          reject(err);
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
   * Returns the string dictionary of the current language
   *
   * @return {object} A dictionary of strings indexed by string ID
   */
  getStrings() {
    return this.strings;
  }

  /**
   * Returns a string translated to the current language
   *
   * If the string ID is not found an empty string will be returned
   *
   * @param stringID ID of the string to translate
   * @return {string} The translation
   */
  t(stringID) {
    if (this.strings[stringID] !== undefined) {
      return this.strings[stringID];
    }
    return '';
  }
}
