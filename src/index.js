import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {IntlProvider} from 'react-intl';
import { createStore, applyMiddleware, compose } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";

import App from './App';
// import registerServiceWorker from './registerServiceWorker';
import { unregister } from './registerServiceWorker';

import { mainReducer } from "./provisioning";

//import en from 'react-intl/locale-data/en';
//import fr from 'react-intl/locale-data/fr';
//import nl from 'react-intl/locale-data/nl';

//import en_GB from './translations/en.json';
import fr_FR from './translations/fr.json';
import {createCookie, getCookie, removeCookie} from "./utils";

//addLocaleData(en);
//addLocaleData(fr);
//addLocaleData(nl);

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

    changeLanguage(locale) {
        if(locale !== this.state.locale) {
            this.setState({locale: locale});
            if(locale === undefined) {
                removeCookie('user_language')
            } else {
                createCookie('user_language', locale, null, '/');
                window.location.reload();
            }
        }
    }

    render() {
        let locale = this._getLocale();
        let messages = getMessages(locale);

        return (
            <IntlProvider locale={locale} key={locale} messages={messages}>
                <App onLanguageUpdate={this.changeLanguage}/>
            </IntlProvider>
        );
    }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  mainReducer,
  composeEnhancers(applyMiddleware(thunk))
);


ReactDOM.render(
    <Provider store={store}>
        <AppWithIntl/>
    </Provider>, document.getElementById('root')
);
unregister();
