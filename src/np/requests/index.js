import React from "react";
import {modules} from "../../utils/user";
import {
  NPTransaction as CrdbNPTransaction,
  NPPortInRequest as CrdbNPPortInRequest,
  NPDisconnectRequest as CrdbNPDisconnectRequest,
} from "./crdb-rsa";
import {
  NPTransaction as CitcNPTransaction,
  NPPortInRequest as CitcNPPortInRequest,
  NPDisconnectRequest as CitcNPDisconnectRequest, TENANTS,
} from "./citc-sa";
import {
  NPPortInRequest as CoinNPPortInRequest,
  NPTransaction as CoinNPTransaction,
} from "./coin-nl";

export function NPTransaction(props) {
  const {user_info} = props
  if(user_info.modules.includes(modules.npact_crdb)) {
    return <CrdbNPTransaction {...props} />
  } else if(user_info.modules.includes(modules.npact_citc)) {
    return <CitcNPTransaction {...props} />
  } else if(user_info.modules.includes(modules.npact_coin)) {
    return <CoinNPTransaction {...props} />
  } else {
    return <div/>
  }
}

export function NPPortInRequest(props) {
  const {user_info} = props
  if(user_info.modules.includes(modules.npact_crdb)) {
    return <CrdbNPPortInRequest userInfo={user_info} />
  } else if(user_info.modules.includes(modules.npact_citc)) {
    return <CitcNPPortInRequest {...props} />
  } else if(user_info.modules.includes(modules.npact_coin)) {
    return <CoinNPPortInRequest {...props} />
  } else {
    return <div/>
  }
}

export function NPDisconnectRequest(props) {
  const {user_info} = props
  if(user_info.modules.includes(modules.npact_crdb)) {
    return <CrdbNPDisconnectRequest {...props} />
  } else if(user_info.modules.includes(modules.npact_citc)) {
    return <CitcNPDisconnectRequest {...props} />
  } else {
    return <div/>
  }
}

export function getTenants(props) {
  const {user_info} = props
  if(user_info.modules.includes(modules.npact_citc)) {
    return TENANTS;
  } else {
    return []
  }
}