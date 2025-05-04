const devFunctionApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7071/api';

module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${devFunctionApi}/:path*`
      }
    ];
  }
}; 