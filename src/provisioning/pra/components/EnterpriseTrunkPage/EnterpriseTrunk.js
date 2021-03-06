import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import Tabs from "react-bootstrap/lib/Tabs";
import Tab from "react-bootstrap/lib/Tab";
import MainConfig from "./Tabs/MainConfig";
import Numbers from "./Tabs/Numbers";

import {
  fetchGetIADsByTrunk,
  fetchPutUpdateEnterpriseTrunk
} from "../../store/actions";

export class EnterpriseTrunk extends Component {
  render() {
    return (
      <React.Fragment>
        <div className={"panel-heading"}>
          <p className={"header"}>
            {`Enterprise Trunk: ${this.props.match.params.entTrunkId}`}
          </p>
          <p>
            {`Select numbers from other ET's and transfer/add them to this ET`}
          </p>
        </div>
        <div className={"panel-body"}>
          <Tabs
            className={"margin-top-1"}
            activeKey={
              this.props.location.state && this.props.location.state.defaultTab
                ? this.props.location.state.defaultTab
                : this.returnActiveKey()
            }
            onSelect={key => this.tabRouting(key)}
            id={`group_tabs${this.tabsIdSuffix}`}
          >
            <Tab eventKey={0} title="Main Config">
              <MainConfig />
            </Tab>
            <Tab eventKey={1} title="Numbers">
              <Numbers />
            </Tab>
          </Tabs>
        </div>
      </React.Fragment>
    );
  }
  tabRouting = key => {
    switch (key) {
      case 0:
        this.props.history.push("#mainConfig");
        break;
      case 1:
        this.props.history.push("#numbers");
        break;
    }
  };

  returnActiveKey = () => {
    switch (this.props.location.hash) {
      case "#mainConfig":
        return 0;

      case "#numbers":
        return 1;
      default:
        return 0;
    }
  };
}

const mapStateToProps = state => ({
  iadsByTrunk: state.iadsByTrunk
});

const mapDispatchToProps = {
  fetchGetIADsByTrunk,
  fetchPutUpdateEnterpriseTrunk
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(EnterpriseTrunk)
);
