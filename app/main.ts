import { decodeBencode } from "./bencode";
import { readTorrentFile } from "./file";

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
