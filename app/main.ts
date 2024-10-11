type DecodedValue = string | number;

// Reference: https://wiki.theory.org/BitTorrentSpecification#Bencoding
function decodeBencode(bencodedValue: string): DecodedValue {
  if (!isNaN(parseInt(bencodedValue[0]))) {
    // If the first char is a digit, this is a bencoded string.
    // ex: 5:hello - where 5 is the length of the string
    const firstColonIndex = bencodedValue.indexOf(":");
    if (firstColonIndex === -1) {
      throw new Error(`Invalid encoded value: ${bencodedValue}`);
    }
    // TODO: check if the substring is the correct length. Throw an error otherwise.
    return bencodedValue.substring(firstColonIndex + 1);
  } else if (bencodedValue[0] === "i") {
    // If the first char is 'i', this is a bencoded integer.
    // It goes until the char 'e' is met.
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
  } else {
    throw new Error("Unsupported/invalid value");
  }
}

const args = process.argv;
const bencodedValue = args[3];

if (args[2] === "decode") {
  try {
    const decoded = decodeBencode(bencodedValue);
    console.log(JSON.stringify(decoded));
  } catch (error: any) {
    console.error(error.message);
  }
}
