import React from 'react';
import Panel from 'react-bootstrap/lib/Panel';
import Button from 'react-bootstrap/lib/Button';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';


export const DashboardPanel = ({title, children, onSettings, onShow}) => (
    <Panel>
        {
            title && (
                <Panel.Heading>
                    { onSettings &&
                        <Button
                            onClick={onSettings}
                            bsStyle="default"
                            bsSize="xsmall"
                            className="pull-right"
                        >
                            <Glyphicon glyph="cog"/>
                        </Button>
                    }
                    { onShow &&
                        <Button
                            onClick={onShow}
                            bsStyle="default"
                            bsSize="xsmall"
                            className="pull-right"
                        >
                            <Glyphicon glyph="resize-full"/>
                        </Button>

                    }

                    <Panel.Title>{title}</Panel.Title>
                </Panel.Heading>
            )
        }
        <Panel.Body>
            {children}
        </Panel.Body>
    </Panel>
);