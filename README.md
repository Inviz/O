# Operational transformations

**OT** is a useful technique that merges concurrent changes to data in a determenistic way. Suppose two people start with identical JSON object, and start making changes to it by assigning keys, patching strings or applying math to numbers. Those two send changesets to each other, and OT ensures both would see identical result. 

**O** library provides implementation of OT algorithm that allows changes in nested JSON objects as well as in text documents. Like with text-based OT algorithms, the storage and processing time is mostly proportional to amount of changed bytes, not the total bytes of the data. The cost of inserting one element into beginning of a giant array is trivial, however overwriting an array is a huge deal.

**O** does not need access to the original json to manipulate changests, so it can transform them as if they happened **concurrently** (as if by one person at the same time) or sequentially (as if second person was editing after the other). The resulting changeset can be compacted to skip all intermediate steps not affecting result. 

So it is easy to create different kinds of eventual consistency schemes for multiple peers, be it dumb synchronization server or p2p collaboration. As soon as all peers ran their transformations, the history of operations can be restarted (i.e. a new version of object can be tagged), thus big documents may never grow out of control.


## Structured data:
  * Operations over all JSON types (strings, numbers, arrays and objects)
  * Uses JSON values as AST, so any JSON is O expression
  * No need for serialization/deserialization

## Performance and integration

**O** is written with critical attention to complexity and performance of both runtime and startup time. It is meant to be possible to embed it into postgresql via PLV8 so it has almost no footprint.

## API
```javascript
  // unset `key` from object
  {key: null}

  // set `key` to `'value'`
  {key: 'value']}

  // insert `test` at 3d char of `this[key]`
  {key: [3, 0, 'test']]}

  // delete characters from 3 to 8 of `this[key]`
  {key: [3, 5, '']]}

  // replace characters from 3 to 8 of `this[key]` with substring `'hello'`
  {key: [3, 5, 'hello']]}

  // move elements from 4 to 9 to the right by 1 position
  {key: ['move', 4, 5, 10]}

  // apply compacted patchset of 3 sequential splices to `this[key]`
  {key: [3, 5, 'hello', 10, 1, 'test', 21, 2, '']]}

  // apply operations over different keys
  {'key':  [['move', 4, 5]],
   'key2': [['move', 4, 5]]}

  // set deep key
  {article: 
    {person: {
      name: 'Vasya'}}}

  // unset deep key
  {article: 
    {person: {
      name: null}}}
```
## Acknowledgements
This library takes inspiration from jot library (github.com/joshData/jot), but it has differences:
- O has simplified AST, where practically any json is valid OT expression. Rebasing two plain json objects merges them, however values can use special notation of doubly nested array to process lists of commands. The fact that data snapshot is valid OT log is very handy in real world.
- O does not provide REN or MAP commands as of now, but it has safe implementation of MOVE command. With simplified command set O guarantees conflictless resolution in all scenarios
- O is built with fuzzy testing to ensure 110% coverage