export const DEFAULT_RECIPIENT = "BRAL";

export const rejection_codes = [
  { id: 2010, summary: 'VAT / number(s) mismatch', help: 'Used for <business>.' },
  { id: 2011, summary: 'Subscriber id number error', help: 'Reject by Donor, because of subscriber id number error' },
  { id: 2012, summary: 'DDI range incomplete', help: 'Range requested in the NP message is not a complete DDI range.' },
  { id: 3010, summary: 'Not portable geographical number(s)', help: 'Geographical number(s) are not portable' },
  { id: 3013, summary: 'Number(s) not allocated to (same) subscriber', help: 'Reject by Donor, because number(s) are not allocated to a subscriber or do not belong to the same subscriber' },
  { id: 3014, summary: 'Technical Number', help: 'Reject by Donor, because number is a technical number' },
  { id: 3015, summary: 'NP blocking period ', help: 'Blocking issue for Donor, because there is a NP blocking period ' },
  { id: 3017, summary: 'Number(s) are in repair mode by Donor ', help: 'Blocking issue for Donor, because number(s) are in repair mode ' },
  { id: 3018, summary: 'Number is mass calling / media number ', help: 'Blocking issue for Donor, because number is mass calling or media number ' },
  { id: 3019, summary: 'Conflict with NP process with current codedid field ', help: 'Blocking issue for Donor, because there is a conflict with the codedid ' },
  { id: 3020, summary: 'Number(s) not in use by Donor ', help: 'Reject by Donor, because number(s) are not in use by the Donor ' },
  { id: 3110, summary: 'Installation too complex to enable Donor to meet due date ', help: 'Blocking issue for Donor, because the installation is too complex to meet the due date ' },
  { id: 4012, summary: 'OLO’s owned number(s) ', help: 'Reject by Donor, because of OLO’s owned number(s) ' },
  { id: 4014, summary: 'Line in modification status ', help: 'Blocking issue for Donor, because line is in modification status ' },
  { id: 4015, summary: 'Number(s) overlap ', help: 'Reject by Donor, because the number(s) overlap ' },
  { id: 4016, summary: 'I-line number(s) ', help: 'Reject by Donor, because the number(s) are I-line number(s) ' },
  { id: 4017, summary: 'Missing LoA during validation for professional subscribers ', help: 'Reject by Donor, because of missing LoA during the validation for professional subscribers ' },
  { id: 4018, summary: 'Reserved number(s) ', help: 'Blocking issue for Donor, because these are reserved number(s) ' },
  { id: 4019, summary: 'Subscriber objects to donor ', help: 'Blocking issue for Donor, because the subscriber objects to Donor ' },
  { id: 4020, summary: 'Public utility access line ', help: 'Blocking issue for Donor, because this is a public utility access line ' },
  { id: 4021, summary: 'Contractual issues ', help: 'Blocking issue for Donor, because of contractual issues ' },
  { id: 6013, summary: 'Involved number(s) are blocked ', help: 'Reject by Donor, because the involved number(s) are blocked ' },
  { id: 6014, summary: 'Number(s) involved in bankruptcy case ', help: 'Reject by Donor, because the number(s) are involved in a bankruptcy case ' },
  { id: 8110, summary: 'No access to the ported DN ', help: 'Reject by Recipient in Non RFS, because there is no access to the ported DN ' },
  { id: 8120, summary: 'Calls wrongly terminated ', help: 'Reject by Recipient in Non RFS, because calls are wrongly terminated ' },
  { id: 8130, summary: 'Calls not terminated ', help: 'Reject by Recipient in Non RFS, because calls are not terminated ' },
  { id: 9999, summary: 'Not covered issue impacting the porting ', help: '' },
];