import React, {useEffect, useRef, useState} from 'react'
import ReactTextareaAutocomplete from '@webscopeio/react-textarea-autocomplete'
import "@webscopeio/react-textarea-autocomplete/style.css";

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
  {
    id: "url_qs",
    display: "url_qs",
    help: (
      <>
        <p><u>url_qs</u> extract query string from an URL in input and return it as a dict object.</p>
        <br/>
        <i>Example:</i>
        <pre>{`{{ "http://www.google.com/?param=1&filter=test" | url_qs }}
// output: {"param": "1", "filter": "test"}`}</pre>
      </>
    )
  },
  {
    id: "url_raw_query",
    display: "url_raw_query",
    help: (
      <>
        <p><u>url_raw_query</u> extract query string from an URL in input.</p>
        <br/>
        <i>Example:</i>
        <pre>{`{{ "http://www.google.com/?param=1&filter=test" | url_raw_query }}
// output: param=1&filter=test`}</pre>
      </>
    )
  },
  {
    id: "json",
    display: "json",
    help: (
      <>
        <p><u>json</u> turns a JSON string into a dictionary object</p>
        <p>Note: if the output contains an attribute "body" which is also a JSON string representation, it is automatically loaded as a dictionary object.</p>
      </>
    )
  },
  {
    id: "url_path",
    display: "url_path",
    help: (
      <>
        <p><u>url_path</u> extract the path from an URL in input.</p>
        <br/>
        <i>Example:</i>
        <pre>{`{{ "http://www.google.com/?param=1&filter=test" | url_path }}
// output: /
{{ "http://www.google.com/path/to/your/page?param=1&filter=test" | url_path }}
// output: /path/to/your/page`}</pre>
      </>
    )
  },
  {
    id: "combine",
    display: "combine",
    help: (
      <>
        <p><u>combine</u> merge objects together</p>
        <br/>
        <i>Example:</i>
        <pre>{`{{ {"a": 1, "b": 2} | combine({"b": 5, "e": 6}) }}
  // output: {"a": 1, "b": 5, "e": 6}`}</pre>
      </>
      )
  },
  { id: "rest2dict", display: "rest2dict", help: (
    <>
      <p><u>rest2dict</u> (alias for json filter) turns a JSON string into a dictionary object</p>
      <p>Note: if the output contains an attribute "body" which is also a JSON string representation, it is automatically loaded as a dictionary object.</p>
    </>
    ) },
  {
    id: "regex_replace",
    display: "regex_replace",
    help: (
      <>
        <p><u>regex_replace</u> replace text in a string with regex</p>
        <br/>
        <i>Example:</i>
        <pre>{`# convert "ansible" to "able"
{{ 'ansible' | regex_replace('^a.*i(.*)$', 'a\\\\1') }}

# convert "foobar" to "bar"
{{ 'foobar' | regex_replace('^f.*o(.*)$', '\\\\1') }}

# convert "localhost:80" to "localhost, 80" using named groups
{{ 'localhost:80' | regex_replace('^(?P<host>.+):(?P<port>\\\\d+)$', '\\\\g<host>, \\\\g<port>') }}

# convert "localhost:80" to "localhost"
{{ 'localhost:80' | regex_replace(':80') }}

# change a multiline string
{{ var | regex_replace('^', '#CommentThis#', multiline=True) }}`}</pre>
      </>
    )
  },
  {
    id: "regex_findall",
    display: "regex_findall",
    help: (
      <>
        <p><u>regex_findall</u> search for all occurrences of regex matches</p>
        <br/>
        <i>Example:</i>
        <pre>{`# Return a list of all IPv4 addresses in the string
{{ 'Some DNS servers are 8.8.8.8 and 8.8.4.4' | regex_findall('\\\\b(?:[0-9]{1,3}\\\\.){3}[0-9]{1,3}\\\\b') }}`}</pre>
      </>
    )
  },
  {
    id: "regex_search",
    display: "regex_search",
    help: (
      <>
        <p><u>regex_search</u> search a string with a regex</p>
        <br/>
        <i>Example:</i>
        <pre>{`# search for "foo" in "foobar"
{{ 'foobar' | regex_search('(foo)') }}

# will return empty if it cannot find a match
{{ 'ansible' | regex_search('(foobar)') }}

# case insensitive search in multiline mode
{{ 'foo\\nBAR' | regex_search("^bar", multiline=True, ignorecase=True) }}`}</pre>
      </>
    )
  },
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
      <p>Return the absolute value of the argument.</p>
      </>
    )},
  {id: "attr", display: "attr", help: (
    <>
      <p><u>attr</u> (from jinja2)</p>
      <p>Get an attribute of an object.</p>
      <p>
        <pre>foo|attr("bar")</pre> works like
        <pre>foo.bar</pre> just that always an attribute is returned and items are not looked up.
      </p>
    </>
    )},
  {id: "batch", display: "batch", help: (
    <>
      <p><u>batch</u> (from jinja2)</p>
      <p>A filter that batches items. It works pretty much like <i>slice</i> just the other way round.
        <br/>It returns a list of lists with the given number of items.
        <br/>If you provide a second parameter this is used to fill up missing items.
      </p>
      <br/>
      <i>Example:</i>
      <pre>
        {`<table>
{%- for row in items|batch(3, '&nbsp;') %}
  <tr>
  {%- for column in row %}
    <td>{{ column }}</td>
  {%- endfor %}
  </tr>
{%- endfor %}
</table>`}
      </pre>
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
      <p>
        Apply the given values to a <a href={"https://docs.python.org/library/stdtypes.html#printf-style-string-formatting"}><i>printf-style</i></a> format string, like
        <pre>string % values</pre>
      </p>
      <pre>{`{{ "%s, %s!"|format(greeting, name) }}
Hello, World!`}
      </pre>
      <p>In most cases it should be more convenient and efficient to use the ``%`` operator or :meth:`str.format`.</p>
      <pre>{`{{ "%s, %s!" % (greeting, name) }}
{{ "{}, {}!".format(greeting, name) }}`}</pre>
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
      <p>
        Slice an iterator and return a list of lists containing those items.
        <br/>Useful if you want to create a div containing three ul tags that represent columns.
      </p>
      <pre>
        {`<div class="columnwrapper">
  {%- for column in items|slice(3) %}
    <ul class="column-{{ loop.index }}">
    {%- for item in column %}
      <li>{{ item }}</li>
    {%- endfor %}
    </ul>
  {%- endfor %}
</div>`}
      </pre>
      <p>
    If you pass it a second argument it's used to fill missing
    values on the last iteration.

      </p>
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
      <p>Strip SGML/XML tags and replace adjacent whitespace by one space.</p>
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
      <p>Strip leading and trailing characters, by default whitespace.</p>
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

const Item = ({ entity: { id, display, help }, selected }) => {
  const left = 100 + 40;
  const top = 10;
  const width = 400;
  return <>
    <div>{`${display}`}</div>
    {
      selected && help &&
        <div style={{backgroundColor: '#ffffc6', padding: '5px 15px', color: 'black', position: 'absolute', left, top, width}}>
          { help }
        </div>
    }
  </>
}

const Loading = ({ data }) => <div>Loading...</div>;

export function MentionExample({cells, value, onChange, ...props}) {
  const [contextVars, setContextVars] = useState([]);
  const [caretP, setCaretP] = useState(0);
  const [currentFilter, setCurrentFilter] = useState();

  useEffect(() => {
    setContextVars(cells && Object.values(cells).reduce((o, options) => {
        if(options.original_name === "context_setter") {
          o.push(options.params.key)
        } else if(options.params && options.params.output_context_key) {
          o.push(options.params.output_context_key)
        }
        return o;
      }, [])
    )
  }, [cells]);

  useEffect(() => {
    if(!value) setCurrentFilter(null)
    if(caretP > 0) {
      const matches = value.slice(0, caretP).matchAll(/([\w0-9\-_]*)\(/mg)
      let lastMatch = undefined
      for (const match_ of matches) {
        // console.log(`Found ${match_[0]} start=${match_.index} end=${match_.index + match_[0].length}.`);
        lastMatch = match_
      }

      if(lastMatch===undefined) {
        setCurrentFilter(null)
        return undefined
      }

      const f = filters.find(f => f.display === lastMatch[1])
      console.log("value", value.slice(0, caretP), "match", lastMatch, "filter", f)
      if(!f || !f.help) setCurrentFilter(null)
      else {
        const openPara = (value.slice(lastMatch.index, caretP).match(/\(/g) || []).length
        const closePara = (value.slice(lastMatch.index, caretP).match(/\)/g) || []).length
        if(openPara > closePara) {
          setCurrentFilter(f)
        } else {
          setCurrentFilter(null)
        }
      }
    }
  },
    [caretP, value]
  )

  return (
    <>
      <ReactTextareaAutocomplete
        value={value}
        onChange={e => onChange(e.target.value)}
        className={"form-control"}
        loadingComponent={Loading}
        style={{fontSize: "14px"}}
        dropdownStyle={{zIndex:1000}}
        movePopupAsYouType={true}
        onCaretPositionChange={setCaretP}
        minChar={0}

        trigger={{
          "|": {
            dataProvider: token => {
              return filters
                .filter(f => f.display.includes(token))
                .slice(0, 5);
            },
            component: Item,
            output: (item, trigger) => ({text: `| ${item.display}`, caretPosition: "end"}),
          },
          "context.": {
            dataProvider: token => {
              return contextVars
                .map(v => ({id: v, display: v}))
                .reduce((p, c) => {
                  if(p.find(e => e.id === c.id) === undefined) {
                    p.push(c)
                  }
                  return p
                }, [])
                .map(a => ({id: `context.${a.id}`, display: `context.${a.display}`}))
                .filter(a => a.display.includes(token))
                .slice(0, 5);
            },
            component: Item,
            output: (item, trigger) => `${item.display}`,
          },
          "request.": {
            dataProvider: token => {
              return requestAttributes
                .map(a => ({id: `request.${a.id}`, display: `request.${a.display}`}))
                .filter(a => a.display.includes(token))
                .slice(0, 5);
            },
            component: Item,
            output: (item, trigger) => `${item.display}`,
          }
        }}
        {...props}
        />
        {
          currentFilter &&
          <div style={{backgroundColor: '#ffffc6', padding: '5px 15px', color: 'black'}}>
            { currentFilter.help }
          </div>
        }
    </>
  )
}
