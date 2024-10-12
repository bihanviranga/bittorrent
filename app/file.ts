import { readFile } from "node:fs";
import { decodeBencode } from "./bencode";
import type { TorrentFile } from "./types";

export function readTorrentFile(filePath: string) {
  readFile(filePath, (err, data) => {
    if (err) throw err;

    const parsedData: Array<string | number> = [];
    data.forEach((byte) => {
      // This range includes all printable ASCII characters
      // if (byte >= 32 && byte <= 126) {
      parsedData.push(String.fromCharCode(byte));
      // } else {
      //   parsedData.push(String.fromCharCode(byte));
      // }
    });

    const asString = parsedData.join("");
    const decoded = decodeBencode(asString) as TorrentFile;

    console.log(`Tracker URL: ${decoded.announce}`);
    console.log(`Length: ${decoded.info.length}`);
    // console.log(decoded);
  });
}
