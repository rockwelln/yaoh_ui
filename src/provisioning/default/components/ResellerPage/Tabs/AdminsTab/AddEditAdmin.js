import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router";

import Button from "react-bootstrap/lib/Button";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import FormControl from "react-bootstrap/lib/FormControl";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormGroup from "react-bootstrap/lib/FormGroup";
import { Form } from "react-bootstrap";
import HelpBlock from "react-bootstrap/lib/HelpBlock";
import Select from "react-select";

import { FormattedMessage } from "react-intl";
import { removeEmpty } from "../../../remuveEmptyInObject";

import {
  fetchGetUserProfileTypes,
  fetchGetTenants,
} from "../../../../store/actions";

import Modal from "react-bootstrap/lib/Modal";
import Loading from "../../../../common/Loading";

const AddResellerModal = ({
  admin = {
    username: "",
    firstName: "",
    lastName: "",
    language: "",
    emailAddress: "",
    password: "",
    userProfileType: { label: "", value: "", level: null },
    tenantId: { label: "", value: "" },
  },
  mode,
  show,
  onClose,
  onSubmit,
}) => {
  const dispatch = useDispatch();
  const params = useParams();

  const userProfileTypes = useSelector((state) => state.userProfileTypes);
  const tenants = useSelector((state) => state.tenants);

  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stateAdmin, setStateAdmin] = useState({
    ...admin,
    tenantId: { label: admin.tenantId, value: admin.tenantId },
  });

  const saveAdmin = () => {
    const data = {
      ...stateAdmin,
      userProfileType: stateAdmin.userProfileType.value,
      tenantId: stateAdmin.tenantId.value,
    };
    const clearData = removeEmpty(data);
    setIsSaving(true);
    onSubmit({ data: clearData, callback: () => setIsSaving(false) });
  };

  const editAdmin = (value, variable) => {
    const temp = { ...stateAdmin };
    temp[variable] = value;
    setStateAdmin(temp);
  };

  useEffect(() => {
    if (!isLoadingTypes && mode === "Edit") {
      const userProfile = userProfileTypes.find(
        (el) => el.userType === admin.userProfileType
      );
      setStateAdmin({
        ...stateAdmin,
        userProfileType: {
          label: userProfile?.description,
          value: admin.userProfileType,
          level: userProfile?.userLevel,
        },
      });
    }
  }, [isLoadingTypes]);

  useEffect(() => {
    setIsLoadingTypes(true);
    setIsLoadingTenants(true);
    dispatch(fetchGetUserProfileTypes({ queryString: "?accessType=1" })).then(
      () => setIsLoadingTypes(false)
    );
    dispatch(fetchGetTenants(null, `?resellerId=${params.resellerName}`)).then(
      () => setIsLoadingTenants(false)
    );
  }, []);

  if (isLoadingTypes || isLoadingTenants) {
    return (
      <Modal show={show} onHide={() => onClose && onClose()}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FormattedMessage
              id="edit_admin"
              defaultMessage={`${mode} admin`}
            />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={"flex justify-center height-10"}>
          <div className={"crunch-suspension-modal"}>
            <Loading />
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={() => onClose && onClose()}>
      <Modal.Header closeButton>
        <Modal.Title>
          <FormattedMessage id="edit_admin" defaultMessage={`${mode} admin`} />
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        style={{ maxHeight: "calc(100vh - 120px", overflowY: "auto" }}
      >
        <Row>
          <Col md={12}>
            <Form horizontal className={"margin-1"}>
              <FormGroup controlId="username">
                <FormGroup controlId="new-userId">
                  <Col
                    componentClass={ControlLabel}
                    md={3}
                    className={"text-left"}
                  >
                    Username*
                  </Col>
                  <Col md={8}>
                    <FormControl
                      type="text"
                      placeholder="Username"
                      value={stateAdmin.username}
                      onChange={(e) => editAdmin(e.target.value, "username")}
                    />
                  </Col>
                </FormGroup>
                <FormGroup controlId="firstName">
                  <Col
                    componentClass={ControlLabel}
                    md={3}
                    className={"text-left"}
                  >
                    First name
                  </Col>
                  <Col md={8}>
                    <FormControl
                      type="text"
                      value={stateAdmin.firstName}
                      onChange={(e) => editAdmin(e.target.value, "firstName")}
                      placeholder="First name"
                    />
                  </Col>
                </FormGroup>
                <FormGroup controlId="lastName">
                  <Col
                    componentClass={ControlLabel}
                    md={3}
                    className={"text-left"}
                  >
                    Last name
                  </Col>
                  <Col md={8}>
                    <FormControl
                      type="text"
                      value={stateAdmin.lastName}
                      onChange={(e) => editAdmin(e.target.value, "lastName")}
                      placeholder="Last name"
                    />
                  </Col>
                </FormGroup>
                <FormGroup controlId="language">
                  <Col
                    componentClass={ControlLabel}
                    md={3}
                    className={"text-left"}
                  >
                    Language
                  </Col>
                  <Col md={8}>
                    <FormControl
                      type="text"
                      value={stateAdmin.language}
                      onChange={(e) => editAdmin(e.target.value, "language")}
                      placeholder="Language"
                    />
                  </Col>
                </FormGroup>
                <FormGroup controlId="emailAddress">
                  <Col
                    componentClass={ControlLabel}
                    md={3}
                    className={"text-left"}
                  >
                    Email
                  </Col>
                  <Col md={8}>
                    <FormControl
                      type="text"
                      value={stateAdmin.emailAddress}
                      onChange={(e) =>
                        editAdmin(e.target.value, "emailAddress")
                      }
                      placeholder="Email"
                    />
                  </Col>
                </FormGroup>
                <FormGroup controlId="password">
                  <Col
                    componentClass={ControlLabel}
                    md={3}
                    className={"text-left"}
                  >
                    Password
                  </Col>
                  <Col md={8}>
                    <FormControl
                      type="password"
                      value={stateAdmin.password}
                      onChange={(e) => editAdmin(e.target.value, "password")}
                      placeholder="Password"
                      autoComplete="new-password"
                    />
                  </Col>
                </FormGroup>
                <FormGroup controlId="userProfileType">
                  <Col
                    componentClass={ControlLabel}
                    md={3}
                    className={"text-left"}
                  >
                    User profile type*
                  </Col>
                  <Col md={8}>
                    <Select
                      value={stateAdmin.userProfileType}
                      onChange={(selected) =>
                        editAdmin(selected, "userProfileType")
                      }
                      options={userProfileTypes.map((el) => {
                        return {
                          value: el.userType,
                          label: el.description,
                          level: el.userLevel,
                        };
                      })}
                      menuPlacement="top"
                    />
                  </Col>
                </FormGroup>
                <FormGroup controlId="tenantId">
                  <Col
                    componentClass={ControlLabel}
                    md={3}
                    className={"text-left"}
                  >
                    {`Tenant Id${
                      stateAdmin.userProfileType.level === 12 ? "*" : ""
                    }`}
                  </Col>
                  <Col md={8}>
                    <Select
                      value={stateAdmin.tenantId}
                      onChange={(selected) => editAdmin(selected, "tenantId")}
                      options={tenants.map((el) => {
                        return { label: el.tenantId, value: el.tenantId };
                      })}
                      menuPlacement="top"
                    />
                  </Col>
                </FormGroup>
              </FormGroup>
              <Row>
                <Col md={12} className={"padding-0"}>
                  <div class="button-row">
                    <div className="pull-right">
                      <Button
                        className={"btn-primary"}
                        disabled={
                          !stateAdmin.username ||
                          !stateAdmin.userProfileType.value ||
                          !stateAdmin.firstName ||
                          !stateAdmin.lastName ||
                          (stateAdmin.userProfileType.level === 12 &&
                            !stateAdmin.tenantId.value) ||
                          isSaving
                        }
                        onClick={saveAdmin}
                      >
                        {`Save`}
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default AddResellerModal;
