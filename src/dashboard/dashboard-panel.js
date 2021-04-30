import React from 'react';
import Panel from 'react-bootstrap/lib/Panel';
import Button from 'react-bootstrap/lib/Button';
import {faCog, faExpandArrowsAlt} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";


export const DashboardPanel = ({title, children, onSettings, onShow}) => (
    <div className={"mb-3 card"}>
        {
            title && (
                <div className={"card-header"}>
                    <div className={"card-header-title"}>{title}</div>
                    <ul className={"nav"}>
                    { onSettings &&
                        <li className={"nav-item"}>
                          <Button
                            onClick={onSettings}
                            bsStyle="default"
                            bsSize="xsmall"
                          >
                              <FontAwesomeIcon icon={faCog}/>
                          </Button>
                        </li>
                    }
                    { onShow &&
                      <li className={"nav-item"}>
                        <Button
                            onClick={onShow}
                            bsStyle="default"
                            bsSize="xsmall"
                        >
                            <FontAwesomeIcon icon={faExpandArrowsAlt} />
                        </Button>
                      </li>
                    }
                    </ul>
                </div>
            )
        }
        <Panel.Body>
            {children}
        </Panel.Body>
    </div>
);