import React, { Component } from 'react';

import Table from 'react-bootstrap/lib/Table';
import FormControl from 'react-bootstrap/lib/FormControl';
import HelpBlock from 'react-bootstrap/lib/HelpBlock';
import Button from 'react-bootstrap/lib/Button';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import update from 'immutability-helper';
import { FormattedMessage } from 'react-intl';
import { fetch_get } from "../utils";


function addBusinessDays(m, days) {
  let d = m.clone().add('d', Math.floor(days / 5) * 7);
  let remaining = days % 5;
  while (remaining) {
    d.add('d', 1);
    if (d.day() !== 0 && d.day() !== 6)
      remaining--;
  }
  return d;
}

export class DueDateService {
  static getRules(auth_token) {
    return fetch_get('/api/v01/npact/np_requests/due_date_rules', auth_token)
  }
}


export class DueDatePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rules: {}
    };
    this.cancelLoad = false;
    this.isPublicHoliday = this.isPublicHoliday.bind(this);
  }

  componentWillUnmount() {
    this.cancelLoad = true;
  }

  componentDidMount() {
    DueDateService.getRules('/api/v01/npact/np_requests/due_date_rules', this.props.auth_token)
      .then(data => !this.cancelLoad && this.setState({ rules: data }))
      .catch(error => console.log(error.message))
  }

  isPublicHoliday(date) {
    return this.state.rules.public_holidays && this.state.rules.public_holidays.find(h => date.isSame(h.when, 'day')) !== undefined;
  }

  componentWillReceiveProps(props) {
    const { rules } = this.state;
    const minDate = addBusinessDays(moment(this.props.reqCreaDate), props.complex ? rules.min_days_complex : rules.min_days);
    if ((!props.selected || props.selected < minDate) && props.onChange) {
      props.onChange(moment(props.complex ? rules.next_due_date_complex : rules.next_due_date))
    }
  }

  render() {
    const { rules } = this.state;
    const { complex, reqCreaDate } = this.props;
    const minDate = addBusinessDays(moment(reqCreaDate), complex ? rules.min_days_complex : rules.min_days);
    const maxDate = addBusinessDays(moment(reqCreaDate), rules.max_days);
    const minTime = moment(rules.min_time, moment.HTML5_FMT.TIME_SECONDS);
    const maxTime = moment(rules.max_time, moment.HTML5_FMT.TIME_SECONDS);
    return <DatePicker
      inline
      minDate={minDate}
      maxDate={maxDate}
      className="form-control"
      filterDate={d => d.days() > 0 && d.days() < 6 && !this.isPublicHoliday(d)}
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      minTime={minTime}
      maxTime={maxTime}
      {...this.props} />
  }
}

export const RangeInput = ({ ranges, onChange, multipleRanges }) => (
  <div>
    <Table>
      <thead>
        <tr>
          <th><FormattedMessage id="from" defaultMessage="From" /></th>
          <th><FormattedMessage id="to" defaultMessage="To" /></th>
          <th />
        </tr>
      </thead>
      <tbody>
        {
          ranges.map((range, index) => {
            return (
              <tr key={index}>
                <td>
                  <FormControl type="number"
                    value={range.from}
                    onChange={e => (
                      onChange(update(ranges,
                        { [index]: { $merge: { from: e.target.value } } }
                      )))
                    } />
                </td>
                <td>
                  <FormControl type="number"
                    value={range.to}
                    onChange={e => (
                      onChange(update(ranges,
                        { [index]: { $merge: { to: e.target.value } } }
                      )))
                    } />
                </td>
                {multipleRanges && (
                  <td>
                    <Button onClick={() => {
                      onChange(update(ranges,
                        { $splice: [[index, 1]] }
                      ))
                    }}>-</Button>
                  </td>
                )}
              </tr>
            )
          })
        }

        {multipleRanges && (
          <tr>
            <td colSpan={4}>
              <Button
                onClick={() =>
                  onChange(update(ranges, { $push: [{ from: '', to: '', data_number: '', fax_number: '' }] }))
                }>
                +
                    </Button>
            </td>
          </tr>
        )}
      </tbody>
    </Table>
    <HelpBlock>
      <FormattedMessage id="range-one-number-note" defaultMessage="To work with only 1 number, you may just put it in the from cell." />
    </HelpBlock>
  </div>
);
