import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import Checkbox from "react-bootstrap/lib/Checkbox";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import Button from "react-bootstrap/lib/Button";
import OverlayTrigger from "react-bootstrap/lib/OverlayTrigger";
import Tooltip from "react-bootstrap/lib/Tooltip";

import {
  fetchPutUpdateTrunkGroup,
  fetchGetTrunkByGroupID,
} from "../../../../store/actions";

import { removeEmpty } from "../../../remuveEmptyInObject";
import Loading from "../../../../common/Loading";

export class Capacity extends Component {
  state = {
    disableButton: false,
    maxActiveCalls: null,
    maxIncomingCalls: null,
    maxOutgoingCalls: null,
    enableBursting: null,
    burstingMaxActiveCalls: null,
    burstingMaxIncomingCalls: null,
    burstingMaxOutgoingCalls: null,
    isLoading: true,
  };

  componentDidMount() {
    this.props
      .fetchGetTrunkByGroupID(
        this.props.match.params.tenantId,
        this.props.match.params.groupId
      )
      .then(() => this.setState({ isLoading: false }));
    this.setState({
      maxActiveCalls: this.props.trunkGroup.maxActiveCalls
        ? this.props.trunkGroup.maxActiveCalls
        : "",
      maxIncomingCalls: this.props.trunkGroup.maxIncomingCalls
        ? this.props.trunkGroup.maxIncomingCalls
        : "",
      maxOutgoingCalls: this.props.trunkGroup.maxOutgoingCalls
        ? this.props.trunkGroup.maxOutgoingCalls
        : "",
      enableBursting: this.props.trunkGroup.enableBursting
        ? this.props.trunkGroup.enableBursting
        : false,
      burstingMaxActiveCalls: this.props.trunkGroup.burstingMaxActiveCalls
        ? this.props.trunkGroup.burstingMaxActiveCalls
        : "",
      burstingMaxIncomingCalls: this.props.trunkGroup.burstingMaxIncomingCalls
        ? this.props.trunkGroup.burstingMaxIncomingCalls
        : "",
      burstingMaxOutgoingCalls: this.props.trunkGroup.burstingMaxOutgoingCalls
        ? this.props.trunkGroup.burstingMaxOutgoingCalls
        : "",
    });
  }

