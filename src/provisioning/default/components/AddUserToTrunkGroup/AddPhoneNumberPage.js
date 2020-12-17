import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormGroup from "react-bootstrap/lib/FormGroup";
import Radio from "react-bootstrap/lib/Radio";

import {
  fetchGetPhoneNumbersByGroupId,
  refuseAddPhoneToTenant,
  changeStepOfAddPhoneTenant,
  fetchGetMobileNumbersForTenant,
  fetchGetSelfcareURL
} from "../../store/actions";
import Loading from "../../common/Loading";

import SelectAvalibleNumbers from "./SelectAvalibleNumbers";
import AddUserPage from "./AddUserPage";
import { get } from "../get";

export class AddPhoneNumberPage extends Component {
  state = { isLoadNewPhones: null, isLoading: true, isLoadingSCURL: true };

  componentDidMount() {
    this.props.changeStepOfAddPhoneTenant("Basic");
    this.props.fetchGetSelfcareURL().then(() => {
      this.setState({ isLoadingSCURL: false });
      if (
        get(this.props, "selfcareUrl.modules.nims") &&
        this.props.selfcareUrl.modules.nims
      ) {
        this.setState(
          {
            isLoadNewPhones: "not load"
          },
          () => {
            this.props
              .fetchGetPhoneNumbersByGroupId(
                this.props.match.params.tenantId,
                this.props.match.params.groupId
              )
              .then(() => this.setState({ isLoading: false }));
          }
        );
      }
    });
  }

  componentDidUpdate(prevProps) {
    if (
      JSON.stringify(prevProps.availableNumbersTenant) !==
      JSON.stringify(this.props.availableNumbersTenant)
    ) {
      this.fetchAvailableNumbers();
    }
  }

  fetchAvailableNumbers = () => {
    this.setState({ isLoading: true }, () => {
      this.props
        .fetchGetPhoneNumbersByGroupId(
          this.props.match.params.tenantId,
          this.props.match.params.groupId
        )
        .then(() => this.setState({ isLoading: false }));
    });
  };

  render() {
    const pathNameArr = this.props.location.pathname.split("/");

    if (this.state.isLoadingSCURL) {
      return <Loading />;
    }

    return (
      <React.Fragment>
        <div className={"header panel-heading"}>
          Add phonenumbers to trunkgroup
        </div>
        <div className={"panel-body"}>
          <Row>
            <Col md={12}>
              Please select how you want to add phonenumbers to this group:
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <FormGroup>
                <Radio
                  className={"margin-left-1"}
                  name="addPhoneGroups"
                  checked={this.state.isLoadNewPhones === "not load"}
                  onChange={() => {
                    this.props.refuseAddPhoneToTenant();
                    this.setState(
                      {
                        isLoadNewPhones: "not load"
                      },
                      () => {
                        pathNameArr[pathNameArr.length - 1] ===
                        "add-mobile-phone"
                          ? this.props
                              .fetchGetMobileNumbersForTenant(
                                this.props.match.params.tenantId
                              )
                              .then(() => this.setState({ isLoading: false }))
                          : this.props
                              .fetchGetPhoneNumbersByGroupId(
                                this.props.match.params.tenantId,
                                this.props.match.params.groupId
                              )
                              .then(() => this.setState({ isLoading: false }));
                      }
                    );
                  }}
                >
                  <div>I want to select free numbers from the group level</div>
                </Radio>
                <Radio
                  className={"margin-left-1"}
                  name="addPhoneGroups"
                  checked={this.state.isLoadNewPhones === "load"}
                  onChange={() =>
                    this.setState({
                      isLoadNewPhones: "load"
                    })
                  }
                  disabled={
                    pathNameArr[pathNameArr.length - 1] ===
                      "add-mobile-phone" ||
                    (get(this.props, "selfcareUrl.modules.nims") &&
                      this.props.selfcareUrl.modules.nims)
                  }
                >
                  <div>
                    I want to add a range (start/end - free entry). If not yet
                    assigned to the tenant, add them for me!
                  </div>
                </Radio>
              </FormGroup>
            </Col>
          </Row>
          {this.state.isLoadNewPhones === "not load" && (
            <Row>
              <Col md={12}>
                {this.state.isLoading ? (
                  <Loading />
                ) : (
                  <SelectAvalibleNumbers
                    phoneNumbers={this.props.availableNumbersTenant}
                    toUpdate={() => {
                      this.props.fetchGetPhoneNumbersByGroupId(
                        this.props.match.params.tenantId,
                        this.props.match.params.groupId
                      );
                    }}
                  />
                )}
              </Col>
            </Row>
          )}
          {this.state.isLoadNewPhones === "load" && (
            <Row>
              <Col md={12}>
                <AddUserPage />
              </Col>
            </Row>
          )}
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  availableNumbersTenant: state.availableNumbersGroup,
  selfcareUrl: state.selfcareUrl
});

const mapDispatchToProps = {
  fetchGetPhoneNumbersByGroupId,
  refuseAddPhoneToTenant,
  changeStepOfAddPhoneTenant,
  fetchGetMobileNumbersForTenant,
  fetchGetSelfcareURL
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(AddPhoneNumberPage)
);
