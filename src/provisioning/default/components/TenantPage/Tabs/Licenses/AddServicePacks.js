import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";

import Modal from "react-bootstrap/lib/Modal";
import Table from "react-bootstrap/lib/Table";
import Button from "react-bootstrap/lib/Button";
import Checkbox from "react-bootstrap/lib/Checkbox";

import { FormattedMessage } from "react-intl";

import {
  fetchGetAllServicePacksOfTenant,
  fetchPostAddServicePacksToTenant,
} from "../../../../store/actions";
import Loading from "../../../../common/Loading";

const AddServicePacks = (props) => {
  const { show, onClose } = props;

  const [freeServicePacks, setFreeServicePacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const dispatch = useDispatch();
  const params = useParams();
  const allTenantServicePacks = useSelector(
    (state) => state.allTenantServicePacks
  );
  const tenantServicePacks = useSelector((state) => state.tenantServicePacks);

  console.log(freeServicePacks);

  useEffect(() => {
    dispatch(fetchGetAllServicePacksOfTenant()).then(() => {
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setFreeServicePacks(
        allTenantServicePacks
          .filter(
            (el) =>
              !tenantServicePacks.some((sp) => sp.name === el.display_name)
          )
          .map((fsp) => ({
            technical_name: fsp.technical_name,
            display_name: fsp.display_name,
            checked: false,
          }))
      );
    }
  }, [isLoading]);

  const handleGlobalCheckbox = (checked) => {
    const newEntitlements = [...freeServicePacks];
    setFreeServicePacks(newEntitlements.map((el) => ({ ...el, checked })));
  };

  const handleChangeEntitlement = (value, id) => {
    if (value < 0 || isNaN(value)) {
      return;
    }
    const newEntitlements = [...freeServicePacks];
    setFreeServicePacks(
      newEntitlements.map((el) => {
        if (el.id === id) {
          return { ...el, entitlement: value };
        } else {
          return el;
        }
      })
    );
  };

  const handleSelectSingleEntitlement = (checked, technical_name) => {
    const newServicePacks = [...freeServicePacks];
    setFreeServicePacks(
      newServicePacks.map((el) => {
        if (el.technical_name === technical_name) {
          return { ...el, checked };
        } else {
          return el;
        }
      })
    );
  };

  const addEntitlements = () => {
    const newServicePacks = [...freeServicePacks]
      .filter((el) => el.checked)
      .map((el) => ({
        name: el.technical_name,
      }));
    dispatch(
      fetchPostAddServicePacksToTenant(params.tenantId, {
        servicePacksFromConfig: newServicePacks,
      })
    ).then(() => onClose());
  };

  if (isLoading) {
    return (
      <Modal show={show} onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add Service Packs</Modal.Title>
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
        <Modal.Title>Add Service Packs</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table>
          <thead>
            <tr>
              <th>
                <Checkbox
                  className={"table-checkbox"}
                  checked={freeServicePacks.every((el) => el.checked)}
                  onChange={(e) => handleGlobalCheckbox(e.target.checked)}
                />
              </th>
              <th>Service Pack</th>
              {/* <th></th> */}
            </tr>
          </thead>
          <tbody>
            {freeServicePacks.length ? (
              freeServicePacks.map((el) => (
                <tr key={el.name}>
                  <td className={"vertical-middle"}>
                    <Checkbox
                      className={"table-checkbox"}
                      checked={el.checked}
                      onChange={(e) =>
                        handleSelectSingleEntitlement(
                          e.target.checked,
                          el.technical_name
                        )
                      }
                    />
                  </td>
                  <td className={"vertical-middle"}>{el.display_name}</td>
                  {/* <td>
                    <FormControl
                      type="number"
                      value={el.entitlement}
                      min={0}
                      onChange={(e) =>
                        handleChangeEntitlement(e.target.value, el.id)
                      }
                    />
                  </td> */}
                </tr>
              ))
            ) : (
              <div>No free Service Packs</div>
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
          disabled={!freeServicePacks.some((el) => el.checked)}
        >
          <FormattedMessage id="save" defaultMessage="Save" />
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddServicePacks;
