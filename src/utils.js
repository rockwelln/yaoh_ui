import { Base64 } from 'js-base64';

export const API_WS_URL = (window.location.protocol === 'https:'?'wss':'ws') + '://' + (process.env.NODE_ENV === 'production'?window.location.host:'127.0.0.1:5000');
export const API_URL_PREFIX = process.env.NODE_ENV === 'production'?window.location.origin:'http://127.0.0.1:5000';
export const STATIC_URL_PREFIX = process.env.NODE_ENV === 'production'?window.location.origin:'http://127.0.0.1:3000';
export const API_URL_PROXY_PREFIX = '/api/v01/apio/sync';

export function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length === 2)
    return parts
      .pop()
      .split(";")
      .shift();
}

export function createCookie(name,value,days,path) {
	var expires = "";
    if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		expires = "; expires="+date.toGMTString();
	}
	if (!path) {
	    path = "/";
  }
	document.cookie = name+"="+value+expires+"; path="+path+"; samesite=strict; secure";
}

export function removeCookie(name) {
    createCookie(name,"",-1);
}

class AuthService {
    loadApiToken(token) {
        createCookie("auth_token", token, 1, "/");
        console.log("API token updated!");
    }

    loadJwtTokens(accessToken, refreshToken) {
        createCookie("auth_token", accessToken, 1, "/");
        if(refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        }
        console.log("jwt token updated!");
    }

    fetchNewAccessToken() {
        return fetch(API_URL_PREFIX + "/api/v01/auth/access_token", {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("refreshToken")}`
            }
        }).then(checkStatus)
            .then(parseJSON)
            .then(r => {
                createCookie("auth_token", r.access_token, 1, "/");
                return r.access_token;
            })
    }

    getValidToken() {
        const SAFE_GUARD_DELAY = 5; // seconds of safe guards
        const refreshToken = localStorage.getItem("refreshToken");
        const token = getCookie("auth_token");
        if(refreshToken) {
          let payload = null;
          if(token) {
              const payload_str = token.split(".")[1];
              try {
                payload = JSON.parse(Base64.decode(payload_str));
              } catch(e) {
                console.error(e);
                console.log("let's fetch a new token")
              }
            }
            if(!payload || payload["exp"] < Math.floor((Date.now() / 1000) + SAFE_GUARD_DELAY)) {
                return this.fetchNewAccessToken()
            }
        }
        return Promise.resolve(token);
    }

    getToken() {
        return getCookie("auth_token");
    }

    logout() {
        localStorage.removeItem("refreshToken");
        removeCookie("auth_token");
    }

    isAuthenticated() {
        const token = this.getToken();
        return token !== null && token !== "undefined" && typeof token === "string" && token.length > 0;
    }
}

export const AuthServiceManager = new AuthService();


class UiFlavour {
    updateFlavour(f) {
        localStorage.setItem("ui-flavour", f);
    }

    updateFlavourFromModules(m) {
        if(m) {
            if(m.includes("npact")) this.updateFlavour("npact");
            else this.updateFlavour("apio");
        }
    }

    getFlavour() {
        return localStorage.getItem("ui-flavour");
    }

    isApio() {
        return this.getFlavour() === "apio";
    }

    isNpact() {
        return this.getFlavour() === "npact";
    }

    getWindowTitle() {
        return this.getFlavour().toUpperCase();
    }
}

export const UiFlavourService = new UiFlavour();


class ProvisioningProxies {
    static proxies = [];

    fetchConfiguration() {
      return fetch_get("/api/v01/apio/provisioning/gateways")
          .then(data => {
            ProvisioningProxies.proxies = data.gateways.map(g => {
              g.id = g.name.toLowerCase().replace(/[. ]/g, "");
              console.log(g);
              return g;
            })
            return ProvisioningProxies.proxies;
          })
    }

    getCurrentUrlPrefix() {
      const name = window.location.href.match(/\/provisioning\/[A-Za-z0-9_-]*\//)[0].split("/")[2];
      const e = ProvisioningProxies.proxies.filter(p => p.id === name);
      return e.length > 0?e[0].prefix:"";
    }

    listProxies() {
        return ProvisioningProxies.proxies;
    }

    findById(id) {
        return ProvisioningProxies.proxies.find(p => p.id === id);
    }
}

export const ProvProxiesManager = new ProvisioningProxies();


class NotificationsHandler {
    static rootRef = null;

    setRef(ref_) {
        NotificationsHandler.rootRef = ref_;
    }

    error(title, message, extra) {
        NotificationsHandler.rootRef &&
        NotificationsHandler.rootRef.current &&
        NotificationsHandler.rootRef.current.addNotification({
            title: title,
            message: message,
            level: 'error',
            autoDismiss: 5 * 60,
            dismissible: "both",
            ...extra
        });
    }

    success(message, extra) {
        NotificationsHandler.rootRef &&
        NotificationsHandler.rootRef.current.addNotification({
            message: message,
            level: 'success',
            ...extra
        });
    }
}

export const NotificationsManager = new NotificationsHandler();


class ApiError extends Error {
  constructor(message = 'bar', body) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message)

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }

    this.name = 'ApiError'
    // Custom debugging information
    this.body = body || {}
    this.date = new Date()
  }
}


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
          const message =
              (json.errors && json.errors[0] && json.errors[0].message) ?
                  `${json.errors[0].message}. Status Code: ${response.status}` :
                  (json.error || response.statusText);
          let error = new ApiError(message, json);
          error.response = response;
          if(json.errors) {
              error.errors = json.errors;
          }
          throw error;
        });
    }

    let error = new ApiError(response.statusText);
    error.response = response;
    throw error;
}

export function parseJSON(response) {
  return response.json()
}

export function fetch_get(url, token) {
    // const token_ = AuthServiceManager.getToken();
    const full_url = url.href || url.startsWith('http') ?url:API_URL_PREFIX + url;
    return AuthServiceManager.getValidToken()
        .then(
            token_ => fetch(full_url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token_}`
                }
            })
        )
        .then(checkStatus)
        .then(parseJSON)
}

