const defaultOverrideHeaderKey = 'X-HTTP-Method-Override'

module.exports = (options={ methods : ['PUT'] }) => (req, res, next) => {
    const usableHeaders = options.methods.includes(req.method);
    const defaultOverrideHeaderKeyExist = req.headers[defaultOverrideHeaderKey] || req.headers[defaultOverrideHeaderKey.toLowerCase()];
    const userDefinedDefaultOverrideHeaderKeyExist = options.headerKey && req.headers[options.headerKey];
    const useHeaderKey = userDefinedDefaultOverrideHeaderKeyExist || defaultOverrideHeaderKeyExist;
    if(usableHeaders && useHeaderKey) req.method = useHeaderKey.toUpperCase();
    next()
}