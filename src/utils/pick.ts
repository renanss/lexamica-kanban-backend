/**
 * Create an object composed of the picked object properties
 * @param {Record<string, any>} object - The source object
 * @param {string[]} keys - The properties to pick
 * @returns {Record<string, any>} A new object with just the picked properties
 */
const pick = (object: Record<string, any>, keys: string[]): Record<string, any> => {
  return keys.reduce((obj: Record<string, any>, key: string) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

export default pick; 