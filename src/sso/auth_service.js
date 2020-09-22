const getClientSettings = () => {
  return {
    authority: 'http://localhost:7777/auth/realms/master',
    client_id: 'myclient',
    client_secret: 'de9eb896-3a9a-4266-817c-8b1934feb581',
    redirect_uri: `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/auth-callback`,
    silent_redirect_uri: `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/auth-silent-callback`,
    response_type: "code",
    scope: "openid profile email",
    automaticSilentRenew: false,
    filterProtocolClaims: true,
    loadUserInfo: true
  };
};

class AuthService {
  manager = null;
  user = null;

  enableOidc() {
    import("oidc-client").then(c => {
      this.manager = new c.UserManager(getClientSettings());
      this.manager.getUser().then(user => {
        this.user = user;
      });

      this.manager.events.addAccessTokenExpired(this.signinSilent.bind(this));
      this.manager.events.addAccessTokenExpiring(() => console.log("token expiring"));
    })
  }

  isLoggedIn() {
    return this.user != null && !this.user.expired;
  }

  getClaims() {
    return this.user.profile;
  }

  getAuthorizationHeaderValue() {
    return `${this.user.token_type} ${this.user.access_token}`;
  }

  startAuthentication() {
    if(!this.manager) {
      return
    }
    return this.manager.signinRedirect();
  }

  removeUser() {
      return (
          this.manager && this.manager.clearStaleState()
              .then(() => this.manager.removeUser())
              .then(() => this.user = null)
      )
  }

  signinSilent() {
      const config = getClientSettings();
      return this.manager.signinSilent({client_secret: config.client_secret});
  }

  completeAuthentication() {
    return this.manager.signinRedirectCallback().then(user => {
      this.user = user;
    });
  }
}

export const sso_auth_service = new AuthService();
