const guid = require("guid");
const { env } = require('../config')

function getAuthHeader(accessToken) {

    // Function to append Bearer against the Access Token
    return "Bearer ".concat(accessToken);
}

function validateConfig() {

    if (!env.authenticationMode) {
        return "AuthenticationMode is empty. Please choose MasterUser or ServicePrincipal in env.";
    }

    if (env.authenticationMode.toLowerCase() !== "masteruser" && env.authenticationMode.toLowerCase() !== "serviceprincipal") {
        return "AuthenticationMode is wrong. Please choose MasterUser or ServicePrincipal in env";
    }

    if (!env.clientId) {
        return "ClientId is empty. Please register your application as Native app in https://dev.powerbi.com/apps and fill Client Id in env.";
    }

    if (!guid.isGuid(env.clientId)) {
        return "ClientId must be a Guid object. Please register your application as Native app in https://dev.powerbi.com/apps and fill Client Id in env.";
    }

    if (!env.reportId) {
        return "ReportId is empty. Please select a report you own and fill its Id in env.";
    }

    if (!guid.isGuid(env.reportId)) {
        return "ReportId must be a Guid object. Please select a report you own and fill its Id in env.";
    }

    if (!env.workspaceId) {
        return "WorkspaceId is empty. Please select a group you own and fill its Id in env.";
    }

    if (!guid.isGuid(env.workspaceId)) {
        return "WorkspaceId must be a Guid object. Please select a workspace you own and fill its Id in env.";
    }

    if (!env.authorityUrl) {
        return "AuthorityUrl is empty. Please fill valid AuthorityUrl in env.";
    }

    if (env.authenticationMode.toLowerCase() === "masteruser") {
        if (!env.pbiUsername || !env.pbiUsername.trim()) {
            return "PbiUsername is empty. Please fill Power BI username in env.";
        }

        if (!env.pbiPassword || !env.pbiPassword.trim()) {
            return "PbiPassword is empty. Please fill password of Power BI username in env.";
        }
    } else if (env.authenticationMode.toLowerCase() === "serviceprincipal") {
        if (!env.clientSecret || !env.clientSecret.trim()) {
            return "ClientSecret is empty. Please fill Power BI ServicePrincipal ClientSecret in env.";
        }

        if (!env.tenantId) {
            return "TenantId is empty. Please fill the TenantId in env.";
        }

        if (!guid.isGuid(env.tenantId)) {
            return "TenantId must be a Guid object. Please select a workspace you own and fill its Id in env.";
        }
    }
}

module.exports = {
    getAuthHeader: getAuthHeader,
    validateConfig: validateConfig,
}