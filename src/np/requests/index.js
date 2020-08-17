import React from "react";
import {modules} from "../../utils/user";
import {
  NPTransaction as CrdbNPTransaction,
  NPPortInRequest as CrdbNPPortInRequest,
  NPDisconnectRequest as CrdbNPDisconnectRequest,
} from "./crdb-rsa";

export function NPTransaction(props) {
  const {user_info} = props
  if(user_info.modules.includes(modules.npact_crdb)) {
    return <CrdbNPTransaction {...props} />
  } else {
    return <div/>
  }
}

export function NPPortInRequest(props) {
  const {user_info} = props
  if(user_info.modules.includes(modules.npact_crdb)) {
    return <CrdbNPPortInRequest {...props} />
  } else {
    return <div/>
  }
}

export function NPDisconnectRequest(props) {
  const {user_info} = props
  if(user_info.modules.includes(modules.npact_crdb)) {
    return <CrdbNPDisconnectRequest {...props} />
  } else {
    return <div/>
  }
}