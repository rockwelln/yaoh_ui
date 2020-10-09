import Col from "react-bootstrap/lib/Col";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import {FormattedMessage} from "react-intl";
import Button from "react-bootstrap/lib/Button";
import FormGroup from "react-bootstrap/lib/FormGroup";
import React, {useEffect, useState} from "react";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import Modal from "react-bootstrap/lib/Modal";
import Form from "react-bootstrap/lib/Form";
import {fetch_get, fetch_post, fetch_delete, NotificationsManager, fetch_put} from "../utils";
import Select from "react-select";
import FormControl from "react-bootstrap/lib/FormControl";
import update from "immutability-helper";
import ButtonToolbar from "react-bootstrap/lib/ButtonToolbar";
import {DeleteConfirmButton} from "./deleteConfirm";


function fetchFilters(entity, onSuccess) {
    return fetch_get("/api/v01/filters")
      .then(r => {
        const filters = entity ? r.filters.filter(f => f.entity === entity): r.filters;
        onSuccess(filters);
        return filters;
      })
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="load-filters-failed" defaultMessage="Failed to load filters"/>,
        error.message
      ))
}

function fetchNewFilter(entry, onSuccess) {
    fetch_post("/api/v01/filters", entry)
      .then(() => onSuccess())
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="new-filters-failed" defaultMessage="Failed to create a new filter"/>,
        error.message
      ))
}

function saveFilter(filterId, entry, onSuccess) {
    fetch_put(`/api/v01/filters/${filterId}`, entry)
      .then(() => onSuccess && onSuccess())
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="save-filters-failed" defaultMessage="Failed to save a filter"/>,
        error.message
      ))
}

function deleteFilter(filterId, onSuccess) {
    fetch_delete(`/api/v01/filters/${filterId}`)
      .then(() => onSuccess())
      .catch(error => NotificationsManager.error(
        <FormattedMessage id="delete-filters-failed" defaultMessage="Failed to delete filter"/>,
        error.message
      ))
}

const newFilter = {
    name: "",
    filter: {},
    visibility: "user",
}

function NewFilterModal(props) {
    const {show, onHide, currentFilter, entity} = props;
    const [filter, setFilter] = useState(newFilter);

    return (
        <>
            <Modal show={show} onHide={() => onHide(null)} backdrop={false}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FormattedMessage id="new-filter" defaultMessage="New filter"/>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form horizontal>
                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="name" defaultMessage="Name"/>
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                  componentClass="input"
                                  value={filter.name}
                                  onChange={e => setFilter(update(filter, {$merge: {name: e.target.value}}))}/>
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col componentClass={ControlLabel} sm={2}>
                                <FormattedMessage id="visibility" defaultMessage="Visibility"/>
                            </Col>

                            <Col sm={9}>
                                <FormControl
                                  componentClass="select"
                                  value={filter.visibility}
                                  onChange={e => setFilter(update(filter, {$merge: {visibility: e.target.value}}))}>
                                  <option value="user">user</option>
                                  <option value="system">public</option>
                                </FormControl>
                            </Col>
                        </FormGroup>

                        <FormGroup>
                            <Col smOffset={2} sm={10}>
                                <ButtonToolbar>
                                    <Button
                                        bsStyle="primary"
                                        disabled={filter.name === ""}
                                        onClick={() => {
                                        if(currentFilter) {
                                          filter.filter = currentFilter();
                                        }
                                        filter.entity = entity;
                                        fetchNewFilter(filter, () => onHide(filter.name));
                                    }}>
                                        <FormattedMessage id="save" defaultMessage="Save"/>
                                    </Button>
                                </ButtonToolbar>
                            </Col>
                        </FormGroup>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    )
}

export function SavedFiltersFormGroup(props) {
    const {onChange, currentFilter, entity} = props;
    const [filter, setFilter] = useState(null);
    const [presets, setPresets] = useState([]);
    const [showNewName, setShowNewName] = useState(false);

    useEffect(() => { fetchFilters(entity, setPresets) }, [showNewName]);
    const _refreshPresets = () => fetchFilters(entity, setPresets);

    return (
        <FormGroup>
            <Col componentClass={ControlLabel} sm={2}>
                <FormattedMessage id="saved-filters" defaultMessage="Saved filters" />
            </Col>

            <Col smOffset={1} sm={6}>
                <Select
                  className="basic-single"
                  classNamePrefix="select"
                  value={filter}
                  isClearable={true}
                  isSearchable={true}
                  name="filters"
                  onChange={(filter_, action) => {
                      if(["select-option", "clear"].includes(action.action)) {
                        setFilter(filter_);
                        onChange(filter_);
                      }
                  }}
                  options={presets.sort((a, b) => a.name.localeCompare(b.name)).map(f => ({value: f, label: `${f.name} (${f.visibility})`}))} />
            </Col>
            <Col sm={2}>
                <Button
                  bsStyle={"primary"}
                  onClick={() => setShowNewName(true)}
                >
                  <Glyphicon glyph="plus"/>
                </Button>
                {" "}
                <Button
                  bsStyle={"primary"}
                  onClick={() => {
                    filter.value.filter = currentFilter();
                    saveFilter(filter.value.id, {filter: filter.value.filter});
                    NotificationsManager.success(<FormattedMessage id="filter-updated" defaultMessage="Filter updated"/>);
                  }}
                  disabled={filter === null}
                >
                  <Glyphicon glyph="save"/>
                </Button>
                {" "}
                <DeleteConfirmButton
                    disabled={filter === null}
                    resourceName={`filter ${filter && filter.label}`}
                    onConfirm={() => deleteFilter(
                        filter.value.id,
                        () => {
                            _refreshPresets();
                            setFilter(null);
                        }
                    )}
                >
                  <Glyphicon glyph= "remove-sign"/>
                </DeleteConfirmButton>
            </Col>

            <NewFilterModal
                show={showNewName}
                entity={entity}
                onHide={newName => {
                    setShowNewName(false);
                    if(newName) {
                        _refreshPresets().then(ps => {
                          const f = ps.find(f => f.name === newName);
                          onChange({value: f, label: f.name});
                          setFilter({value: f, label: `${f.name} (${f.visibility})`});
                        });
                        NotificationsManager.success(<FormattedMessage id="new-filter-created" defaultMessage="New filter created"/>);
                    }
                }}
                currentFilter={currentFilter}
            />

        </FormGroup>
    )
}