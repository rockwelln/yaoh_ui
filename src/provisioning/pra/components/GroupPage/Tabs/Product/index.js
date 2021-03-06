import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Button from "react-bootstrap/lib/Button";
import FormGroup from "react-bootstrap/lib/FormGroup";
import HelpBlock from "react-bootstrap/lib/HelpBlock";

import { FormattedMessage } from "react-intl";
import Loading from "../../../../common/Loading";
import { removeEmpty } from "../../../remuveEmptyInObject";

import {
  fetchGetConfig,
  fetchGetGroupById,
  fetchPutUpdateGroupDetails,
  fetchGetIADs
} from "../../../../store/actions";

export class Product extends Component {
  state = {
    isLoading: true,
    group: {},
    disableButton: false,
    seviceTypeError: null,
    textSerivceTypeError: ""
  };
  componentDidMount() {
    this.props
      .fetchGetGroupById(
        this.props.match.params.tenantId,
        this.props.match.params.groupId
      )
      .then(() =>
        this.setState({ group: this.props.group }, () =>
          this.props.fetchGetConfig().then(() =>
            this.setState({
              isLoading: false,
              group: {
                ...this.state.group,
                pbxType:
                  this.state.group.pbxType ||
                  this.props.config.tenant.group.pbxType[0].value,
                accessType:
                  this.state.group.accessType ||
                  this.props.config.tenant.group.accessType[0].value,
                serviceType:
                  this.state.group.serviceType ||
                  this.props.config.tenant.group.serviceType[0].value,
                np1Redundancy: this.state.group.np1Redundancy || false
              },
              isRedundant: ~this.props.config.tenant.group.iad[
                "2EDUsForServiceTypes"
              ].indexOf(this.state.group.serviceType)
                ? "redundant"
                : "nonRedundant"
            })
          )
        )
      );
  }
  render() {
    if (this.state.isLoading) {
      return (
        <div>
          <Loading />
        </div>
      );
    }
    return (
      <React.Fragment>
        <Row className={"margin-top-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-16"}>
              <ControlLabel>
                <FormattedMessage id="pbxType" defaultMessage="Type of IAD" />
              </ControlLabel>
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
              <FormControl
                componentClass="select"
                value={this.state.group.pbxType}
                onChange={e =>
                  this.setState({
                    group: {
                      ...this.state.group,
                      pbxType: e.target.value
                    }
                  })
                }
                disabled
              >
                {this.props.config.tenant.group.pbxType.map((el, i) => (
                  <option key={i} value={el.value}>
                    {el.label}
                  </option>
                ))}
              </FormControl>
            </div>
          </Col>
        </Row>
        <Row className={"margin-top-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-16"}>
              <ControlLabel>
                <FormattedMessage
                  id="accessType"
                  defaultMessage="Type of access"
                />
              </ControlLabel>
            </div>
            <div className={"margin-right-1 flex-basis-33"}>
              <FormControl
                componentClass="select"
                value={this.state.group.accessType}
                onChange={e =>
                  this.setState({
                    group: {
                      ...this.state.group,
                      accessType: e.target.value
                    }
                  })
                }
                disabled
              >
                {this.props.config.tenant.group.accessType.map((el, i) => (
                  <option key={i} value={el.value}>
                    {el.label}
                  </option>
                ))}
              </FormControl>
            </div>
          </Col>
        </Row>
        <FormGroup
          controlId="channelIn"
          validationState={this.state.seviceTypeError}
        >
          <Row className={"margin-top-1"}>
            <Col md={12} className={"flex align-items-center"}>
              <div className={"margin-right-1 flex flex-basis-16"}>
                <ControlLabel>
                  <FormattedMessage
                    id="serviceType"
                    defaultMessage="Service Type"
                  />
                </ControlLabel>
              </div>
              <div className={"margin-right-1 flex-basis-33"}>
                <FormControl
                  componentClass="select"
                  value={this.state.group.serviceType}
                  onChange={this.updateServiceType}
                >
                  {this.props.config.tenant.group.serviceType.map((el, i) => (
                    <option key={i} value={el.value}>
                      {el.label}
                    </option>
                  ))}
                </FormControl>
              </div>
            </Col>
          </Row>
          {this.state.seviceTypeError && (
            <Row className={"margin-top-1"}>
              <Col md={12} className={"flex align-items-center"}>
                <div className={"margin-right-1 flex flex-basis-16"}></div>
                <div className={"margin-right-1 flex-basis-33"}>
                  <HelpBlock>{this.state.textSerivceTypeError}</HelpBlock>
                </div>
              </Col>
            </Row>
          )}
        </FormGroup>
        {(this.state.group.pbxType === "SIP" ||
          this.state.group.pbxType === "SIP_PRA") && (
          <Row className={"margin-top-1"}>
            <Col md={12} className={"flex align-items-center"}>
              <div className={"margin-right-1 flex flex-basis-16"}>
                <ControlLabel>
                  <FormattedMessage
                    id="np1Redundancy"
                    defaultMessage="N+1 Redundancy"
                  />
                </ControlLabel>
              </div>
              <div className={"margin-right-1 flex-basis-33"}>
                <Checkbox
                  defaultChecked={this.state.group.np1Redundancy}
                  onChange={e => {
                    this.setState({
                      group: {
                        ...this.state.group,
                        np1Redundancy: e.target.checked
                      }
                    });
                  }}
                  disabled
                />
              </div>
            </Col>
          </Row>
        )}
        <Row>
          <div className="button-row">
            <div className="pull-right">
              <Button
                onClick={this.updateProduct}
                className={"btn-primary"}
                disabled={
                  this.state.disableButton ||
                  this.state.seviceTypeError === "error"
                }
              >
                {this.state.disableButton ? (
                  <FormattedMessage
                    id="updating"
                    defaultMessage="Updating..."
                  />
                ) : (
                  <FormattedMessage id="update" defaultMessage="Update" />
                )}
              </Button>
            </div>
          </div>
        </Row>
      </React.Fragment>
    );
  }

