// Reference: https://wiki.theory.org/BitTorrentSpecification#Metainfo_File_Structure
// Single File Mode
export type TorrentFile = {
  announce: string;
  info: {
    name: string;
    length: number;
    "piece length": number;
    pieces: string;
  };
};

export type DecodedDictionary = { [key: string]: DecodedValue };

export type DecodedValue =
  | string
  | number
  | Array<DecodedValue>
  | DecodedDictionary;

export type DecodeResult = {
  value: DecodedValue;
  endIndex: number;
};
