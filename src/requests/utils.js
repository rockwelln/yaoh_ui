import {fetch_put, NotificationsManager} from "../utils";
import {FormattedMessage} from "react-intl";
import React from "react";


export function replayTask(activityId, taskId, onSuccess, onError) {
  fetch_put(`/api/v01/transactions/${activityId}/tasks/${taskId}`, {})
    .then(() => {
      NotificationsManager.success(
        <FormattedMessage id="task-replayed" defaultMessage="Task replayed!"/>,
      );
      onSuccess && onSuccess();
    })
    .catch(error => {
      NotificationsManager.error(
        <FormattedMessage id="task-replay-failed" defaultMessage="Task replay failed!"/>,
        error.message,
      );
      onError && onError(error);
    })
}

export function fetchUpdateContext(txID, key, value, onSuccess, onError) {
  fetch_put(`/api/v01/transactions/${txID}/context`, {key: key, value: value})
    .then(() => {
      onSuccess && onSuccess();
    })
    .catch(error => {
      onError && onError(error);
    })
}