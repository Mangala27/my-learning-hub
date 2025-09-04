// Serverless function that returns JS for the browser
exports.handler = async () => {
    return {
        statusCode: 200,
        headers: { "Content-Type": "application/javascript" },
        body: `window.ENV = {
      API_URL: "${process.env.API_URL || ""}"
    };`,
    };
};
