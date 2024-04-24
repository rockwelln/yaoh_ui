import React from "react";
import Badge from "react-bootstrap/lib/Badge";
import Table from "react-bootstrap/lib/Table";
import Button from "react-bootstrap/lib/Button";
import FormControl from "react-bootstrap/lib/FormControl";
import FormGroup from "react-bootstrap/lib/FormGroup";
import { FormattedMessage } from "react-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { NotificationsManager, fetch_post, fetch_delete, fetch_put } from "../utils";

function addIpToWhitelist(ip, userId) {
    return fetch_post(`/api/v01/system/users/${userId}/ip_whitelist`, {ip})
        .then(() => {
            NotificationsManager.success(<FormattedMessage id='IP added to whitelist'/>);
        }, error => {
            NotificationsManager.error(<FormattedMessage id='Failed to add IP to whitelist'/>, error.message);
            return Promise.reject(error);
        });
}

function removeIpFromWhitelist(ipId, userId) {
    return fetch_delete(`/api/v01/system/users/${userId}/ip_whitelist/${ipId}`)
        .then(() => {
            NotificationsManager.success(<FormattedMessage id='IP removed from whitelist'/>);
        }, error => {
            NotificationsManager.error(<FormattedMessage id='Failed to remove IP from whitelist'/>, error.message);
            return Promise.reject(error);
        });
}

function enabledIpWhitelist(enabled, userId) {
    return fetch_put(`/api/v01/system/users/${userId}`, {with_ip_limits: enabled})
        .then(() => {
            NotificationsManager.success(<FormattedMessage id='IP whitelist updated'/>);
        }, error => {
            NotificationsManager.error(<FormattedMessage id='Failed to update IP whitelist'/>, error.message);
            return Promise.reject(error);
        });
}

export function IpWhitelist({enabled, whitelist, userId, local, onChange}) {
    const [newIp, setNewIp] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const validNewIp = isIpMaskValid(newIp);

    return (
        <Table>
            <tbody>
                <tr>
                    <td>IP Whitelist is <EnabledBadge enabled={enabled} /></td>
                    <td colSpan={2}>
                        {!local && <Button
                            disabled={loading }
                            bsStyle="secondary"
                            onClick={() => {
                                setLoading(true);
                                enabledIpWhitelist(!enabled, userId)
                                    .then(() => onChange())
                                    .finally(() => setLoading(false));
                            }}
                        >{enabled?<FormattedMessage id='Disable'/>:<FormattedMessage id='Enable'/>}</Button>}
                    </td>
                </tr>
                <tr>
                    <td colSpan={3}>
                        <i>{ enabled ? <FormattedMessage id='Only those whitelisted IPs can access this account'/> :
                            <FormattedMessage id='All IPs can access this account'/> 
                        }</i>
                    </td>
                </tr>

                {
                    whitelist?.map((ip, i) => (
                        <tr key={i}>
                            <td>{ip.ip}</td>
                            <td><i>{ip.created_at}</i></td>
                            <td>
                                {!local && <Button
                                    disabled={loading}
                                    onClick={() => {
                                        setLoading(true);
                                        removeIpFromWhitelist(ip.id, userId)
                                            .then(() => onChange())
                                            .finally(() => setLoading(false));
                                    }}
                                    bsStyle="danger">
                                        <FontAwesomeIcon icon={faTrash} />
                                </Button>}
                            </td>
                        </tr>
                    ))
                }

                {!local && <tr>
                    <td>
                        <FormGroup validationState={!validNewIp && newIp.length !== 0 ? "error" : null}>
                            <FormControl
                                value={newIp}
                                onChange={(e) => setNewIp(e.target.value)}
                                placeholder="Add IP mask (e.g 10.220.20.10/24)"
                                onKeyDown={e => {
                                    if(e.keyCode === 13) {
                                        e.preventDefault();
                                        if(validNewIp && !loading) {
                                            setLoading(true);
                                            addIpToWhitelist(newIp, userId)
                                                .then(() => {
                                                    setNewIp("");
                                                    onChange();
                                                })
                                                .finally(() => setLoading(false));
                                        }
                                    }
                                }} />
                            {
                                !validNewIp && <FormControl.Feedback />
                            }
                        </FormGroup>
                    </td>
                    <td>
                        <Button
                            disabled={!validNewIp || loading}
                            onClick={() => {
                                setLoading(true);
                                addIpToWhitelist(newIp, userId)
                                    .then(() => {
                                        setNewIp("");
                                        onChange();
                                    })
                                    .finally(() => setLoading(false));
                            }}
                        >+</Button>
                    </td>
                    <td/>
                </tr>}
            </tbody>
        </Table>
    );
}

// check if the ip mask is valid (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/\d{1,2})
function isIpMaskValid(ip) {
    const ipMask = ip.split("/");
    if (ipMask.length > 2 || ipMask.length < 1) return false;
    const [ipAddress, mask] = ipMask;
    const ipParts = ipAddress.split(".");
    if (ipParts.length !== 4) return false;
    if (mask !== undefined && (mask < 1 || mask > 32)) return false;
    if (!ipParts.every(part => part >= 0 && part <= 255)) return false;
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipAddress);
}

const EnabledBadge = ({enabled}) => (
    <Badge bsClass={enabled?"label label-success":"label label-danger"}>
        { enabled?<FormattedMessage id='Enabled'/>:<FormattedMessage id='Disabled'/> }
    </Badge>
)