  updateServiceType = e => {
    const targetValue = e.target.value;
    if (
      ~this.props.config.tenant.group.iad["2EDUsForServiceTypes"].indexOf(
        targetValue
      ) &&
      this.state.isRedundant === "nonRedundant"
    ) {
      this.setState({
        group: {
          ...this.state.group,
          serviceType: targetValue
        },
        seviceTypeError: "warning",
        textSerivceTypeError:
          "You will have to configure an extra EDU for each IAD"
      });
      return;
    } else if (
      !~this.props.config.tenant.group.iad["2EDUsForServiceTypes"].indexOf(
        targetValue
      ) &&
      this.state.isRedundant === "redundant"
    ) {
      this.setState({
        seviceTypeError: "error",
        textSerivceTypeError:
          "It is not allowed to move from a Redundant Service Type to a Non-Redundant one"
      });
      return;
    }

    this.setState({
      group: {
        ...this.state.group,
        serviceType: targetValue
      },
      seviceTypeError: null,
      textSerivceTypeError: ""
    });
  };

  updateProduct = () => {
    const {
      pbxType,
      accessType,
      serviceType,
      np1Redundancy
    } = this.state.group;
    const data = {
      //pbxType,
      //accessType,
      serviceType
      //np1Redundancy
    };
    this.setState({ disableButton: true });
    const clearData = removeEmpty(data);
    this.props
      .fetchPutUpdateGroupDetails(
        this.props.match.params.tenantId,
        this.props.match.params.groupId,
        clearData
      )
      .then(() => {
        this.props.fetchGetIADs(
          this.props.match.params.tenantId,
          this.props.match.params.groupId
        );
        this.setState({ disableButton: false });
      });
  };
}

const mapStateToProps = state => ({ group: state.group, config: state.config });

const mapDispatchToProps = {
  fetchGetConfig,
  fetchGetGroupById,
  fetchPutUpdateGroupDetails,
  fetchGetIADs
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(Product)
);
