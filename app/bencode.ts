export type DecodedValue = string | number | Array<DecodedValue>;

// TODO: use this type in other decode functions as well?
type DecodeResult = {
  value: DecodedValue;
  endIndex: number;
};

// Reference: https://wiki.theory.org/BitTorrentSpecification#Bencoding
export function decodeBencode(bencodedValue: string): DecodedValue {
  if (!isNaN(parseInt(bencodedValue[0]))) {
    // If the first char is a digit, this is a bencoded string.
    return decodeBencodedString(bencodedValue);
  } else if (bencodedValue[0] === "i") {
    // If the first char is 'i', this is a bencoded integer.
    // It goes until the char 'e' is met.
    return decodeBencodedInteger(bencodedValue);
  } else if (bencodedValue[0] === "l") {
    const result = decodeBencodedList(bencodedValue.substring(1));
    return result.value;
  } else {
    throw new Error("Unsupported/invalid value");
  }
}

// Can we return something like { value: DecodedValue, endIndex: number } from here,
// because it will really help with the recursion.
function decodeBencodedList(bencodedValue: string): DecodeResult {
  const decodedValues = [];

  let cIndex = 0;
  while (cIndex <= bencodedValue.length) {
    if (bencodedValue[cIndex] === "e") {
      break;
    }

    const substring = bencodedValue.substring(cIndex);

    if (!isNaN(parseInt(substring[0]))) {
      const value = decodeBencodedString(substring);
      decodedValues.push(value);

      // Calculate sizes necessary to update the cIndex.
      // We can assume 'size' is valid because if it's not, decodeBencodedString would throw an error.
      const [sizeStr, _] = substring.split(":", 2);

      // Update the cIndex
      // Add the size of the word ('value'), size of the length value ('42', etc) + 1 more for the colon char.
      cIndex += value.toString().length + sizeStr.length + 1;
    } else if (substring[0] === "i") {
      const value = decodeBencodedInteger(substring);
      decodedValues.push(value);

      // Calculate sizes necessary to update the cIndex.
      // We can assume that sizes are correct because if not, decodeBencodedInteger would throw.
      const integerEndIndex = substring.indexOf("e");
      cIndex = cIndex + integerEndIndex + 1;
    } else if (substring[0] === "l") {
      const result = decodeBencodedList(substring.substring(1));
      decodedValues.push(result.value);
      cIndex += result.endIndex;
    } else {
      throw new Error("Unsupported/invalid value");
    }
  }

  return { value: decodedValues, endIndex: cIndex };
}

// FIXME: try input i2-32e
function decodeBencodedInteger(bencodedValue: string): DecodedValue {
  // ex: i42e is 42
  const integerEndIndex = bencodedValue.indexOf("e");
  if (integerEndIndex === -1) {
    throw new Error(`Invalid encoded value: ${bencodedValue}`);
  }

  const valueString = bencodedValue.substring(1, integerEndIndex);

  if (valueString.startsWith("-0")) {
    // "-0" and leading zeroes are not allowed.
    throw new Error(`Invalid encoded value: ${bencodedValue}`);
  }

  if (valueString.startsWith("0") && valueString !== "0") {
    // Leading zeroes not allowed, except for "i0e".
    throw new Error(
      `Encoded integers cannot have leading zeroes. Got: ${bencodedValue}`,
    );
  }

  const decodedNumber = parseInt(valueString);
  if (isNaN(decodedNumber)) {
    throw new Error(`Unable to parse as an integer: ${valueString}`);
  }

  return decodedNumber;
}

function decodeBencodedString(bencodedValue: string): DecodedValue {
  // ex: 5:hello - where 5 is the length of the string

  const [sizeStr, word] = bencodedValue.split(":", 2);

  const size = parseInt(sizeStr);
  if (isNaN(size)) {
    throw new Error(`Invalid string length: ${sizeStr}`);
  }

  const value = word.substring(0, size);
  if (value.length !== size) {
    throw new Error(
      `Expected string '${value}' to be of length ${size}, got ${value.length}`,
    );
  }

  return value;
}
