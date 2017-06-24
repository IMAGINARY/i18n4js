global.window = {};
var config = require('../package.json');
var expect = require('chai').expect;
var sinon = require('sinon');
var qs = require('query-string');
require('../distrib/i18n4js-' + config.version + '.min.js');

function withQueryString(params) {
  global.window.location = {};
  global.window.location.search = '?' + qs.stringify(params);
}

describe('i18n4js', function(){

  describe('global object', function() {
    beforeEach(function(){
      // Reset the library
      require('../distrib/i18n4js-' + config.version + '.min.js');
    });

    it('should create a global object', function(done) {
      expect(global.window.IMAGINARY.i18n).to.be.a('object');
      done();
    });

    it('should haven an init function', function(done) {
      expect(global.window.IMAGINARY.i18n.init).to.be.a('function');
      done();
    });
  });

  describe('api', function() {

    var i18n = global.window.IMAGINARY.i18n;
    var fakeServer;
    var xhr;

    before(function() {
    });

    beforeEach(function(){
      // Simulate XHR
      fakeServer = sinon.fakeServer.create();
      fakeServer.respondImmediately = true;
      fakeServer.respondWith('GET', 'tr/en.json', [200, { "Content-Type": "application/json" }, JSON.stringify(require('./tr/en.json'))]);
      fakeServer.respondWith('GET', 'tr/es.json', [200, { "Content-Type": "application/json" }, JSON.stringify(require('./tr/es.json'))]);
      fakeServer.respondWith('GET', 'tr/fr.json', [200, { "Content-Type": "application/json" }, "{invalid json"]);
      fakeServer.respondWith([404, {}, '']);
      xhr = global.XMLHttpRequest = global.window.XMLHttpRequest = fakeServer.xhr;

      // Clean the simulated query string
      withQueryString({});

      // Warning handler stub
      i18n.warn = sinon.spy();
    });

    afterEach(function() {
      // Restore real XHR
      sinon.fakeServer.restore();
    });

    it('should default to english', function(){
      var promise = i18n.init();
      expect(i18n.getLang()).to.equal('en');
      return promise;
    });

    it('should use the specified default language if there is no query string parameter', function(){
      var promise = i18n.init({
        defaultLanguage: 'es'
      });
      expect(i18n.getLang()).to.equal('es');
      return promise;
    });

    it('should use the language specified in the query string parameter', function() {
      withQueryString({lang: 'es'});
      var promise = i18n.init({
        defaultLanguage: 'en'
      });

      expect(i18n.getLang()).to.equal('es');
      return promise;
    });

    it('should allow to customize the name of the query string parameter', function() {
      withQueryString({lang: 'en', translation: 'es'});
      var promise = i18n.init({
        defaultLanguage: 'en',
        queryStringVariable: 'translation'
      });
      expect(i18n.getLang()).to.equal('es');
      return promise;
    });

    it('should allow setting the language manually', function() {
      return i18n.init().then(function(){
        expect(i18n.getLang()).to.equal('en');
        return i18n.setLang('es');
      }).then(function(){
        expect(i18n.getLang()).to.equal('es');
      });
    });

    it('should inform a successful status after loading', function() {
      withQueryString({lang: 'es'});
      return i18n.init().then(function() {
        expect(i18n.getLang()).to.equal('es');
        // The default language should load OK
        expect(i18n.getStatus()['en']).to.have.property('loading', false);
        expect(i18n.getStatus()['en']).to.have.property('loaded', true);
        expect(i18n.getStatus()['en']).to.have.property('failed', false);
        expect(i18n.getStatus()['en']).to.have.property('message', '');
        // The selected language should load OK
        expect(i18n.getStatus()['es']).to.have.property('loading', false);
        expect(i18n.getStatus()['es']).to.have.property('loaded', true);
        expect(i18n.getStatus()['es']).to.have.property('failed', false);
        expect(i18n.getStatus()['es']).to.have.property('message', '');
      });
    });

    it('should return the loaded language as argument of the promise', function() {
      return i18n.init().then(function(lang){
        expect(lang).to.equal('en');
      });
    });

    it('should return all the language strings', function() {
      return i18n.init().then(function(){
        expect(i18n.getStrings()).to.deep.equal(require('./tr/en.json'));
      });
    });

    it('should translate individual strings', function() {
      return i18n.init().then(function(){
        expect(i18n.t("HELLO")).to.equal("Hi there!");
      });
    });

    it('should return an empty string if the requested string does not exist', function() {
      return i18n.init().then(function(){
        expect(i18n.t("NON_EXISTANT")).to.equal("");
      });
    });

    it('should return the default language if the requested string is not translated', function() {
      withQueryString({lang: 'es'});
      return i18n.init({
        defaultLanguage: 'en'
      }).then(function(){
        expect(i18n.t("ENGLISH_ONLY")).to.equal("Not translated");
      });
    });

    it('should return an empty string if the requested string is not translated and fallback disabled', function() {
      withQueryString({lang: 'es'});
      return i18n.init({
        defaultLanguage: 'en',
        fallbackToDefaultLanguage: false
      }).then(function(){
        expect(i18n.t("ENGLISH_ONLY")).to.equal("");
      });
    });

    it('should return the default language if the requested language does not exist', function() {
      withQueryString({lang: 'ch'});
      return i18n.init({
        defaultLanguage: 'es'
      }).then(function(){
        expect(i18n.t("HELLO")).to.equal("¡Hola! ¿Qué tal?");
        expect(i18n.getStatus()['ch']).to.have.property('loading', false);
        expect(i18n.getStatus()['ch']).to.have.property('loaded', false);
        expect(i18n.getStatus()['ch']).to.have.property('failed', true);
        expect(i18n.getStatus()['ch']).to.have.property('message', 'Error loading tr/ch.json: Not Found');
        expect(i18n.warn.calledWith('Error loading tr/ch.json: Not Found')).to.be.true;
      });
    });


    it('should warn if the language file is invalid', function() {
      withQueryString({lang: 'fr'});
      return i18n.init().then(function(){
        expect(i18n.getStatus()['fr']).to.have.property('loading', false);
        expect(i18n.getStatus()['fr']).to.have.property('loaded', false);
        expect(i18n.getStatus()['fr']).to.have.property('failed', true);
        expect(i18n.getStatus()['fr']).to.have.property('message', 'Error loading tr/fr.json: Parser is unable to parse the response');
        expect(i18n.warn.calledWith('Error loading tr/fr.json: Parser is unable to parse the response')).to.be.true;
      });
    });
  });
});
