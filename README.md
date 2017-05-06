### Features

* Operational transformations:
  * Determenistic synchronization without 
  * Can invert operations

* Structured data:
  * Operations over all JSON types (strings, numbers, arrays and objects)
  * Uses JSON values as AST, so any JSON is O expression
  * No need for serialization/deserialization



# API
// rem
{key: null}

// set
{key: 'value']}

// ins
{key: [3, 'test']]}

// del
{key: [3, 5]]}

// splice
{key: [3, 5, 'hello']]}

// move
{key: ['move', 4, 5, 10]}

// patch multiple
{key: [3, 5, 'hello', 10, 1, 'test', 21, 2, '']]}

// apply multiple
{'key':  [['move', 4, 5]],
 'key2': [['move', 4, 5]]}

{article: 
  {person: {
    name: 'Vasya'}}}

{article: 
  {person: {
    name: null}}}
