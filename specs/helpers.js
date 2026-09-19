const alphabets = [
  // Latin Basic + Latin-1 Supplement
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  // Greek
  "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω",
  // Cyrillic
  "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя",
  // Armenian
  "ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖաբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆ",
  // Hebrew
  "אבגדהוזחטיכלמנסעפצקרשת",
  // Arabic
  "ابتثجحخدذرزسشصضطظعغفقكلمنهوي"
].join('');


var letters = Array(256);
for (var i = 0; i < letters.length; i++)
  letters[i] = alphabets[i]
var alphabet = letters.join('')
function transform(left, right, leftE, rightE, input, normalized, ops) {
  if (!input) input = alphabet

  var rightT = O.transform(left, right, normalized);
  var leftT  = O.transform(right, left, normalized);

  if (arguments.length > 2 && (leftE !== undefined || rightE !== undefined)) {
    // An answer decided in a shared coordinate frame carries that frame as a trailing
    // ['frame', ...] operation. These expectations state the EDIT; a frame is not an edit, so
    // it is left out of the shape comparison. The convergence assertions below, and
    // specs/frame.js, run on the answer with its frame still on.
    expect(O.frame.unstamp(leftT)).toEqual(leftE)
    expect(O.frame.unstamp(rightT)).toEqual(rightE)
    expect(   O(O(input, right), leftE))
    .toEqual( O(O(input, left), rightE))
  }

  if (O(O(input, right), leftT) !== O(O(input, left), rightT)) {
    console.log(left, right)
    console.log(ops, input)
    console.log(O(O(input, right), leftT), O(O(input, left), rightT))
  }

  // ensure that both transformed sides produce the same result
  expect(   O(O(input, right), leftT))
  .toEqual( O(O(input, left), rightT))

  return O(O(input, right), leftT);
}




function invert(left, right, rightE) {
  var rightT = O.invert(left, right);
  if (rightE)
    expect(rightT).toEqual(rightE)
  expect(O(O(left, right), rightT)).toEqual(left)
}

function normalize(left, right, ignoreResult) {
  var normalized = O.normalize(left)

  // ensure list is wellformed    
  if (normalized && O.typeof(normalized) == 'splice')
    for (var i = 3; i < normalized.length; i += 3)
      if (normalized[i - 3] >= normalized[i]) {
        expect(normalized[i]).toBeGreaterThan(normalized[i - 3])
        throw 1;
      }
  
  // check normalized result if provided
  if (!ignoreResult) {
    var prev = -1;
    expect(normalized).toEqual(right);
    expect(O(alphabet, left)).toEqual(O(alphabet, right))
  } else {
    expect(O(alphabet, left)).toEqual(O(alphabet, normalized))
  }
  
}

// Test helper to verify that concurrent operations from multiple peers converge to the same final state.
// opLists: an array where each element is an array of operations from a peer.
// input: the initial state to which operations are applied.
// normalized: a flag to indicate if operations are normalized before transformation.
function transformMany(opLists, input, normalized) {
  var finalStates = [];
  const transformedStates = [];
  for (var i = 0; i < opLists.length; i++) {
    transformedStates[i] = [...opLists[i]];
    console.log(transformedStates[i], 'initial')
    for (var j = 0; j < opLists.length; j++) {
      if (j !== i) {
        if (JSON.stringify(opLists[j]) == JSON.stringify([[64, 14, '']])) {
          debugger
        }
        console.log(transformedStates[i], 'affects', opLists[j], '=>', O.transform(transformedStates[i], opLists[j], normalized))
        transformedStates[i] =[...transformedStates[i], O.transform(transformedStates[i], opLists[j], normalized)];
      }
    }
    var finalState = O(input, transformedStates[i]);
    finalStates.push(finalState);
  }
  for (var i = 1; i < finalStates.length; i++) {
    expect(finalStates[i]).toEqual(finalStates[0]);

    if (finalStates[i] != finalStates[0]) {
      console.log(opLists)
      console.log(transformedStates)
      console.log(finalStates)
    }
  
  }
  return finalStates[0];
}