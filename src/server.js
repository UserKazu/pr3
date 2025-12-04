'use strict';

const Fastify = require('fastify');
const path = require('path');

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  }
});

fastify.register(require('@fastify/cors'), { origin: true });
fastify.register(require('./routes/resources'), { prefix: '/resources' });

const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port: +port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();