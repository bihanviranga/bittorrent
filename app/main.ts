import { readFile } from "node:fs";

import { decodeBencode } from "./bencode";
const args = process.argv;

if (args[2] === "decode") {
  try {
    const bencodedValue = args[3];
    const decoded = decodeBencode(bencodedValue);
    console.log(JSON.stringify(decoded));
  } catch (error: any) {
    console.error(error.message);
  }
} else if (args[2] === "info") {
  try {
    readTorrentFile(args[3]);
  } catch (error: any) {
    console.error(error.message);
  }
}

function readTorrentFile(filePath: string) {
  console.log(`[readTorrentFile] Reading file ${filePath}`);
  readFile(filePath, (err, data) => {
    if (err) throw err;

    const parsedData: Array<string | number> = [];
    data.forEach((byte) => {
      // This range includes all printable ASCII characters
      if (byte >= 32 && byte <= 126) {
        parsedData.push(String.fromCharCode(byte));
      } else {
        parsedData.push("x");
      }
    });

    const asString = parsedData.join("");
    const decoded = decodeBencode(asString) as {
      announce: string;
      info: { length: number };
    };
    console.log(`Tracker URL: ${decoded.announce}`);
    console.log(`Length: ${decoded.info.length}`);
  });
}
