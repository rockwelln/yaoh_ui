import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import Modal from "react-bootstrap/lib/Modal";
import Table from "react-bootstrap/lib/Table";
import Button from "react-bootstrap/lib/Button";
import FormControl from "react-bootstrap/lib/FormControl";
import Checkbox from "react-bootstrap/lib/Checkbox";

import { FormattedMessage } from "react-intl";

import {
  fetchGetEntitlementTypes,
  fetchPostAddEntitlementToTenant
} from "../../../store/actions";
import Loading from "../../../common/Loading";

const AddEntitlements = props => {
  const { show, onClose } = props;

  const [freeEntitlements, setFreeEntitlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useDispatch();
  const tenantEntitlements = useSelector(state => state.tenantEntitlements);
  const entitlementTypes = useSelector(state => state.entitlementTypes);
  const createdTenant = useSelector(state => state.createdTenant);

  useEffect(() => {
    dispatch(fetchGetEntitlementTypes()).then(() => {
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setFreeEntitlements(
        entitlementTypes.customer_licenses
          .filter(el => !tenantEntitlements.some(te => te.name === el.name))
          .map(fe => ({ ...fe, checked: false, entitlement: 0 }))
      );
    }
  }, [isLoading]);

  const handleGlobalCheckbox = checked => {
    const newEntitlements = [...freeEntitlements];
    setFreeEntitlements(newEntitlements.map(el => ({ ...el, checked })));
  };

  const handleChangeEntitlement = (value, id) => {
    if (value < 0 || isNaN(value)) {
      return;
    }
    const newEntitlements = [...freeEntitlements];
    setFreeEntitlements(
      newEntitlements.map(el => {
        if (el.id === id) {
          return { ...el, entitlement: value };
        } else {
          return el;
        }
      })
    );
  };

  const handleSelectSingleEntitlement = (checked, id) => {
    const newEntitlements = [...freeEntitlements];
    setFreeEntitlements(
      newEntitlements.map(el => {
        if (el.id === id) {
          return { ...el, checked };
        } else {
          return el;
        }
      })
    );
  };

  const addEntitlements = () => {
    const newEntitlements = [...freeEntitlements]
      .filter(el => el.checked)
      .map(el => ({
        license_model_id: el.id,
        entitlement: el.entitlement ? Number(el.entitlement) : 0
      }));
    newEntitlements.forEach(el => {
      dispatch(
        fetchPostAddEntitlementToTenant(createdTenant.tenantId, el)
      ).then(() => onClose());
    });
  };

  if (isLoading) {
    return (
      <Modal show={show} onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Entitlements</Modal.Title>
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
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add Entitlements</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table>
          <thead>
            <tr>
              <th>
                <Checkbox
                  className={"table-checkbox"}
                  checked={freeEntitlements.every(el => el.checked)}
                  onChange={e => handleGlobalCheckbox(e.target.checked)}
                />
              </th>
              <th>Name</th>
              <th>Entitlement</th>
            </tr>
          </thead>
          <tbody>
            {freeEntitlements.length ? (
              freeEntitlements.map(el => (
                <tr key={el.name}>
                  <td className={"vertical-middle"}>
                    <Checkbox
                      className={"table-checkbox"}
                      checked={el.checked}
                      onChange={e =>
                        handleSelectSingleEntitlement(e.target.checked, el.id)
                      }
                    />
                  </td>
                  <td className={"vertical-middle"}>{el.name}</td>
                  <td>
                    <FormControl
                      type="number"
                      value={el.entitlement}
                      min={0}
                      onChange={e =>
                        handleChangeEntitlement(e.target.value, el.id)
                      }
                    />
                  </td>
                </tr>
              ))
            ) : (
              <div>No free entitlements</div>
            )}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button
          bsStyle="danger"
          onClick={() => onClose()}
          className={"width-8 margin-right-2"}
        >
          <FormattedMessage id="cancel" defaultMessage="Cancel" />
        </Button>
        <Button
          className={"width-8 btn-success"}
          onClick={addEntitlements}
          disabled={!freeEntitlements.some(el => el.checked)}
        >
          <FormattedMessage id="save" defaultMessage="Save" />
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddEntitlements;
