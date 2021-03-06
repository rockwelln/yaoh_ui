import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import Button from "react-bootstrap/lib/Button";

import { fetchPutUpdateTrunkGroup } from "../../../../store/actions";

export class Details extends Component {
  state = {
    pilotUserId: null,
    disableButton: false,
    sipAuthenticationPassword: "",
    showDevice: false,
  };

  componentDidMount() {
    this.setState({
      pilotUserId: this.props.trunkGroup.pilotUserId
        ? this.props.trunkGroup.pilotUserId
        : ""
    });
  }

  render() {
    return (
      <React.Fragment>
        <Row className={"margin-top-1"}>
          <Col md={12} className={"flex align-items-center"}>
            <div className={"margin-right-1 flex flex-basis-16"}>
              Pilot user
            </div>
            <div>
              <FormControl
                componentClass="select"
                value={this.state.pilotUserId}
                onChange={(e) => this.setState({ pilotUserId: e.target.value })}
              >
                <option value={""}>None</option>
                {this.props.trunkGroupUsers.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.userId}
                  </option>
                ))}
              </FormControl>
            </div>
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
    const { pilotUserId } = this.state;

    const data = {
      pilotUserId,
    };

    this.setState({ disableButton: true }, () =>
      this.props
        .fetchPutUpdateTrunkGroup(
          this.props.match.params.tenantId,
          this.props.match.params.groupId,
          this.props.match.params.trunkGroupName,
          data
        )
        .then(() => this.setState({ disableButton: false }))
    );
  };
}

const mapStateToProps = (state) => ({
  trunkGroup: state.trunkGroup,
  trunkGroupUsers: state.trunkGroupUsers,
});

const mapDispatchToProps = { fetchPutUpdateTrunkGroup };

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Details)
);
