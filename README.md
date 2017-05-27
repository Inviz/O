# Operational transformations

**OT** is a useful technique that merges concurrent changes to data in a determenistic way. Suppose two people start with identical JSON object, and start making changes to it by assigning keys, patching strings or applying math to numbers. Those two send changesets to each other, and OT ensures both would see identical result. 

**O** library provides implementation of OT algorithm that allows changes in nested JSON objects as well as in text documents. Like with text-based OT algorithms, the storage and processing time is mostly proportional to amount of changed bytes, not the total bytes of the data. The cost of inserting one element into beginning of a giant array is trivial, however overwriting an array is a huge deal.

**O** does not need access to the original json to manipulate changests, so it can transform them as if they happened **concurrently** (as if by one person at the same time) or **sequentially** (as if second person was editing after the other). The resulting changeset can be compacted to skip all intermediate steps not affecting result. 

So it is easy to create different kinds of eventual consistency schemes for multiple peers, be it dumb synchronization server or p2p collaboration. As soon as all peers ran their transformations, the history of operations can be restarted (i.e. a new version of object can be tagged), thus big documents may never grow out of control.


## Meta-circular tree for structured data:
  * Operations over all JSON types (strings, numbers, arrays and objects)
  * Uses JSON as AST, so any JSON is O expression 
  * No need for serialization/deserialization
  * Can compress patches by running them

## Performance and integration

**O** is written with critical attention to complexity and performance of both runtime and startup time. All algorithms produce no memory garbage. It is meant to be possible to embed it into postgresql via PLV8 with smallest footprint possible.

## API

### Methods


* `O(state, commands)` Apply *their* changes on top of *our* state. It is not necessary to have fully resolved object on our side. When left side is a command (and any json is), the result is effectively a combination of our and their operations as if they happened **sequentially**. 
* `O.transform(ours, theirs)`: Transform *their* commands as if they happened **concurrently** at the same time as *ours*. This makes them applicable for us safely without losing anybody's changes. If *they* do the same to *our* operations, ours histories will converge and will ield same result on both sides.
* `O.invert(ours, theirs)` - Create a command that undoes *their* commands upon *our* state. 

### Example
```javascript
  
// Two peers start with same identical of data
var person = {name: 'Bob Woofs'};

// One makes its changes
var change1 = {
  name: [[0, 3, 'George']],  // change first name
  title: 'Hustleman',       // set property
  balance: [['+', 100]]     // add value
}
var own1 = O(person, change1);
expect(own1).toEqual({name: 'George Woofs', title: 'Hustleman', balance: 100})

// Another make conflicting changes
var change2 = {
  name: [                   
    ['move', 4, 5, 0],      // swap last & first name
    ['move', 5, 3, 9]
  ],
  balance: [['-', 33]]      // remove value
};
var own2 = O(person, change2);
expect(own2).toEqual({name: 'Woofs Bob', balance: -33})

/* Now they both can apply each others commands.
   They are guaranteed to have identical result
   retaining semantic intent of both peers as much as possible */
var result1 = O(own1, O.transform(change1, change2));
var result2 = O(own2, O.transform(change2, change1));

expect(result1).toEqual({name: 'Woofs George', title: 'Hustleman', balance: 67})
expect(result2).toEqual({name: 'Woofs George', title: 'Hustleman', balance: 67})
```

### JSON changesets
```javascript
// unset `key` from object
{key: null}

// set `key` to `'value'`
{key: 'value']}

// Patching strings and arrays

// insert `test` at 3d position of `this.key`
{key: [[3, 0, 'test']]} 
{key: [[3, 0, ['t', 'e', 's', 't']]]}

// delete positions from 3 to 8 of `this.key`
{key: [[3, 5, '']]}
{key: [[3, 5, []]]}

// replace positions from 3 to 8 of `this.key` with sequence `'hello'`
{key: [[3, 5, 'hello']]}
{key: [[3, 5, ['h', 'e', 'l', 'l', 'o']]]}

// move elements from 4 to 9 to the right by 1 position
{key: [['move', 4, 5, 10]]}

// apply compacted patchset of 3 sequential splices to `this.key`
{key: [[3, 5, 'Yo', 10, 1, 'X', 21, 2, '']]}
{key: [[3, 5, ['Y', 'o'], 10, 1, ['X'], 21, 2, []]]}



// set deep key
{article: 
  {person: {
    name: 'Vasya'}}}

// unset deep key
{article: 
  {person: {
    name: null}}}

// merge object deeply (with nested patch)
{article: 
  {person: {
    name: 'Hello',
    title: [[0, 3, 'Bye']]}}}


// set `this.key` to array of two strings
{key: ['abcd', 'cde']}

// set `this.key` to be an array with one object
{key: [{title: 'Test'}]}

// set `this.key[0]` to `'abc'`
{key: {0: 'abc'}}

// splice `this.key[0..2]` and replace with 'efg'
{key: [[0, 2, ['efg']]]}

// patch `this.key[0]`
{key: {0: [[0, 2, 'efg']]}

// push an object into `this.key` array (may create it)
{key: [[0, 0, [{name: 'George'}]]]};

// update `this.key[0].title`
{key: [{0: {title: 'Developer'}}]}

// apply operations over different keys
{key:  [['move', 4, 5, 1]],
 key2: [0, 3, 'Hello'],
 key3: true}

```
## Acknowledgements
This library takes inspiration from jot library (github.com/joshData/jot), but it has differences:
- O has simplified AST, where practically any json is valid OT expression. Rebasing two plain json objects merges them, however values can use special notation of doubly nested array to process lists of commands. The fact that data snapshot is valid OT log is very handy in real world.
- O does not provide REN or MAP commands as of now, but it has safe implementation of MOVE command. With simplified command set O guarantees conflictless resolution in all scenarios
- O is built with fuzzy testing to ensure 110% coverage