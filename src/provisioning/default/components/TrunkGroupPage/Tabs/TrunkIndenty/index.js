import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import Checkbox from "react-bootstrap/lib/Checkbox";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import InputGroup from "react-bootstrap/lib/InputGroup";
import Button from "react-bootstrap/lib/Button";
import Panel from "react-bootstrap/lib/Panel";

import {
  fetchGetGroupById,
  fetchPutUpdateTrunkGroup
} from "../../../../store/actions";
import Loading from "../../../../common/Loading";

import { removeEmpty } from "../../../remuveEmptyInObject";
import deepEqual from "../../../deepEqual";

export class TrunkIndenty extends Component {
  state = {
    disableButton: false,
    isLoading: true,
    trunkGroupIdentity: null,
    otgDtgIdentity: null,
    allowTerminationToTrunkGroupIdentity: null,
    allowTerminationToDtgIdentity: null,
    includeTrunkGroupIdentity: null,
    includeDtgIdentity: null,
    includeTrunkGroupIdentityForNetworkCalls: null,
    includeOtgIdentityForNetworkCalls: null,
    clearTrunkGroupIdentity: ""
  };

  fetchReq() {
    this.props
      .fetchGetGroupById(
        this.props.match.params.tenantId,
        this.props.match.params.groupId
      )
      .then(() =>
        this.setState(
          {
            isLoading: false,
            trunkGroupIdentity: this.props.trunkGroup.trunkGroupIdentity,
            otgDtgIdentity: this.props.trunkGroup.otgDtgIdentity,
            allowTerminationToTrunkGroupIdentity: this.props.trunkGroup
              .allowTerminationToTrunkGroupIdentity,
            allowTerminationToDtgIdentity: this.props.trunkGroup
              .allowTerminationToDtgIdentity,
            includeTrunkGroupIdentity: this.props.trunkGroup
              .includeTrunkGroupIdentity,
            includeDtgIdentity: this.props.trunkGroup.includeDtgIdentity,
            includeTrunkGroupIdentityForNetworkCalls: this.props.trunkGroup
              .includeTrunkGroupIdentityForNetworkCalls,
            includeOtgIdentityForNetworkCalls: this.props.trunkGroup
              .includeOtgIdentityForNetworkCalls
          },
          () => this.getTrunkGroupIdentity()
        )
      );
  }

  componentDidMount() {
    this.fetchReq();
  }

  componentDidUpdate(prevProps) {
    if (!deepEqual(this.props.trunkGroup, prevProps.trunkGroup)) {
      this.fetchReq();
    }
  }

