import React, { useState, useEffect } from "react";

import { useParams } from "react-router";

import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import { fetchGetUsageOfCallRecordingPlatforms } from "../../../../../store/actions";

import { FormattedMessage } from "react-intl";

import Modal from "react-bootstrap/lib/Modal";
import Loading from "../../../../../common/Loading";

const Usage = ({ platformName, show, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const params = useParams();

  const usageGroups = useSelector((state) => state.usageOfCallRecordingPlaform);

  useEffect(() => {
    setIsLoading(true);
    dispatch(fetchGetUsageOfCallRecordingPlatforms(platformName)).then(() =>
      setIsLoading(false)
    );
  }, []);

  if (isLoading) {
    return (
      <Modal show={show} backdrop={false}>
        <Loading />
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={() => onClose && onClose(false)}>
      <Modal.Header closeButton>
        <Modal.Title>
          <FormattedMessage id="usage" defaultMessage="Usage" />
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        style={{ maxHeight: "calc(100vh - 120px", overflowY: "auto" }}
      >
        {usageGroups.map((group) => (
          <p>
            <Link
              to={`/provisioning/${params.gwName}/tenants/${group.tenantId}/groups/${group.groupId}`}
            >
              {group.groupId}
            </Link>
          </p>
        ))}
      </Modal.Body>
    </Modal>
  );
};

export default Usage;
