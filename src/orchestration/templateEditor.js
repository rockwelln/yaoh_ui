import React, {useEffect, useState} from 'react'
import { MentionsInput, Mention } from 'react-mentions'

const filters = [
  {
    id: "pp_dict",
    display: "pp_dict",
    help: (
      <>
        <p><u>pp_dict</u> is a function to format the input in JSON.</p>
        <p>Note: This function was originally designed to take a dict in input, but it can actually handle other types (e.g list, strings)</p>
        <p>Note: Generators are not serializable</p>
        <br/>
        <i>Example:</i>
        <pre>{`['1', True, None] | pp_dict
// output: ["1", true, null]`}</pre>
      </>
    )
  },
  {
    id: "dict_filter",
    display: "dict_filter",
    help: (
      <>
        <p><u>dict_filter</u> filters entries of a dictionary by keys.</p>
        <br/>
        <i>Example:</i>
        <pre>{`{"a": "1", "b": "2"} | dict_filter("a", "d")
// output: {"a": "1"}`}</pre>
      </>
    )
  },
  {
    id: "json_query",
    display: "json_query",
    help: (
      <>
        <p><u>json_query</u> extract data from complex structure using jmespath query language.</p>
        <p>See http://jmespath.org for reference.</p>
        <br/>
        <i>Example:</i>
        <pre>{`// instance = {"instances": [{"block_device": {"host1": {"volume_id": "v1"}}}]}
{{ instance | json_query('instances[*].block_device_mapping.*.volume_id') }}
// output: ["v1"]`}</pre>
      </>
    )
  },
  { id: "url_qs", display: "url_qs" },
  { id: "url_raw_query", display: "url_raw_query" },
  { id: "json", display: "json" },
  { id: "url_path", display: "url_path" },
  { id: "combine", display: "combine", help: (
    <>
      <p><u>combine</u> merge objects together</p>
      <br/>
      <i>Example:</i>
      <pre>{`{{ {"a": 1, "b": 2} | combine({"b": 5, "e": 6}) }}
// output: {"a": 1, "b": 5, "e": 6}`}</pre>
    </>
    )},
  { id: "rest2dict", display: "rest2dict", help: (
    <>
      <p><u>rest2dict</u> turns a JSON string into a dictionary object</p>
      <p>Note: if the output contains an attribute "body" which is also a JSON string representation, it is automatically loaded as a dictionary object.</p>
    </>
    ) },
  { id: "regex_replace", display: "regex_replace" },
  { id: "regex_findall", display: "regex_findall" },
  { id: "regex_search", display: "regex_search" },
  { id: "unique", display: "unique", help: (
    <>
      <p><u>unique</u> remove all duplicates from an iterable.</p>
      <br/>
      <i>Example:</i>
      <pre>{`{{ [1, 2, 3, 2, 4] | unique }}
// output: [1, 2, 3, 4]`}</pre>
    </>
    ) },
  { id: "intersect", display: "intersect", help: (
    <>
      <p><u>intersect</u> compute the intersection of 2 lists and remove their duplicates (if any).</p>
      <br/>
      <i>Example:</i>
      <pre>{`{{ [1, 2, 3, 2, 4] | intersect([3, 5]) }}
// output: [3]`}</pre>
    </>
    )},
  { id: "difference", display: "difference", help: (
    <>
      <p><u>difference</u> remove a list from another and remove duplicates</p>
      <br/>
      <i>Example:</i>
      <pre>{`{{ [1, 2, 3, 2, 4] | difference([3, 5]) }}
// output: [1, 2, 4]`}</pre>
    </>
    )},
  { id: "union", display: "union", help: (
    <>
      <p><u>union</u> compute the union of 2 lists and removes their duplicates if any.</p>
      <br/>
      <i>Example:</i>
      <pre>{`{{ [1, 2, 3, 2, 4] | union([3, 5]) }}
// output: [1, 2, 3, 4, 5]`}</pre>
    </>
    )},

  // from the native library
  {id: "abs", display: "abs", help: (
    <>
      <p><u>abs</u> (from jinja2)</p>
      <p></p>
      </>
    )},
  {id: "attr", display: "attr", help: (
    <>
      <p><u>attr</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "batch", display: "batch", help: (
    <>
      <p><u>batch</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "capitalize", display: "capitalize", help: (
    <>
      <p><u>capitalize</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "center", display: "center", help: (
    <>
      <p><u>center</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "count", display: "count", help: (
    <>
      <p><u>count</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "d", display: "d", help: (
    <>
      <p><u>d</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "default", display: "default", help: (
    <>
      <p><u>default</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "dictsort", display: "dictsort", help: (
    <>
      <p><u>dictsort</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "e", display: "e", help: (
    <>
      <p><u>e</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "escape", display: "escape", help: (
    <>
      <p><u>escape</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "filesizeformat", display: "filesizeformat", help: (
    <>
      <p><u>filesizeformat</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "first", display: "first", help: (
    <>
      <p><u>first</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "float", display: "float", help: (
    <>
      <p><u>float</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "forceescape", display: "forceescape", help: (
    <>
      <p><u>forceescape</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "format", display: "format", help: (
    <>
      <p><u>format</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "groupby", display: "groupby", help: (
    <>
      <p><u>groupby</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "indent", display: "indent", help: (
    <>
      <p><u>indent</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "int", display: "int", help: (
    <>
      <p><u>int</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "join", display: "join", help: (
    <>
      <p><u>join</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "last", display: "last", help: (
    <>
      <p><u>last</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "length", display: "length", help: (
    <>
      <p><u>length</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "list", display: "list", help: (
    <>
      <p><u>list</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "lower", display: "lower", help: (
    <>
      <p><u>lower</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "map", display: "map", help: (
    <>
      <p><u>map</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "min", display: "min", help: (
    <>
      <p><u>min</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "max", display: "max", help: (
    <>
      <p><u>max</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "pprint", display: "pprint", help: (
    <>
      <p><u>pprint</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "random", display: "random", help: (
    <>
      <p><u>random</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "reject", display: "reject", help: (
    <>
      <p><u>reject</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "rejectattr", display: "rejectattr", help: (
    <>
      <p><u>rejectattr</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "replace", display: "replace", help: (
    <>
      <p><u>replace</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "reverse", display: "reverse", help: (
    <>
      <p><u>reverse</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "round", display: "round", help: (
    <>
      <p><u>round</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "safe", display: "safe", help: (
    <>
      <p><u>safe</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "select", display: "select", help: (
    <>
      <p><u>select</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "selectattr", display: "selectattr", help: (
    <>
      <p><u>selectattr</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "slice", display: "slice", help: (
    <>
      <p><u>slice</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "sort", display: "sort", help: (
    <>
      <p><u>sort</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "string", display: "string", help: (
    <>
      <p><u>string</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "striptags", display: "striptags", help: (
    <>
      <p><u>striptags</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "sum", display: "sum", help: (
    <>
      <p><u>sum</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "title", display: "title", help: (
    <>
      <p><u>title</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "trim", display: "trim", help: (
    <>
      <p><u>trim</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "truncate", display: "truncate", help: (
    <>
      <p><u>truncate</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "upper", display: "upper", help: (
    <>
      <p><u>upper</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "urlencode", display: "urlencode", help: (
    <>
      <p><u>urlencode</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "urlize", display: "urlize", help: (
    <>
      <p><u>urlize</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "wordcount", display: "wordcount", help: (
    <>
      <p><u>wordcount</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "wordwrap", display: "wordwrap", help: (
    <>
      <p><u>wordwrap</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "xmlattr", display: "xmlattr", help: (
    <>
      <p><u>xmlattr</u> (from jinja2)</p>
      <p></p>
    </>
    )},
  {id: "tojson", display: "tojson", help: (
    <>
      <p><u>tojson</u> (from jinja2)</p>
      <p></p>
    </>
    )},
]

const requestAttributes = [
  { id: "body", display: "body" },
]

const defaultStyle = {
  control: {
    backgroundColor: '#fff',
    fontSize: 14,
    fontWeight: 'normal',
  },

  '&multiLine': {
    control: {
      fontFamily: 'monospace',
      minHeight: 63,
    },
    highlighter: {
      padding: 9,
      border: '1px solid transparent',
    },
    input: {
      padding: 9,
      border: '1px solid silver',
    },
  },

  '&singleLine': {
    display: 'inline-block',
    width: 180,

    highlighter: {
      padding: 1,
      border: '2px inset transparent',
    },
    input: {
      padding: 1,
      border: '2px inset',
    },
  },

  suggestions: {
    list: {
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.15)',
      fontSize: 14,
    },
    item: {
      padding: '5px 15px',
      borderBottom: '1px solid rgba(0,0,0,0.15)',
      '&focused': {
        backgroundColor: '#cee4e5',
      },
    },
  },
}


export function MentionExample({cells, value, onChange}) {
  const [contextVars, setContextVars] = useState([]);
  useEffect(() => {
    setContextVars(cells && Object.values(cells).filter(options => options.original_name === "context_setter").map(options => options.params.key))
  }, [cells]);

  return (
   <MentionsInput value={value} onChange={(e, value) => onChange(value)} style={defaultStyle} allowSpaceInQuery>
      <Mention
        trigger={/(\|\s?([^ (|]*))/}
        displayTransform={filterName => `| ${filterName}`}
        markup={"| [__id__]"}
        data={filters.sort((a, b) => a.id.localeCompare(b.id))}
        renderSuggestion={(entry, search, highlightedDisplay, index, focused) => {
          const left = 100 + 40;
          const top = 10;
          const width = 400;
          if(focused) {
            console.log("renderSug.", entry, search, highlightedDisplay, index, focused);
          }
          return (
            <div>
              <div className={`${focused ? 'focused' : ''}`}>
                {highlightedDisplay}
              </div>
              { focused && entry.help &&
                <div style={{backgroundColor: '#ffffc6', padding: '5px 15px', position: 'absolute', left, top, width}}>
                  { entry.help }
                </div>
              }
            </div>
          )
        }}
      />

      <Mention
        trigger={/(request\.([^ (|]*))/}
        displayTransform={a => `request.${a}`}
        data={requestAttributes}
        markup={"request.[__id__]"}
        // renderSuggestion={this.renderTagSuggestion}
      />

      <Mention
        trigger={/(context\.([^ (|]*))/}
        displayTransform={a => `context.${a}`}
        markup={"context.[__id__]"}
        data={contextVars
          .map(v => ({id: v, display: v}))
          .reduce((p, c) => {
            if(p.find(e => e.id === c.id) === undefined) {
              p.push(c)
            }
            return p
          }, [])
        }
      />
    </MentionsInput>
  )
}