  render() {
    if (this.state.isLoading) {
      return <Loading />;
    }
    return (
      <React.Fragment>
        <Row className={"margin-top-1"}>
          <Col md={6}>
            <Panel>
              <Panel.Heading>
                <div className={"header"}>Trunkgroup/trunk-context</div>
                <div>Settings related to trunkgroup/trunk-context</div>
              </Panel.Heading>
              <Panel.Body>
                <div className={"flex align-items-center"}>
                  <div className={"margin-right-1 flex flex-basis-16"}>
                    {`tgrp@${this.props.group.defaultDomain}`}
                  </div>
                  <InputGroup>
                    <FormControl
                      type="text"
                      value={this.state.clearTrunkGroupIdentity}
                      onChange={e =>
                        this.setState({
                          clearTrunkGroupIdentity: e.target.value
                        })
                      }
                    />
                    <InputGroup.Addon>{`@${this.props.group.defaultDomain}`}</InputGroup.Addon>
                  </InputGroup>
                </div>
                <div>
                  <Checkbox
                    checked={this.state.allowTerminationToTrunkGroupIdentity}
                    onChange={e => {
                      this.setState({
                        allowTerminationToTrunkGroupIdentity: e.target.checked
                      });
                    }}
                  >
                    {`Allow calls directly to tgrp@${this.props.group.defaultDomain}`}
                  </Checkbox>
                </div>
                <div>
                  <Checkbox
                    checked={this.state.includeTrunkGroupIdentity}
                    onChange={e => {
                      this.setState({
                        includeTrunkGroupIdentity: e.target.checked
                      });
                    }}
                  >
                    {`Include tgrp@${this.props.group.defaultDomain} in R-URI to PBX`}
                  </Checkbox>
                </div>
                <div>
                  <Checkbox
                    checked={
                      this.state.includeTrunkGroupIdentityForNetworkCalls
                    }
                    onChange={e => {
                      this.setState({
                        includeTrunkGroupIdentityForNetworkCalls:
                          e.target.checked
                      });
                    }}
                  >
                    {`Include tgrp@${this.props.group.defaultDomain} in R-URI for external calls`}
                  </Checkbox>
                </div>
              </Panel.Body>
            </Panel>
          </Col>
          <Col md={6}>
            <Panel>
              <Panel.Heading>
                <div className={"header"}>OTG/DTG</div>
                <div>
                  Settings related to Origination & destination trunkgroup
                </div>
              </Panel.Heading>
              <Panel.Body>
                <div className={"flex align-items-center"}>
                  <div className={"margin-right-1 flex flex-basis-16"}>
                    OTG/DTG
                  </div>
                  <div>
                    <FormControl
                      type="text"
                      value={this.state.otgDtgIdentity}
                      onChange={e => {
                        this.setState({
                          otgDtgIdentity: e.target.value
                        });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Checkbox
                    checked={this.state.allowTerminationToDtgIdentity}
                    onChange={e => {
                      this.setState({
                        allowTerminationToDtgIdentity: e.target.checked
                      });
                    }}
                  >
                    Allow calls directly to the dtg
                  </Checkbox>
                </div>
                <div>
                  <Checkbox
                    checked={this.state.includeDtgIdentity}
                    onChange={e => {
                      this.setState({
                        includeDtgIdentity: e.target.checked
                      });
                    }}
                  >
                    Include DTG in R-URI to PBX
                  </Checkbox>
                </div>
                <div>
                  <Checkbox
                    checked={this.state.includeOtgIdentityForNetworkCalls}
                    onChange={e => {
                      this.setState({
                        includeOtgIdentityForNetworkCalls: e.target.checked
                      });
                    }}
                  >
                    Include OTG in R-URI for external calls
                  </Checkbox>
                </div>
              </Panel.Body>
            </Panel>
          </Col>
        </Row>
        <Row className={"margin-top-1"}>
          <Col md={12}>
            <div className="button-row">
              <div className="pull-right">
                <Button
                  className={"btn-primary"}
                  onClick={this.update}
                  disabled={this.state.disableButton}
                >
                  Update
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </React.Fragment>
    );
  }
  update = () => {
    const {
      clearTrunkGroupIdentity,
      otgDtgIdentity,
      allowTerminationToTrunkGroupIdentity,
      allowTerminationToDtgIdentity,
      includeTrunkGroupIdentity,
      includeDtgIdentity,
      includeTrunkGroupIdentityForNetworkCalls,
      includeOtgIdentityForNetworkCalls
    } = this.state;

    const data = {
      trunkGroupIdentity:
        clearTrunkGroupIdentity &&
        `${clearTrunkGroupIdentity}@${this.props.group.defaultDomain}`,
      otgDtgIdentity: otgDtgIdentity && otgDtgIdentity,
      allowTerminationToTrunkGroupIdentity:
        allowTerminationToTrunkGroupIdentity &&
        allowTerminationToTrunkGroupIdentity,
      allowTerminationToDtgIdentity:
        allowTerminationToDtgIdentity && allowTerminationToDtgIdentity,
      includeTrunkGroupIdentity:
        includeTrunkGroupIdentity && includeTrunkGroupIdentity,
      includeDtgIdentity: includeDtgIdentity && includeDtgIdentity,
      includeTrunkGroupIdentityForNetworkCalls:
        includeTrunkGroupIdentityForNetworkCalls &&
        includeTrunkGroupIdentityForNetworkCalls,
      includeOtgIdentityForNetworkCalls:
        includeOtgIdentityForNetworkCalls && includeOtgIdentityForNetworkCalls
    };

    const clearData = removeEmpty(data);
    this.setState({ disableButton: true }, () =>
      this.props
        .fetchPutUpdateTrunkGroup(
          this.props.match.params.tenantId,
          this.props.match.params.groupId,
          this.props.match.params.trunkGroupName,
          clearData
        )
        .then(() => this.setState({ disableButton: false }))
    );
  };

  getTrunkGroupIdentity = () => {
    const trunkGroupIdentity = this.state.trunkGroupIdentity;
    const index = trunkGroupIdentity && trunkGroupIdentity.indexOf("@");
    this.setState({
      clearTrunkGroupIdentity: trunkGroupIdentity
        ? trunkGroupIdentity.slice(0, index ? index : Infinity)
        : this.state.trunkGroupIdentity
    });
  };
}

const mapStateToProps = state => ({
  trunkGroup: state.trunkGroup,
  group: state.group
});

const mapDispatchToProps = { fetchGetGroupById, fetchPutUpdateTrunkGroup };

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(TrunkIndenty)
);
