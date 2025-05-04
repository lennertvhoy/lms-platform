module.exports = async function (context, req) {
  context.log('HTTP trigger function processed a request.');
  context.res = {
    status: 200,
    body: 'Hello from Azure Functions!'
  };
}; 