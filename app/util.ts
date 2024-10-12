/**
 * Given an object, sort it so that the keys are sorted lexicographically.
 */
export function sortObjectByKeys<T extends Record<string, any>>(obj: T): T {
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: { [key: string]: any } = {};

  for (const key of sortedKeys) {
    sortedObj[key] = obj[key];
  }

  return sortedObj as T;
}
