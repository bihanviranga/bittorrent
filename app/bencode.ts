import { sortObjectByKeys } from "./util";

type DecodedDictionary = { [key: string]: DecodedValue };

export type DecodedValue =
  | string
  | number
  | Array<DecodedValue>
  | DecodedDictionary;

type DecodeResult = {
  value: DecodedValue;
  endIndex: number;
};

export function decodeBencode(bencodedValue: string): DecodedValue {
  const result = decodeHelper(bencodedValue);
  return result.value;
}

// Reference: https://wiki.theory.org/BitTorrentSpecification#Bencoding
function decodeHelper(bencodedValue: string): DecodeResult {
  if (!isNaN(parseInt(bencodedValue[0]))) {
    // If the first char is a digit, this is a bencoded string.
    const result = decodeBencodedString(bencodedValue);
    return result;
  } else if (bencodedValue[0] === "i") {
    // If the first char is 'i', this is a bencoded integer.
    // It goes until the char 'e' is met.
    const result = decodeBencodedInteger(bencodedValue);
    return result;
  } else if (bencodedValue[0] === "l") {
    const result = decodeBencodedList(bencodedValue);
    return result;
  } else if (bencodedValue[0] === "d") {
    const result = decodeBencodedDictionary(bencodedValue);
    return result;
  } else {
    throw new Error("Unsupported/invalid value");
  }
}

function decodeBencodedDictionary(bencodedValue: string): DecodeResult {
  const decodedDictionary: DecodedDictionary = {};

  // index = 1 ignores the starting "d"
  let cIndex = 1;
  let key: string | null = null;
  while (cIndex <= bencodedValue.length) {
    if (bencodedValue[cIndex] === "e") {
      break;
    }

    const substring = bencodedValue.substring(cIndex);

    // Reading the key
    if (!key) {
      const keyResult = decodeBencodedString(substring);
      key = keyResult.value as string;
      cIndex += keyResult.endIndex + 1;
      continue;
    }

    // Reading the value
    const result = decodeHelper(substring);
    decodedDictionary[key] = result.value;
    key = null;
    cIndex += result.endIndex + 1;
  }

  const sorted = sortObjectByKeys(decodedDictionary);
  return { value: sorted, endIndex: cIndex };
}

function decodeBencodedList(bencodedValue: string): DecodeResult {
  const decodedValues = [];

  // index = 1 ignores the starting "l"
  let cIndex = 1;
  while (cIndex <= bencodedValue.length) {
    if (bencodedValue[cIndex] === "e") {
      break;
    }

    const substring = bencodedValue.substring(cIndex);
    const result = decodeHelper(substring);
    decodedValues.push(result.value);
    cIndex += result.endIndex + 1;
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
  const encodedStrLength = value.length + sizeStr.length + 1;
  const endIndex = encodedStrLength - 1;
  return { value, endIndex };
}
