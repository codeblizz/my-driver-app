const axios = require('axios');
const msal = require('@azure/msal-node');
const { env } = require('../config');
const utils = require('./powerBiUtil');

const getAccessToken = async function () {
  // Create a config variable that store credentials from config.json
  const config = {
    authenticationMode: 'ServicePrincipal',
    authorityUrl: 'https://login.microsoftonline.com/',
    scopeBase: 'https://analysis.windows.net/powerbi/api/.default',
    powerBiApiUrl: 'https://api.powerbi.com/',
    clientId: env.MSAL_ClIENT_ID,
    clientSecret: env.MSAL_CLIENT_SECRET,
    tenantId: env.MSAL_TENANT_ID
  };

  const msalConfig = {
    auth: {
      clientId: config.clientId,
      authority: `${config.authorityUrl}${config.tenantId}`
    }
  };

  // Check for the MasterUser Authentication
  if (config.authenticationMode.toLowerCase() === 'masteruser') {
    const clientApplication = new msal.PublicClientApplication(msalConfig);

    const usernamePasswordRequest = {
      scopes: [config.scopeBase],
      username: config.pbiUsername,
      password: config.pbiPassword
    };

    return clientApplication.acquireTokenByUsernamePassword(usernamePasswordRequest);
  }

  // Service Principal auth is the recommended by Microsoft to achieve App Owns Data Power BI embedding
  if (config.authenticationMode.toLowerCase() === 'serviceprincipal') {
    msalConfig.auth.clientSecret = config.clientSecret;
    const clientApplication = new msal.ConfidentialClientApplication(msalConfig);

    const clientCredentialRequest = {
      scopes: [config.scopeBase]
    };

    return clientApplication.acquireTokenByClientCredential(clientCredentialRequest);
  }
};

async function getRequestHeader() {
  // Store authentication token
  let tokenResponse;

  // Store the error thrown while getting authentication token
  let errorResponse;

  // Get the response from the authentication request
  try {
    tokenResponse = await getAccessToken();
  } catch (err) {
    if (err.hasOwnProperty('error_description') && err.hasOwnProperty('error')) {
      errorResponse = err.error_description;
    } else {
      // Invalid PowerBI Username provided
      errorResponse = err.toString();
    }
    return {
      status: 401,
      error: errorResponse
    };
  }

  // Extract AccessToken from the response
  const token = tokenResponse.accessToken;
  return {
    'Content-Type': 'application/json',
    Authorization: utils.getAuthHeader(token)
  };
}

class PowerBiReportDetails {
  constructor(reportId, reportName, embedUrl) {
    this.reportId = reportId;
    this.reportName = reportName;
    this.embedUrl = embedUrl;
  }
}

class EmbedConfig {
  constructor(type, reportsDetail, embedToken) {
    this.type = type;
    this.reportsDetail = reportsDetail;
    this.embedToken = embedToken;
  }
}

async function getEmbedTokenForSingleReportSingleWorkspace(
  reportId,
  datasetIds,
  targetWorkspaceId
) {
  // Add report id in the request
  let formData = {
    reports: [
      {
        id: reportId
      }
    ]
  };

  // Add dataset ids in the request
  formData['datasets'] = [];
  for (const datasetId of datasetIds) {
    formData['datasets'].push({
      id: datasetId
    });
  }

  // Add targetWorkspace id in the request
  if (targetWorkspaceId) {
    formData['targetWorkspaces'] = [];
    formData['targetWorkspaces'].push({
      id: targetWorkspaceId
    });
  }

  const embedTokenApi = 'https://api.powerbi.com/v1.0/myorg/GenerateToken';
  const headers = await getRequestHeader();

  const { data } = await axios.post(embedTokenApi, formData, { headers });

  return data;
}

async function getEmbedParamsForSingleReport(workspaceId, reportId, additionalDatasetId) {
  const reportInGroupApi = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`;
  const headers = await getRequestHeader();

  const { data: resultJson } = await axios.get(reportInGroupApi, { headers });

  // Add report data for embedding
  const reportDetails = new PowerBiReportDetails(
    resultJson.id,
    resultJson.name,
    resultJson.embedUrl
  );
  const reportEmbedConfig = new EmbedConfig();

  // Create mapping for report and Embed URL
  reportEmbedConfig.reportsDetail = [reportDetails];

  // Create list of datasets
  let datasetIds = [resultJson.datasetId];

  // Append additional dataset to the list to achieve dynamic binding later
  if (additionalDatasetId) {
    datasetIds.push(additionalDatasetId);
  }

  // Get Embed token multiple resources
  reportEmbedConfig.embedToken = await getEmbedTokenForSingleReportSingleWorkspace(
    reportId,
    datasetIds,
    workspaceId
  );
  return reportEmbedConfig;
}

module.exports = { getEmbedParamsForSingleReport };