export function fetch_put(url, body, token) {
    // const token_ = AuthServiceManager.getToken();
    const full_url = url.href?url:url.startsWith('http')?url:API_URL_PREFIX + url;
    return AuthServiceManager.getValidToken()
        .then(
            token_ => fetch(full_url, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token_}`
                },
                body: JSON.stringify(body)
            })
        ).then(checkStatus)
}

export function fetch_post(url, body, token) {
    return fetch_post_raw(url, JSON.stringify(body), token, 'application/json');
}

export function fetch_post_raw(url, raw_body, token, content_type) {
    // const token_ = AuthServiceManager.getToken();
    const full_url = url.href?url:url.startsWith('http')?url:API_URL_PREFIX + url;
    let headers = {};
    if(content_type) {
        headers['content-type'] = content_type
    }
    return AuthServiceManager.getValidToken()
        .then(
            token_ => fetch(full_url, {
                method: 'POST',
                headers: {...headers, 'Authorization': `Bearer ${token_}`},
                body: raw_body
            })
        ).then(checkStatus)
}

export function fetch_delete(url, body) {
    // const token_ = AuthServiceManager.getToken();
    const full_url = url.href?url:url.startsWith('http')?url:API_URL_PREFIX + url;
    return AuthServiceManager.getValidToken()
        .then(
            token_ => fetch(full_url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token_}`
                },
                body: JSON.stringify(body)
            })
        ).then(checkStatus)
}

export function userLocalizeUtcDate(d, userInfo) {
  if(userInfo && userInfo.timezone && userInfo.timezone.length) {
    return d.utcOffset(userInfo.timezone);
  } else {
    return d.local();
  }
}
