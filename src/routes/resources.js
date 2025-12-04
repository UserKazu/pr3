'use strict';

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storePath = path.join(__dirname, '..', '..', 'data', 'resources.json');

async function ensureStore() {
  try {
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify([], null, 2), 'utf8');
  }
}

async function readAll() {
  await ensureStore();
  const raw = await fs.readFile(storePath, 'utf8');
  return JSON.parse(raw || '[]');
}

async function writeAll(arr) {
  await fs.writeFile(storePath, JSON.stringify(arr, null, 2), 'utf8');
}

module.exports = async function (fastify, opts) {
  // List all resources -> GET / (mounted later as /api/resources)
  fastify.get('/', async (request, reply) => {
    const list = await readAll();
    return reply.code(200).send(list);
  });

  // Get by id -> GET /:id
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const list = await readAll();
    const found = list.find(r => r.id === id);
    if (!found) return reply.code(404).send({ message: 'Resource not found' });
    return reply.code(200).send(found);
  });

  // Create -> POST /
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name','type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          amount: { type: 'number' },
          price: { type: 'number' }
        },
        additionalProperties: false
      }
    }
  }, async (request, reply) => {
    const { name, type, amount = 0, price = 0 } = request.body;
    const list = await readAll();
    const item = {
      id: uuidv4(),
      name,
      type,
      amount,
      price,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.push(item);
    await writeAll(list);
    return reply.code(201).send(item);
  });

  // Replace -> PUT /:id
  fastify.put('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      },
      body: {
        type: 'object',
        required: ['name','type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          amount: { type: 'number' },
          price: { type: 'number' }
        },
        additionalProperties: false
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const payload = request.body;
    const list = await readAll();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return reply.code(404).send({ message: 'Resource not found' });
    const updated = {
      ...list[idx],
      ...payload,
      updatedAt: new Date().toISOString()
    };
    list[idx] = updated;
    await writeAll(list);
    return reply.code(200).send(updated);
  });

  // Partial update -> PATCH /:id
  fastify.patch('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          price: { type: 'number' }
        },
        additionalProperties: false
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const payload = request.body;
    const list = await readAll();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return reply.code(404).send({ message: 'Resource not found' });
    const updated = {
      ...list[idx],
      ...payload,
      updatedAt: new Date().toISOString()
    };
    list[idx] = updated;
    await writeAll(list);
    return reply.code(200).send(updated);
  });

  // Delete -> DELETE /:id
  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const list = await readAll();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return reply.code(404).send({ message: 'Resource not found' });
    const removed = list.splice(idx, 1)[0];
    await writeAll(list);
    return reply.code(200).send({ message: 'Deleted', id: removed.id });
  });
};
