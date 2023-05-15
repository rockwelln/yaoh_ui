import { API_URL_PREFIX, fetch_delete, fetch_get, fetch_post } from "../utils";
import base64url from "base64url"; 

export function getWebauthnOptions() {
    return fetch_get("/api/v01/system/users/local/webauthn")
    .then(o => {
        o.publicKey.user.id = base64url.toBuffer(o.publicKey.user.id);
        o.publicKey.challenge = base64url.toBuffer(o.publicKey.challenge);
        return o;
    })
}

export function deletePasskey(id) {
    return fetch_delete(`/api/v01/system/users/local/webauthn/${id}`)
}

export function deleteUserPasskey(uid, id) {
    return fetch_delete(`/api/v01/system/users/${uid}/webauthn/${id}`)
}

export function registerWebauthn(name, cred) {
    const credential = {};
    credential.id = cred.id;
    credential.raw_id = base64url.encode(cred.rawId);
    credential.type = cred.type;

    if (cred.response) {
        const clientDataJSON =
            base64url.encode(cred.response.clientDataJSON);
        const attestationObject =
            base64url.encode(cred.response.attestationObject);
        credential.response = {
            clientDataJSON,
            attestationObject,
        };
    }

    // Store the credential ID locally so that you can use it for authentication when the user comes back
    localStorage.setItem(`credId`, credential.id);
    return fetch_post(`/api/v01/system/users/local/webauthn?name=${encodeURIComponent(name)}`, credential);
}

async function signIn(credential) {
    let url = '/api/v01/auth/webauthn';
    url += `?cred_id=${encodeURIComponent(credential.id)}`;
    return await fetch(API_URL_PREFIX + url, {
        method: 'POST',
        body: JSON.stringify(credential),
    }).then(response => {
        if(response.status >= 200 && response.status < 300) {
            return response;
        }
        const contentType = response.headers.get("content-type");
        if(contentType && contentType.indexOf("application/json") !== -1) {
            return response.json().then(function(json) {
              const message =
                  (json.errors && json.errors[0] && json.errors[0].message) ?
                      `${json.errors[0].message}. Status Code: ${response.status}` :
                      (json.error || response.statusText);
              let error = new Error(message);
              error.response = response;
              if(json.errors) {
                  error.errors = json.errors;
              }
              throw error;
            });
        }
        if(response.status === 401) {
            throw new Error("invalid credentials");
        }

        let error = new Error(response.statusText);
        error.response = response;
        throw error;
    })
}

export function webauthnAuthenticationRequest() {
    const opts = {};

    let url = '/api/v01/auth/webauthn';
    const credId = localStorage.getItem(`credId`);
    if (credId) {
        url += `?cred_id=${encodeURIComponent(credId)}`;
    }
  
    return fetch_get(url, opts).then(o => {
        if(o.publicKey.allowCredentials) {
            for (let cred of o.publicKey.allowCredentials) {
                cred.id = base64url.toBuffer(cred.id);
            }
        }
        o.publicKey.challenge = base64url.toBuffer(o.publicKey.challenge);
        return o;
    }).catch(e => {
        if(e.response.status === 503) {
            throw new Error('not supported');
        }
        throw e
    });
}

const abortController = new AbortController();

export async function conditionalWebauthN() {
    const enabled = await isWebauthnAvailable();
    if(!enabled) throw new Error('not supported');

    let options = await webauthnAuthenticationRequest();
    options.signal = abortController.signal;
    // Specify 'conditional' to activate conditional UI
    // it will then "bock" until the user picks a Webauthn option 
    options.mediation = 'conditional';
    const cred = await navigator.credentials.get(options);

    const credential = {};
    credential.id = cred.id;
    credential.type = cred.type;
    credential.rawId = base64url.encode(cred.rawId);

    if (cred.response) {
        const clientDataJSON =
            base64url.encode(cred.response.clientDataJSON);
        const authenticatorData =
            base64url.encode(cred.response.authenticatorData);
        const signature =
            base64url.encode(cred.response.signature);
        const userHandle =
            base64url.encode(cred.response.userHandle);
        credential.response = {
        clientDataJSON,
        authenticatorData,
        signature,
        userHandle,
        };
    }

    return await signIn(credential);
    // let url = '/api/v01/auth/webauthn';
    // url += `?cred_id=${encodeURIComponent(credential.id)}`;
    // return await fetch_post(url, credential);
}

export function isWebauthnAvailable() {
    // Availability of `window.PublicKeyCredential` means WebAuthn is usable.  
    // `isUserVerifyingPlatformAuthenticatorAvailable` means the feature detection is usable.  
    // `​​isConditionalMediationAvailable` means the feature detection is usable.  
    if (window.PublicKeyCredential &&  
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&  
    window.PublicKeyCredential.isConditionalMediationAvailable) {  
        // Check if user verifying platform authenticator is available.  
        return Promise.all([  
            window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),  
            window.PublicKeyCredential.isConditionalMediationAvailable(),  
        ]).then(results => {
            console.log("results", results)
            return results.every(r => r === true);
        });
    }
    return Promise.resolve(false);
}
