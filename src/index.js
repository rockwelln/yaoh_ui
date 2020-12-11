import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider} from 'react-intl';

import App from './App';
// import registerServiceWorker from './registerServiceWorker';
import register from './registerServiceWorker';


import fr_FR from './translations/fr.json';
import {createCookie, getCookie, removeCookie} from "./utils";
import AutoReload from "./utils/autoReload";


function getMessages(locale) {
  switch(locale) {
      //case 'en': return en_GB;
      case 'fr': return fr_FR;
      default:
          if (locale !== undefined && locale.length > 2) {
              return getMessages(locale.substr(0, 2));
          }
          console.error('the language ' + locale + ' is not handled (yet?)');
          return {}
  }
}


class AppWithIntl extends Component {
    constructor(props) {
        super(props);
        this._getLocale = this._getLocale.bind(this);
        this.changeLanguage = this.changeLanguage.bind(this);
        this.state = {locale: this._getLocale()}
    }

    _getLocale() {
        let locale = this.state?this.state.locale:undefined;
        if(locale === undefined) {
            locale = getCookie("user_language");
        }
        if(locale === undefined || locale === "undefined") {
            locale = navigator.language.substr(0, 2);
        }
        return locale
    }

    render() {
        let locale = this._getLocale();
        let messages = getMessages(locale);

        return (
            <IntlProvider locale={locale} key={locale} messages={messages}>
                <App />
                <AutoReload
                    url="/index.html" tryDelay={10 * 60 * 1000}
                />
            </IntlProvider>
        );
    }
}

ReactDOM.render(
  <AppWithIntl/>, document.getElementById('root')
);
register();
