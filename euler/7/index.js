module.exports = {
  /**
   * Problem 61 Cyclical figurate numbers
   *
   * Triangle, square, pentagonal, hexagonal, heptagonal, and octagonal numbers are all figurate (polygonal) numbers and are generated by the following formulae:
   *
   * Triangle P3,n=n(n+1)/2  1, 3, 6, 10, 15, ...
   * Square P4,n=n^2  1, 4, 9, 16, 25, ...
   * Pentagonal P5,n=n(3n−1)/2   1, 5, 12, 22, 35, ...
   * Hexagonal P6,n=n(2n−1)   1, 6, 15, 28, 45, ...
   * Heptagonal P7,n=n(5n−3)/2   1, 7, 18, 34, 55, ...
   * Octagonal P8,n=n(3n−2)   1, 8, 21, 40, 65, ...
   *
   * The ordered set of three 4-digit numbers: 8128, 2882, 8281, has three interesting properties.
   * 1. The set is cyclic, in that the last two digits of each number is the first two digits of the next number (including the last number with the first).
   * 2. Each polygonal type: triangle (P3,127=8128), square (P4,91=8281), and pentagonal (P5,44=2882), is represented by a different number in the set.
   * 3. This is the only set of 4-digit numbers with this property.
   *
   * @question Find the sum of the only ordered set of six cyclic 4-digit numbers for which each polygonal type: triangle, square, pentagonal, hexagonal,
   * @question heptagonal, and octagonal, is represented by a different number in the set.
   */
  e61() {
    const polygonalTables = [{}, {}, {}, {}, {}, {}];
    const startingIndexes = [45, 32, 26, 23, 21, 19];
    const polygonGenerators = [
      n => n * (n + 1) / 2,
      n => n * n,
      n => n * (3 * n - 1) / 2,
      n => n * (2 * n - 1),
      n => n * (5 * n - 3) / 2,
      n => n * (3 * n - 2),
    ];

    // table indexed by prefixes
    // constructed such that finding all the polygonals starting with any 2 digits can be done with O(1)
    const prefixLookup = {};

    for (let i = 0; i < startingIndexes.length; i++) {
      const side = i + 3;
      const startingIndex = startingIndexes[i];
      let generatedNumber = 0;
      for (let n = startingIndex; generatedNumber < 10000; n++) {
        generatedNumber = polygonGenerators[i](n);
        const [prefix, suffix] = `${generatedNumber}`.match(/\d{1,2}/g);
        if (suffix.charAt(0) === '0' || generatedNumber > 9999) {
          // third digit is 0, cannot be in a cycle
          continue;
        }
        polygonalTables[i][generatedNumber] = true;

        if (!prefixLookup[prefix]) {
          prefixLookup[prefix] = {};
        }

        if (!prefixLookup[prefix][side]) {
          prefixLookup[prefix][side] = [];
        }

        prefixLookup[prefix][side].push(generatedNumber);
      }
    }

    const octagons = polygonalTables[5];

    // simulate a tree, recursively find a path of length 6
    function findPath(path, acc) {
      // cycle complete
      if (path.length === 6) {
        const first = path[0];
        const last = path[5];
        if (Math.floor(first / 100) === last % 100) {
          // FOUND!
          return path;
        }
        return false;
      }
      const last = path[path.length - 1];

      const suffix = last.toString().match(/\d{1,2}/g)[1];

      // all polygonals starting with the current suffix
      const nextPolygons = prefixLookup[suffix];
      if (!nextPolygons) {
        return false;
      }

      // find the next polygon from all sides which are still missing from the cycle
      const missingSides = Object.keys(acc).filter(key => !acc[key]);
      for (let i = 0; i < missingSides.length; i++) {
        const missingSide = missingSides[i];
        const nextMatchingPolygons = nextPolygons[missingSide];
        if (nextMatchingPolygons) {
          for (let j = 0; j < nextMatchingPolygons.length; j++) {
            const nextPolygon = nextMatchingPolygons[j];
            // if a valid path is found, return it, otherwise keep looping
            const findNextPath = findPath([...path, nextPolygon], { ...acc, [missingSide]: nextPolygon });
            if (findNextPath) {
              return findNextPath;
            }
          }
        }
      }

      // if no polygons are found with none of the missing sides, return false
      return false;
    }

    // we start our path from the octagons to minimize loop count
    for (let o = 0; o < Object.keys(octagons).length; o++) {
      const octagon = +Object.keys(octagons)[o];
      const validPath = findPath([octagon], {
        3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: octagon,
      });
      if (validPath) {
        return utils.sumArray(validPath);
      }
    }
  },

  /**
   * Problem 62 Cubic permutations
   *
   * The cube, 41063625 (345^3), can be permuted to produce two other cubes: 56623104 (384^3) and 66430125 (405^3).
   * In fact, 41063625 is the smallest cube which has exactly three permutations of its digits which are also cube.
   *
   * @question Find the smallest cube for which exactly five permutations of its digits are cube.
   */
  e62() {
    // we generate a cube, sort its digits, and index it
    // whenever an index has length 5, return result
    const cubeClasses = {};

    let base = 1;
    let found = false;
    while (!found) {
      const cube = base ** 3;
      const sortedKey = cube.toString().split('').sort().join('');
      if (!cubeClasses[sortedKey]) {
        cubeClasses[sortedKey] = [cube];
      } else {
        cubeClasses[sortedKey].push(cube);
      }

      if (cubeClasses[sortedKey].length > 4) {
        found = true;
        return cubeClasses[sortedKey][0];
      }
      base++;
    }
  },

  /**
   * Problem 63 Powerful digit counts
   *
   * The 5-digit number, 16807=7^5, is also a fifth power. Similarly, the 9-digit number, 134217728=8^9, is a ninth power.
   * @question How many n-digit positive integers exist which are also an nth power?
   */
  e63() {
    let answer = 0;

    // we reach the limit when the number of digits of 9^n is smaller than n
    let limitReached = false;
    let exponent = 1;

    while (!limitReached) {
      for (let digit = 9; digit > 0; digit--) {
        const power = digit ** exponent;
        const digitCount = power.toString().length;
        if (digitCount < exponent) {
          if (digit === 9) {
            limitReached = true;
            return answer;
          }
          break;
        }
        answer++;
      }
      exponent++;
    }
  },

  /**
   * Problem 64 Odd period square roots
   *
   * [tldr; Generate the leading digits of the continued fraction form of the square roots and detect repeating digits](https://projecteuler.net/problem=64)
   * @question How many continued fractions for N≤10000 have an odd period?
   */
  e64() {
    const squares = [...Array(100)].reduce((acc, _, i) => {
      acc[i ** 2] = true;
      return acc;
    }, {});

    let answer = 0;

    for (let N = 2; N < 10000; N++) {
      if (squares[N]) {
        continue;
      }

      // we generate the sequence of isolated integers (ie. leading numbers in the continued fraction sequence) by
      // 1. Normalizing our irrational fraction (ie. `numerator / (root - offset)`) by multiplying by `(root + offset)/(root + offset)`
      // 2. Isolating the next leading integer by finding the integral part of our normalized fraction
      // 3. flip the fractional part to use for the next iteration
      const root = Math.sqrt(N);
      const floor = Math.floor(root);

      let repetitionFound = false; // if a repetition has been found, we can exit the loop (explained below)

      // the following variables are updated on every iteration
      let period = 0; // period count

      let isolatedInteger = floor; // leading digit of our current iteration
      let normalizedDenominator; // the denominator as a result of normalization
      let initialNumerator = 1; // the normalized and reduced denominator (by the initial numerator) of the previous iteration
      let denominatorOffset = floor; // the offset found in the denominator as a result of isolating the leading integer from the previous iteration

      while (!repetitionFound) {
        // normalize
        normalizedDenominator = N - (denominatorOffset ** 2);

        // isolate
        isolatedInteger = Math.floor(initialNumerator * (floor + denominatorOffset) / normalizedDenominator);
        period++;
        if (normalizedDenominator === initialNumerator) {
          // the initialNumerator always starts with 1
          // if the above two variables are equal, then the next initialNumerator will be 1, which will cause the cycle to repeat
          repetitionFound = true;
          if (period & 1) {
            answer++;
          }
          break;
        }

        // update for next iteration
        initialNumerator = normalizedDenominator / initialNumerator;
        denominatorOffset = Math.abs(denominatorOffset - initialNumerator * isolatedInteger);
      }
    }
    return answer;
  },

  /**
   * Problem 65 Convergents of e
   * [tldr; Find ith element from a sequence of partial continued fraction](https://projecteuler.net/problem=65)
   *
   * @question Find the sum of digits in the numerator of the 100th convergent of the continued fraction e
   */
  e65() {
    function getNthLeadingInteger(n) {
      if (n < 3) {
        return n;
      }

      if (n % 3 === 2) {
        return 2 * (Math.floor(n / 3) + 1);
      }

      return 1;
    }

    const target = 100;
    let numerator = 1;
    let denominator = getNthLeadingInteger(target - 1);
    for (let i = target - 1; i >= 1; i--) {
      const nextLeadingInteger = getNthLeadingInteger(i - 1);
      [numerator, denominator] = [BigInt(denominator), BigInt(nextLeadingInteger) * BigInt(denominator) + BigInt(numerator)];
    }

    numerator += (denominator * 2n); // add leading constant
    return utils.sumArray(numerator.toString().split(''), n => +n);
  },

  /**
   * Problem 66 Diophantine equation
   */
};
