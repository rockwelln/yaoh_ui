import React, {useEffect, useState} from 'react';
import Breadcrumb from "react-bootstrap/lib/Breadcrumb";
import {FormattedMessage} from "react-intl";
import Nav from "react-bootstrap/lib/Nav";
import NavItem from "react-bootstrap/lib/NavItem";
import Row from "react-bootstrap/lib/Row";
import Col from "react-bootstrap/lib/Col";
import Tabs from "react-bootstrap/lib/Tabs";
import {API_URL_PREFIX, API_WS_URL, AuthServiceManager, fetch_get, NotificationsManager} from "../utils";
import Tab from "react-bootstrap/lib/Tab";
import Table from "react-bootstrap/lib/Table";
import Button from "react-bootstrap/lib/Button";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import ButtonGroup from "react-bootstrap/lib/ButtonGroup";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Alert from "react-bootstrap/lib/Alert";


const Relatives = ({log}) => (
    <Table>
        <thead>
            <tr>
                <th><FormattedMessage id="filename"/></th>
                <th><FormattedMessage id="size"/></th>
                <th><FormattedMessage id="date"/></th>
                <th/>
            </tr>
        </thead>
        <tbody>
            {
                log.relatives.map(r =>
                    <tr>
                        <td>{r.filename}</td>
                        <td>{r.size}</td>
                        <td>{r.date}</td>
                        <td>
                            <Button
                                bsStyle="primary"
                                onClick={() => {
                                  AuthServiceManager.getValidToken().then(token => {
                                      window.location=`${API_URL_PREFIX}/api/v01/logs/${log.log_id}/${r.filename}?auth_token=${token}`
                                    })
                                }}
                            >
                                <Glyphicon glyph="download"/>
                            </Button>
                        </td>
                    </tr>
                )
            }
        </tbody>
    </Table>
);


class FollowLog extends React.Component {
    state = {
        content: "",
        error: undefined,
        connectionStatus: "",
        scrollEnd: true,
    };

    constructor() {
        super();
        this.contentRef = React.createRef();
    }

    updateContent(event) {
        let msg = ""
        try {
          msg = JSON.parse(event.data).content;
        } catch(e) {
          msg = event.data;
        }
        this.setState({content: this.state.content + msg});
    }

    fetchContent() {
        const {log} = this.props;
        this.setState({connectionStatus: "connecting"});
        this.websocket = new WebSocket(`${API_WS_URL}/api/v01/logs/${log.log_id}/ws?auth_token=${AuthServiceManager.getToken()}`);
        this.websocket.onopen = () => !this.cancelLoad && this.setState({error: undefined, connectionStatus: "connected"});
        this.websocket.onmessage = this.updateContent.bind(this);
        this.websocket.onerror = () => NotificationsManager.error("fail to fetch content");
        this.websocket.onclose = e => {
            this.setState({connectionStatus: "closed"});
            switch (e.code) {
                case 4001:
                    !this.cancelLoad && this.setState({error: "Not found ..."});
                    break;
                case 4002:
                    !this.cancelLoad && this.setState({error: "You are not allowed to see this file!"});
                    break;
                case 1000:	// CLOSE_NORMAL
                    console.log("WebSocket: closed");
                    break;
                default:	// Abnormal closure
                    !this.cancelLoad && this.setState({error: "Trying to reconnect..."});
                    setTimeout(this.fetchContent, 1000);
                    break;
            }
        }
    }

    componentDidMount() {
        this.fetchContent();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.state.scrollEnd && prevState.content.length !== this.state.content.length) {
            setTimeout(() => this.contentRef.current.scrollIntoView({block: 'end', behaviour: 'smooth'}), 500);
        }
    }

    componentWillUnmount() {
        this.websocket && this.websocket.close();
        this.cancelLoad = true;
    }

    render() {
        const {content, error, connectionStatus, scrollEnd} = this.state;

        return (
            <div>
                <Row style={{marginLeft: "5px", marginTop: "10px"}}>
                    <ButtonToolbar>

                        <ButtonGroup>
                            <Button
                                active={scrollEnd}
                                alt={"scroll to the end"}
                                onClick={e => {
                                    this.setState({scrollEnd: !scrollEnd});
                                    if(!scrollEnd) {
                                        this.contentRef.current.scrollIntoView({block: 'end', behaviour: 'smooth'});
                                    }
                                }}>
                                <Glyphicon glyph="download-alt" />
                            </Button>
                        </ButtonGroup>
                        <ButtonGroup>
                            <Button onClick={e => this.setState({content: ""})}>
                                <Glyphicon glyph="remove" />
                            </Button>
                        </ButtonGroup>
                        <ButtonGroup className="pull-right">
                            { connectionStatus }
                        </ButtonGroup>
                    </ButtonToolbar>
                </Row>
                <Row style={{marginLeft: "5px", marginTop: "10px"}}>
                    { error && <Alert bsStyle="danger">{error}</Alert> }
                    <pre className="log-content">
                        {content}
                        <div ref={this.contentRef}/>
                    </pre>
                </Row>
            </div>
        )
    }
}


export default function LogsManagement() {
    const [logs, setLogs] = useState([]);
    const [currentLog, setCurrentLog] = useState(null);
    const [activeTab, setActiveTab] = useState(1);

    useEffect(() => {
        fetch_get("/api/v01/logs")
            .then(data => setLogs(data.logs))
            .catch(error => NotificationsManager.error(<FormattedMessage id="fail-loading-logs" defaultMessage="Fail to load logs"/>, error.message ));
        document.title = "Logs"
    }, [])

    return (
        <div>
            <Breadcrumb>
                <Breadcrumb.Item active><FormattedMessage id="system" defaultMessage="System"/></Breadcrumb.Item>
                <Breadcrumb.Item active><FormattedMessage id="logs" defaultMessage="Logs"/></Breadcrumb.Item>
            </Breadcrumb>
            <Row>
                <Col sm={3} className="vl">
                    <Nav bsSize="small" bsStyle="pills" stacked>
                    {
                        logs.map(l =>
                            <NavItem key={l.log_id} onClick={() => {
                              setCurrentLog(l);
                              setActiveTab(1);
                            }}>
                                {l.log_id}
                            </NavItem>
                        )
                    }
                    </Nav>
                </Col>
                <Col sm={9}>
                    { currentLog &&
                        <Tabs defaultActiveKey={1} activeKey={activeTab} onSelect={e => setActiveTab(e)}>
                            <Tab eventKey={1} title={<FormattedMessage id="relatives" defaultMessage="Relatives" />}>
                                <Relatives log={currentLog} />
                            </Tab>
                            <Tab eventKey={2} title={<FormattedMessage id="follow" defaultMessage="Follow" />}>
                                { activeTab === 2 && <FollowLog log={currentLog} /> }
                            </Tab>
                        </Tabs>
                    }
                </Col>
            </Row>
        </div>
    )
}