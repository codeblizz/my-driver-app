module.exports = {
  smsPayload: (mobileNumber, message) => ({
    mobileNumbers: {
      messageParams: [{ mobileNumber, params: { message } }]
    },
    msgType: '1',
    priority: '0'
  }),
  whatsappTemplate: (mobileNumber, message) => ({
    type: 'whatsapp',
    priority: 1,
    source: 'carstaxi',
    provider: 'whatsapp_facebook',
    message: {
      to: mobileNumber,
      type: 'template',
      body: {
        name: 'driver_general',
        language: {
          code: 'en_US'
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'TEXT',
                text: message
              }
            ]
          }
        ]
      }
    }
  }),
  emailTemplate: (sender, to, subject, body) => ({
    type: 'email',
    priority: 1,
    source: 'carstaxi',
    provider: 'sendgrid',
    message: {
      sender,
      recipient: to,
      subject,
      body
    }
  }),
  /**
   * 
   * @param {string[]} mobileNumbers - List of Mibile numbers
   * @param {string} message - The message we have to send
   * @returns 
   */
  smsTemplate: (mobileNumbers, message) => [
    {
      type: 'sms',
      priority: 1,
      source: 'carstaxi',
      provider: 'synapse',
      message: {
        text: message,
        mobileNumbers: {
          messageParams: mobileNumbers.map(mobileNumber => ({mobileNumber}))
        }
      }
    }
  ]
};
