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
    const result = decodeBencodedString(bencodedValue);
    return result.value;
  } else if (bencodedValue[0] === "i") {
    // If the first char is 'i', this is a bencoded integer.
    // It goes until the char 'e' is met.
    const result = decodeBencodedInteger(bencodedValue);
    return result.value;
  } else if (bencodedValue[0] === "l") {
    const result = decodeBencodedList(bencodedValue.substring(1));
    return result.value;
  } else {
    throw new Error("Unsupported/invalid value");
  }
}

function decodeBencodedList(bencodedValue: string): DecodeResult {
  const decodedValues = [];

  let cIndex = 0;
  while (cIndex <= bencodedValue.length) {
    if (bencodedValue[cIndex] === "e") {
      break;
    }

    const substring = bencodedValue.substring(cIndex);

    if (!isNaN(parseInt(substring[0]))) {
      const result = decodeBencodedString(substring);
      decodedValues.push(result.value);
      cIndex += result.endIndex;
    } else if (substring[0] === "i") {
      const result = decodeBencodedInteger(substring);
      decodedValues.push(result.value);
      // The +1 ensures we skip the integer delimiter 'e' and start next round with the next char.
      cIndex += result.endIndex + 1;
    } else if (substring[0] === "l") {
      const result = decodeBencodedList(substring.substring(1));
      decodedValues.push(result.value);
      // The +1's' accounts for the "l" at the beginning and skips the delimiter "e" at the end
      cIndex += result.endIndex + 1 + 1;
    } else {
      throw new Error("Unsupported/invalid value");
    }
  }

  return { value: decodedValues, endIndex: cIndex };
}

// FIXME: try input i2-32e
function decodeBencodedInteger(bencodedValue: string): DecodeResult {
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

  return { value: decodedNumber, endIndex: integerEndIndex };
}

function decodeBencodedString(bencodedValue: string): DecodeResult {
  // ex: 5:hello - where 5 is the length of the string

  const delimiterIndex = bencodedValue.indexOf(":");
  if (delimiterIndex === -1) {
    throw new Error(`Expected ':' but found none in ${bencodedValue}`);
  }

  const sizeStr = bencodedValue.slice(0, delimiterIndex);
  const word = bencodedValue.slice(delimiterIndex + 1);

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

  // +1 accounts for the ":" character
  const endIndex = value.length + sizeStr.length + 1;
  return { value, endIndex };
}
