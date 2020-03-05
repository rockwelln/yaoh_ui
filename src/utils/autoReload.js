import React, { Component } from "react";

class AutoReload extends Component {
  constructor(props) {
    super(props);
    this.previousHash = null;
    this.state = {
      codeHasChanged: false,
    };
    this.fetchSource = this.fetchSource.bind(this);
  }

  componentDidMount() {
    const { tryDelay } = this.props;
    this.fetchSource();
    this.interval = setInterval(this.fetchSource, tryDelay);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  fetchSource() {
    return fetch(this.props.url)
      .then(response => {
        if (response.status !== 200) {
          throw new Error("offline");
        }
        return response.text();
      })
      .then(html => {
        const hash = this.hash(html);
        if (!this.previousHash) {
          this.previousHash = hash;
          return;
        }
        if (this.previousHash !== hash) {
          this.previousHash = hash;
          this.setState({ codeHasChanged: true });
        }
      })
      .catch(() => {
        /* do nothing */
      });
  }

  /**
   * Java-like hashCode function for strings
   *
   * taken from http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery/7616484#7616484
   */
  hash(str) {
    const len = str.length;
    let hash = 0;
    if (len === 0) return hash;
    let i;
    for (i = 0; i < len; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  reloadApp(e) {
    window.location.reload(true);
    e.preventDefault();
  }

  render() {
    if (!this.state.codeHasChanged) return null;
    const style = {
      position: "absolute",
      top: 10,
      right: 10,
      padding: "1em",
      zIndex: 1050,
      backgroundColor: "#c0f2f2",
      borderRadius: 5,
      textAlign: "center",
    };
    return (
      <div style={style}>
        <div>A new version is available!</div>
        <div>
          <a href="#" onClick={this.reloadApp}>
            Click to reload
          </a>
        </div>
      </div>
    );
  }
}

AutoReload.defaultProps = {
  url: "/",
  tryDelay: 10 * 60 * 1000, // 10 minutes
};

export default AutoReload;