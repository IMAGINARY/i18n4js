# i18n4js

Helper library to handle i18n (internationalization) in JS web apps.

Features this library offers:

- Determine language from a query string variable
- Dynamically loading translation files
- Translation or listing of strings

It was developed to quickly add basic i18n support to the [CindyJS apps](https://github.com/IMAGINARY/cindyjs-apps) 
and the [AppLauncher Mark II](https://github.com/IMAGINARY/applauncher2) and other future projects.
 
### Future development
 
Some features this library might implement in the future:

- Support for language files included statically through `<script>` elements.
- Support for translating strings with placeholders
- Support for plurals 

## Usage example

Initialize the library:

```
IMAGINARY.i18n.init({
  queryStringVariable: 'lang',
  translationsDirectory: 'tr',
  defaultLanguage: 'en'
}).then(function(){
  // Finished initializing
}).except(function(err){
  // Handle error
});
```

get current language:

```
var lang = IMAGINARY.i18n.getLang();
```

set the language manually (instead of using the query string):

```
IMAGINARY.i18n.setLang('de');
```

get all strings:

```
var strings = IMAGINARY.i18n.getStrings();
```

translate a single string:

```
var string = IMAGINARY.i18n.t('STRING_ID');
```

## Internal details

i18n4js loads translation files dynamically via an ajax request using superagent (included).

All functions that set a language return a Promise using the bluebird implementation.

## License

Copyright 2017 IMAGINARY gGmbH
Licensed under the Apache License, Version 2.0
See LICENSE and NOTICE for more info