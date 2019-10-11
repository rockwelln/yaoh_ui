export const API_WS_URL = (window.location.protocol === 'https:'?'wss':'ws') + '://' + (process.env.NODE_ENV === 'production'?window.location.host:'127.0.0.1:5000');
export const API_URL_PREFIX = process.env.NODE_ENV === 'production'?window.location.origin:'http://127.0.0.1:5000';
export const API_URL_PROXY_PREFIX = '/api/v01/apio/sync';

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length === 2)
    return parts
      .pop()
      .split(";")
      .shift();
}

function createCookie(name,value,days,path) {
	var expires = "";
    if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		expires = "; expires="+date.toGMTString();
	}
	if (!path) {
	    path = "/";
    }
	document.cookie = name+"="+value+expires+"; path="+path;
}

function removeCookie(name) {
    createCookie(name,"",-1);
}

class AuthService {
    static token = null;

    loadToken(token) {
        this.token = token;

        createCookie("auth_token", token, 1, "/");
        console.log("token updated!");
    }

    loadTokenFromCookie(cookie_name) {
        this.loadToken(getCookie(cookie_name));
    }

    getToken() {
        return this.token;
        // return localStorage.jwt;
    }

    logout() {
        this.token = null;

        removeCookie("auth_token");
    }

    isAuthenticated() {
        const token = this.getToken();
        return token !== null && typeof token === "string" && token.length > 0;
    }
}

export const AuthServiceManager = new AuthService();


class ProvisioningProxies {
    static proxies = [];

    fetchConfiguration() {
      return fetch_get("/api/v01/apio/provisioning/gateways")
          .then(data => ProvisioningProxies.proxies = data.gateways.map(g => {
              g.id = g.name.toLowerCase().replace(/[. ]/g, "");
              console.log(g);
              return g;
          }))
    }

    getCurrentUrlPrefix() {
      const name = window.location.href.match(/\/provisioning\/[A-Za-z0-9_-]*\//)[0].split("/")[2];
      const e = ProvisioningProxies.proxies.filter(p => p.id === name);
      return e.length > 0?e[0].prefix:"";
    }

    listProxies() {
        return ProvisioningProxies.proxies;
    }
}

export const ProvProxiesManager = new ProvisioningProxies();


class NotificationsHandler {
    static rootRef = null;

    setRef(ref_) {
        NotificationsHandler.rootRef = ref_;
    }

    error(title, message) {
        NotificationsHandler.rootRef &&
        NotificationsHandler.rootRef.current.addNotification({
            title: title,
            message: message,
            level: 'error'
        });
    }

    success(message) {
        NotificationsHandler.rootRef &&
        NotificationsHandler.rootRef.current.addNotification({
            message: message,
            level: 'success'
        });
    }
}

export const NotificationsManager = new NotificationsHandler();


export function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return response
    } else if (response.status === 401) {
        console.log("the request was *not* authorized!");
        AuthServiceManager.logout();
        window.location.reload();
    }

    const contentType = response.headers.get("content-type");
    if(contentType && contentType.indexOf("application/json") !== -1) {
        return response.json().then(function(json) {
          const message = json.error || response.statusText;
          let error = new Error(message);
          error.response = response;
          if(json.errors) {
              error.errors = json.errors;
          }
          throw error;
        });
    }

    let error = new Error(response.statusText);
    error.response = response;
    throw error;
}

export function parseJSON(response) {
  return response.json()
}

export function fetch_get(url, token) {
    const token_ = AuthServiceManager.getToken();
    const full_url = url.href?url:url.startsWith('http')?url:API_URL_PREFIX + url;
    return fetch(full_url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token_}`
        }
    }).then(checkStatus)
    .then(parseJSON)
}

export function fetch_put(url, body, token) {
    const token_ = AuthServiceManager.getToken();
    const full_url = url.href?url:url.startsWith('http')?url:API_URL_PREFIX + url;
    return fetch(full_url, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token_}`
        },
        body: JSON.stringify(body)
    }).then(checkStatus)
}

export function fetch_post(url, body, token) {
    return fetch_post_raw(url, JSON.stringify(body), token, 'application/json');
}

export function fetch_post_raw(url, raw_body, token, content_type) {
    const token_ = AuthServiceManager.getToken();
    const full_url = url.href?url:url.startsWith('http')?url:API_URL_PREFIX + url;
    let headers = {
        'Authorization': `Bearer ${token_}`,
    };
    if(content_type) {
        headers['content-type'] = content_type
    }
    return fetch(full_url, {
        method: 'POST',
        headers: headers,
        body: raw_body
    }).then(checkStatus)
}

export function fetch_delete(url, body) {
    const token_ = AuthServiceManager.getToken();
    const full_url = url.href?url:url.startsWith('http')?url:API_URL_PREFIX + url;
    return fetch(full_url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token_}`
        },
        body: JSON.stringify(body)
    }).then(checkStatus)
}
