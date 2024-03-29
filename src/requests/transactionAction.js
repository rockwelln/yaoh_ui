import React, { useEffect } from "react";
import { useParams, useLocation, useHistory } from "react-router-dom";
import { triggerManualAction } from "./requests";

function TransactionAction() {
  const {aId, txId} = useParams();
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const output = params.get("o");
    triggerManualAction(txId, aId, output).then(() => {
      history.push(`/transactions/${txId}`);
    });
  }, [aId, txId]);

  return <div></div>;
}

export default TransactionAction;