module.exports = (req, res, next) => {
    if(req.session?.isAuthenticated) return next();
    return res.redirect(`/buddy-oauth/sso/msal/login?redirectTo=${req.originalUrl}`)
}