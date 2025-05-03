// api/index.js (now as ES module)

import handler from '../server/index'; // Use ES module import

export default async (req, res) => {
  if (typeof handler === 'function') {
    return handler(req, res);
  }

  if (handler && typeof handler.handler === 'function') {
    return handler.handler(req, res);
  }

  res.statusCode = 500;
  res.end('Invalid server export. Expected a function.');
};