  render() {
    if (this.state.isLoading) {
      return <Loading />;
    }

    console.log(this.props.groupTrunkGroupInfo);

    return (
      <React.Fragment>
        <Row className={"margin-top-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Maximum number of simultaenous calls
            </div>
            <div className={"flex flex-basis-33"}>
              <FormControl
                type="number"
                value={this.state.maxActiveCalls}
                max={this.props.groupTrunkGroupInfo.maxActiveCalls}
                min={0}
                onChange={(e) => {
                  if (
                    this.props.groupTrunkGroupInfo.maxActiveCalls <
                    e.target.value
                  ) {
                    return;
                  }
                  this.setState({
                    maxActiveCalls: Number(e.target.value),
                  });
                }}
              />
            </div>
          </Col>
        </Row>
        <Row className={"margin-top-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Maximum number of ongoing incoming calls
            </div>
            <div className={"flex flex-basis-33"}>
              <FormControl
                type="number"
                value={this.state.maxIncomingCalls}
                max={this.props.groupTrunkGroupInfo.maxActiveCalls}
                min={0}
                onChange={(e) => {
                  this.setState({
                    maxIncomingCalls: Number(e.target.value),
                  });
                }}
              />
            </div>
          </Col>
        </Row>
        <Row className={"margin-top-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-33"}>
              Maximum number of ongoing outgoing calls
            </div>
            <div className={"flex flex-basis-33"}>
              <FormControl
                type="number"
                value={this.state.maxOutgoingCalls}
                max={this.props.groupTrunkGroupInfo.maxActiveCalls}
                min={0}
                onChange={(e) => {
                  this.setState({
                    maxOutgoingCalls: Number(e.target.value),
                  });
                }}
              />
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={12} className={"flex align-items-center"}>
            <OverlayTrigger
              placement="top"
              overlay={
                !this.props.groupTrunkGroupInfo?.burstingMaxActiveCalls
                  .unlimited &&
                !this.props.groupTrunkGroupInfo?.burstingMaxActiveCalls
                  .maximum ? (
                  <Tooltip id="tooltip">
                    No bursting capacity available for this group
                  </Tooltip>
                ) : (
                  <div />
                )
              }
            >
              <Checkbox
                checked={this.state.enableBursting}
                onChange={(e) => {
                  this.setState({ enableBursting: e.target.checked });
                }}
                disabled={
                  !this.props.groupTrunkGroupInfo?.burstingMaxActiveCalls
                    .unlimited &&
                  !this.props.groupTrunkGroupInfo?.burstingMaxActiveCalls
                    .maximum
                }
              >
                Allow bursting
              </Checkbox>
            </OverlayTrigger>
          </Col>
        </Row>
        {this.state.enableBursting && (
          <>
            <Row className={"margin-top-1"}>
              <Col md={12} className={"flex align-items-center"}>
                <div className={"margin-right-1 flex flex-basis-33"}>
                  Maximum amount of simultaneous calls in bursting*
                </div>
                <div className={"flex flex-basis-33"}>
                  <FormControl
                    type="number"
                    value={this.state.burstingMaxActiveCalls}
                    max={
                      this.props.groupTrunkGroupInfo.burstingMaxActiveCalls
                        .unlimited
                        ? null
                        : this.props.groupTrunkGroupInfo.burstingMaxActiveCalls
                            .maximum
                    }
                    min={0}
                    onChange={(e) => {
                      this.setState({
                        burstingMaxActiveCalls: Number(e.target.value),
                      });
                    }}
                  />
                </div>
              </Col>
            </Row>
            <Row className={"margin-top-1"}>
              <Col md={12} className={"flex align-items-center"}>
                <div className={"margin-right-1 flex flex-basis-33"}>
                  Maximum amount of ongoing incoming calls in bursting
                </div>
                <div className={"flex flex-basis-33"}>
                  <FormControl
                    type="number"
                    value={this.state.burstingMaxIncomingCalls}
                    max={
                      this.props.groupTrunkGroupInfo.burstingMaxActiveCalls
                        .unlimited
                        ? null
                        : this.props.groupTrunkGroupInfo.burstingMaxActiveCalls
                            .maximum
                    }
                    min={0}
                    onChange={(e) => {
                      this.setState({
                        burstingMaxIncomingCalls: Number(e.target.value),
                      });
                    }}
                  />
                </div>
              </Col>
            </Row>
            <Row className={"margin-top-1"}>
              <Col md={12} className={"flex align-items-center"}>
                <div className={"margin-right-1 flex flex-basis-33"}>
                  Maximum amount of ongoing outgoing calls in bursting
                </div>
                <div className={"flex flex-basis-33"}>
                  <FormControl
                    type="number"
                    value={this.state.burstingMaxOutgoingCalls}
                    max={
                      this.props.groupTrunkGroupInfo.burstingMaxActiveCalls
                        .unlimited
                        ? null
                        : this.props.groupTrunkGroupInfo.burstingMaxActiveCalls
                            .maximum
                    }
                    min={0}
                    onChange={(e) => {
                      this.setState({
                        burstingMaxOutgoingCalls: Number(e.target.value),
                      });
                    }}
                  />
                </div>
              </Col>
            </Row>
          </>
        )}
        <Row className={"margin-top-1"}>
          <Col md={12}>
            <div className="button-row">
              <div className="pull-right">
                <Button
                  className={"btn-primary"}
                  onClick={this.update}
                  disabled={
                    this.state.disableButton ||
                    this.getDisableButtonByBursting()
                  }
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

  getDisableButtonByBursting = () => {
    return this.state.enableBursting && !this.state.burstingMaxActiveCalls;
  };

  update = () => {
    const {
      maxActiveCalls,
      maxIncomingCalls,
      maxOutgoingCalls,
      enableBursting,
      burstingMaxActiveCalls,
      burstingMaxIncomingCalls,
      burstingMaxOutgoingCalls,
    } = this.state;

    const data = {
      maxActiveCalls: maxActiveCalls && maxActiveCalls,
      maxIncomingCalls: maxIncomingCalls && maxIncomingCalls,
      maxOutgoingCalls: maxOutgoingCalls && maxOutgoingCalls,
      enableBursting: enableBursting && enableBursting,
      burstingMaxActiveCalls: burstingMaxActiveCalls && burstingMaxActiveCalls,
      burstingMaxIncomingCalls:
        burstingMaxIncomingCalls && burstingMaxIncomingCalls,
      burstingMaxOutgoingCalls:
        burstingMaxOutgoingCalls && burstingMaxOutgoingCalls,
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
}

const mapStateToProps = (state) => ({
  trunkGroup: state.trunkGroup,
  groupTrunkGroupInfo: state.trunkGroups,
});

const mapDispatchToProps = { fetchPutUpdateTrunkGroup, fetchGetTrunkByGroupID };

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Capacity)
);
