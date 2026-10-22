function fieldSupported(field,serverVersion){return (field.minRegistryVersion||1)<=Math.max(1,Number(serverVersion)||1)}
function supportedValues(values,fields,serverVersion){return Object.fromEntries(fields.filter(field=>fieldSupported(field,serverVersion)&&Object.prototype.hasOwnProperty.call(values,field.key)).map(field=>[field.key,values[field.key]]))}
module.exports={fieldSupported,supportedValues}
