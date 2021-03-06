import React, { Component } from "react";
import { withRouter } from "react-router";
import { connect } from "react-redux";

import Tabs from "react-bootstrap/lib/Tabs";
import Tab from "react-bootstrap/lib/Tab";
import Glyphicon from "react-bootstrap/lib/Glyphicon";

import Loading from "../../common/Loading";

import { fetchGetTrunkGroupByName } from "../../store/actions";

import Users from "./Tabs/Users";
import Backup from "./Tabs/Backup";
import Details from "./Tabs/Details";
import TrunkIndenty from "./Tabs/TrunkIndenty";
import Capacity from "./Tabs/Capacity";
import CallScreening from "./Tabs/CallScreening";
import StatefulRerouting from "./Tabs/StatefulRerouting";
import CLI from "./Tabs/CLI";
import Advanced from "./Tabs/Advanced";
import Authentication from "./Tabs/Authentication";
import DeleteModal from "./DeleteModal";

class TrunkGroupPage extends Component {
  state = {
    isLoading: true,
    isLoadingConfig: true,
    showDelete: false,
    activeKey: 0,
  };

  fetchTrunk() {
    this.props
      .fetchGetTrunkGroupByName(
        this.props.match.params.tenantId,
        this.props.match.params.groupId,
        this.props.match.params.trunkGroupName
      )
      .then(() => this.setState({ isLoading: false }));
  }

  componentDidMount() {
    this.fetchTrunk();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.match.params.trunkGroupName !==
      this.props.match.params.trunkGroupName
    ) {
      this.setState({ isLoading: true }, () => this.fetchTrunk());
    }
  }

  render() {
    const { isLoading } = this.state;
    return (
      <React.Fragment>
        <div className={"panel-heading"}>
          <div className={"header"}>
            {`Name: ${this.props.match.params.trunkGroupName}`}{" "}
            <Glyphicon
              glyph="glyphicon glyphicon-trash"
              onClick={() => this.setState({ showDelete: true })}
            />
            <DeleteModal
              trunkGroupName={this.props.match.params.trunkGroupName}
              show={this.state.showDelete}
              onClose={() => {
                this.setState({ showDelete: false });
              }}
            />
          </div>
          <div>{`Level: ${
            this.props.trunkGroup.accessDevice
              ? this.props.trunkGroup.accessDevice.level
              : ""
          }`}</div>
        </div>
        <div className={"panel-body"}>
          <Tabs
            activeKey={this.state.activeKey}
            id="tenant_tabs"
            onSelect={(key) => {
              this.setState({ isLoading: true, activeKey: key }, () =>
                this.fetchTrunk()
              );
            }}
          >
            <Tab eventKey={0} title="Pilot">
              {isLoading ? <Loading /> : <Details />}
            </Tab>
            <Tab eventKey={9} title="Access details">
              {isLoading ? <Loading /> : <Authentication />}
            </Tab>
            <Tab eventKey={1} title="DIDs">
              {isLoading ? <Loading /> : <Users />}
            </Tab>
            <Tab eventKey={2} title="Trunk indentity">
              {isLoading ? <Loading /> : <TrunkIndenty />}
            </Tab>
            <Tab eventKey={3} title="Backup">
              {isLoading ? <Loading /> : <Backup />}
            </Tab>
            <Tab eventKey={4} title="Capacity">
              {isLoading ? <Loading /> : <Capacity />}
            </Tab>
            <Tab eventKey={5} title="Call screening">
              {isLoading ? <Loading /> : <CallScreening />}
            </Tab>
            <Tab eventKey={6} title="Stateful rerouting">
              {isLoading ? <Loading /> : <StatefulRerouting />}
            </Tab>
            <Tab eventKey={7} title="Outgoing CLI overwrite">
              {isLoading ? <Loading /> : <CLI />}
            </Tab>
            <Tab eventKey={8} title="Advanced">
              {isLoading ? <Loading /> : <Advanced />}
            </Tab>
          </Tabs>
        </div>
      </React.Fragment>
    );
  }
}

const mapDispatchToProps = { fetchGetTrunkGroupByName };

const mapStateToProps = (state) => ({
  trunkGroup: state.trunkGroup,
});

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(TrunkGroupPage)
);
