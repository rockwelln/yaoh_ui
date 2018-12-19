// import React from 'react';

export const API_URL_PREFIX = process.env.NODE_ENV === 'production'?window.location.origin:'http://127.0.0.1:5000';

export class AuthService {
    static getToken() {
        return localStorage.jwt;
    }

    static isAuthenticated() {
        return this.getToken() === undefined;
    }
}


export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    //let error = null;
    let contentType = response.headers.get("content-type");
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
    throw error
  }
}

export function parseJSON(response) {
  return response.json()
}

export function fetch_get(url, token) {
    const full_url = url.href?url:url.startsWith('http')?url:API_URL_PREFIX + url;
    return fetch(full_url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    }).then(checkStatus)
    .then(parseJSON)
}

export function fetch_put(url, body, token) {
    const full_url = url.href?url:url.startsWith('http')?url:API_URL_PREFIX + url;
    return fetch(full_url, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    }).then(checkStatus)
}

export function fetch_post(url, body, token) {
    const full_url = url.href?url:url.startsWith('http')?url:API_URL_PREFIX + url;
    return fetch(full_url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    }).then(checkStatus)
}

export function fetch_delete(url, token) {
    const full_url = url.href?url:url.startsWith('http')?url:API_URL_PREFIX + url;
    return fetch(full_url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then(checkStatus)
}

export function fetchOperators(token, onSuccess, onError) {
  fetch_get('/api/v01/voo/operators', token)
      .then(data => {
          let operators = data.operators.sort((a, b) => (a.name < b.name)?-1:1);
          onSuccess && onSuccess(operators);
      })
      .catch(error => {
          onError && onError(error)
      });
}
