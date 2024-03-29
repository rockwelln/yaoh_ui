import React from 'react';
import {useEffect, useState} from 'react';
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormGroup from "react-bootstrap/lib/FormGroup";
import FormControl from "react-bootstrap/lib/FormControl";
import Col from "react-bootstrap/lib/Col";

import {FormattedMessage} from 'react-intl';
import {API_URL_PREFIX, fetch_get, NotificationsManager, userLocalizeUtcDate} from "../utils";
import queryString from "query-string";
import update from "immutability-helper/index";
import PropTypes from 'prop-types';
import Panel from "react-bootstrap/lib/Panel";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import moment from "moment";


export const NotAllowed = () => (
    <div>
        <FormattedMessage
            id="notAllowed"
            defaultMessage="Sorry, you are not allowed to see this page!" />
    </div>
);

export const StaticControl = ({label, value, validationState}) => (
    <FormGroup validationState={validationState}>
        <Col componentClass={ControlLabel} sm={2}>
            {label}
        </Col>

        <Col sm={9}>
            <FormControl.Static>
                {value}
            </FormControl.Static>
        </Col>
    </FormGroup>
);

export const SearchFieldsPanel = ({children}) => (
    <Panel defaultExpanded={false} >
        <Panel.Heading>
            <Panel.Title toggle>
                <FormattedMessage id="search" defaultMessage="Search" /> <Glyphicon glyph="search" />
            </Panel.Title>
        </Panel.Heading>
        <Panel.Body collapsible>
            {children}
        </Panel.Body>
    </Panel>
);

export class Search extends React.Component {
    static defaultProps = {
        searchUrl: '',
        auth_token: undefined,
        location: {},
        user_info: {},
        collectionName: '',
        defaultCriteria: [],
        defaultSortingSpec: [],
        useNotifications: true,
    };

    static propTypes = {
        searchUrl: PropTypes.string.isRequired,
        location: PropTypes.shape({
            search: PropTypes.string
        }),
        collectionName: PropTypes.string.isRequired,
        defaultCriteria: PropTypes.object.isRequired,
        defaultSortingSpec: PropTypes.array.isRequired,
        useNotifications: PropTypes.bool.isRequired,
    };

    static criteriaFromParams(url_params, default_params) {
        const params = queryString.parse(url_params);
        let custom_params = {};
        if (params.filter !== undefined) {
            try {
                custom_params = JSON.parse(params.filter);
            } catch (e) { console.error(e) }
        }
        return update(
            default_params || {},
            {$merge: custom_params}
        );
    }

    constructor(props) {
        super(props);
        this.cancelLoad = false;
        this.state = {
            filter_criteria:
                Search.criteriaFromParams(
                    this.props.location.search,
                    this.props.defaultCriteria,
                ),
            paging_info: {
                page_number: 1, page_size: 50
            },
            sorting_spec : this.props.defaultSortingSpec,

            resources: undefined,
            pagination: {
                page_number: 1,
                num_pages: 1,
            },
            error: undefined,
        };
        this._usableCriteria = this._usableCriteria.bind(this);
        this._filterCriteriaAsSpec = this._filterCriteriaAsSpec.bind(this);
        this._refresh = this._refresh.bind(this);
        this._normalizeResource = this._normalizeResource.bind(this);
    }

    componentDidMount() {
        this._refresh();
    }

    componentWillUnmount() {
        this.cancelLoad = true;
    }

    _usableCriteria(c) {
        return (
            (c.value && c.op) || (c.op === 'is_null')
        );
    }

    _filterCriteriaAsSpec(filter_criteria) {
        return Object.keys(filter_criteria)
            .filter(f => this._usableCriteria(filter_criteria[f]))
            .map(f => {
                let value = filter_criteria[f].value;
                if(value instanceof Date) {
                    value = userLocalizeUtcDate(moment.utc(value), this.props.user_info).format();
                }
                const op = filter_criteria[f].op;
                if(op === "like" && !value.includes("%")) {
                    value = "%" + value % "%";
                }
                return {field: f, op: op, value: value}
            });
    }

    _normalizeResource(e) {
        return e;
    }

    _refresh(p, s) {
        const {filter_criteria, paging_info} = this.state;
        const {searchUrl, collectionName} = this.props;
        const url = new URL(API_URL_PREFIX + searchUrl);
        // filter
        const filter_spec = this._filterCriteriaAsSpec(filter_criteria);
        url.searchParams.append('filter', JSON.stringify(filter_spec));
        // paging
        const paging_spec = p === undefined ? paging_info : update(paging_info, {$merge: p});
        url.searchParams.append('paging', JSON.stringify(paging_spec));
        //sorting
        const sorting_spec = s === undefined ? this.state.sorting_spec : [s];
        url.searchParams.append('sorting', JSON.stringify(sorting_spec));
        //reset collection
        this.setState({resources: undefined});

        fetch_get(url)
            .then(data => !this.cancelLoad && this.setState({
                    resources: data[collectionName].map(this._normalizeResource),
                    pagination: {
                        page_number: data.pagination[0], // page_number, page_size, num_pages, total_results
                        page_size: data.pagination[1],
                        num_pages: data.pagination[2],
                        total_results: data.pagination[3],
                    },
                    sorting_spec: data.sorting || [],
            }))
            .catch(error => {
                if(this.cancelLoad) return;

                if(this.props.useNotifications) {
                    NotificationsManager.error(
                      <FormattedMessage id="failed-search" defaultMessage="Search query failed!"/>,
                      error.message,
                    );
                } else {
                    this.setState({error: error})
                }
            });
    }
}

export function useSearchDebounce(delay = 350) {
  const [search, setSearch] = useState(null);
  const [searchQuery, setSearchQuery] = useState(null);

  useEffect(() => {
    const delayFn = setTimeout(() => setSearch(searchQuery), delay);
    return () => clearTimeout(delayFn);
  }, [searchQuery, delay]);

  return [search, setSearchQuery];
}
