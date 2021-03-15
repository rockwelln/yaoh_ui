import React from "react";

import Button from 'react-bootstrap/lib/Button';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import InputGroup from 'react-bootstrap/lib/InputGroup';
import InputGroupButton from 'react-bootstrap/lib/InputGroupButton';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import FormControl from 'react-bootstrap/lib/FormControl';
import Form from 'react-bootstrap/lib/Form';
import Col from 'react-bootstrap/lib/Col';
import Table, {thead, th, tr, td, tbody} from 'react-bootstrap/lib/Table';

import {FormattedMessage} from 'react-intl';
import update from "immutability-helper/index";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSortDown, faSortUp, faSort, faSpinner } from "@fortawesome/free-solid-svg-icons";

// import 'font-awesome/css/font-awesome.min.css';


export const Pagination = ({num_pages, page_number, onChange, total_results}) => {
    let pages = [];
    let i = 0;
    let startNumber = 0;

    if (page_number === 1) {
      startNumber = 1;
    } else if (page_number === num_pages && num_pages > 2) {
      startNumber = (num_pages - 3 > 0) ? page_number - 3 : 1;
    } else {
      startNumber = page_number - 1;
    }

    while(pages.length !== 3 && startNumber + i <= num_pages) {
        pages.push(startNumber + i);
        i++;
    }

    const total =  total_results?<span>({total_results} <FormattedMessage id="results" defaultMessage="results" />)</span>:null;

    return (
        <div>
            <div className="pull-left">
                <FormattedMessage id="page" defaultMessage="Page" /> {page_number} <FormattedMessage id="on" defaultMessage="on" /> {num_pages} {total}
            </div>
            <ButtonGroup className="btn-group-page-nav pull-right">
                <Button
                    disabled={page_number === 1}
                    onClick={() => onChange({page_number:1 })}>
                    <FormattedMessage id="first" defaultMessage="First" />
                </Button>
                <Button
                    disabled={page_number === 1}
                    onClick={() => onChange({page_number: page_number - 1})}>
                    <FormattedMessage id="prev" defaultMessage="Prev" />
                </Button>

                {
                    pages.map(i => (
                        <Button key={i} disabled={i === page_number} onClick={() => onChange({page_number: i})}>
                            {i}
                        </Button>
                    ))
                }

                <Button
                    disabled={page_number >= num_pages}
                    onClick={() => onChange({page_number: page_number + 1})}>
                    <FormattedMessage id="next" defaultMessage="Next" />
                </Button>
                <Button
                    disabled={page_number >= num_pages}
                    onClick={() => onChange({page_number: num_pages})}>
                    <FormattedMessage id="last" defaultMessage="Last" />
                </Button>
            </ButtonGroup>
        </div>
    );
};

export const SearchBar = ({filter, onChange, onSearch, size}) => (
    <Form onSubmit={(e) => {e.preventDefault(); onSearch && onSearch(filter);}}>
        <Col smOffset={12 - (size || 4)} sm={size || 4}>
            <InputGroup>
                <FormControl
                    type="text"
                    value={filter || ''}
                    placeholder="search"
                    onChange={e => onChange(e.target.value)} />
                <InputGroupButton>
                    <Button type='submit'>
                        <Glyphicon glyph="search" />
                    </Button>
                </InputGroupButton>
            </InputGroup>
        </Col>
    </Form>
);


const datatableRow = (headers, data, label, default_col_style, key) => {
    let r = [
        <tr key={key} style={{border: 0}}>
        {
            headers.map((h, j) => (
                <td key={j} style={h.style?update(default_col_style, {$merge: h.style}):default_col_style}>
                    {h.render?h.render(data):data[h.field || h.title]}
                </td>
            ))
        }
        </tr>
    ];

    if(label) {
        r.push(
            <tr key={`label-${key}`}>
                <td colSpan={1} style={{border: 0, padding: 0}}/>
                <td colSpan={headers.length - 1} style={{border: 0, padding: 0}}><p style={{color: "#777"}}>{label}</p></td>
            </tr>
        )
    }
    return r;
};


export const ApioDatatable = ({sorting_spec, headers, pagination, data, labels, onSort, onPagination, filter, onFilterChange, onSearch}) => {

    const renderSortIcon = field => {
        const e = sorting_spec.find(s => s.field === field);
        return <FontAwesomeIcon icon={e === undefined ? faSort : e.direction === "desc" ? faSortDown : faSortUp} />
    };

    const getSortDirection = field => {
        const e = sorting_spec.find(s => s.field === field);
        return (e === undefined || e.direction === 'desc')?'asc':'desc';
    };

    if(data === undefined) {
        return (
            <div>
                <FontAwesomeIcon icon={faSpinner} aria-hidden="true" style={{'fontSize': '24px'}} spin />
            </div>
        )
    }
    const default_col_style = {wordWrap:'break-word'};
    return (
        <div>
            {
                onSearch ?
                  <SearchBar filter={filter} onSearch={onSearch} onChange={onFilterChange} /> :
                  pagination &&
                    <Pagination
                        onChange={onPagination}
                        page_number={pagination.page_number}
                        num_pages={pagination.num_pages}
                        total_results={pagination.total_results}
                    />
            }
            <Table style={{tableLayout: 'fixed'}}>
                <thead>
                    <tr>
                        {
                            headers.map((h, i) => (
                                <th
                                    key={i}
                                    onClick={() => h.sortable && onSort({
                                        field: h.field || h.title,
                                        direction: getSortDirection(h.field || h.title),
                                        model: h.model,
                                    })}
                                    style={h.style?update(default_col_style, {$merge: h.style}):default_col_style}
                                >
                                    {h.title}
                                    {
                                        h.sortable && <span className="pull-right">{renderSortIcon(h.field || h.title)}</span>
                                    }
                                </th>
                            ))
                        }
                    </tr>
                </thead>
                <tbody>
                {
                    data.map((n, i) => datatableRow(headers, n, labels && labels[i], default_col_style, i))
                }
                </tbody>
            </Table>
            {
                pagination &&
                    <Pagination
                        onChange={onPagination}
                        page_number={pagination.page_number}
                        num_pages={pagination.num_pages}
                        total_results={pagination.total_results}
                    />
            }
        </div>
    )
};
