import request from 'supertest';
import matchers from 'jest-supertest-matchers';
import faker from 'faker';

import app from '../src';
import init from '../src/init';

const user = {
  email: faker.internet.email(),
  password: faker.internet.password(),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
};

const userUpdated = {
  email: faker.internet.email(),
  password: faker.internet.password(),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
};

const userEmpty = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
};

const task = {
  name: faker.lorem.word(),
  assignedToId: 1,
  statusId: 1,
  description: faker.lorem.words(),
  tags: '',
};

const taskEmpty = {
  name: '',
  assignedToId: 0,
  statusId: 1,
  description: '',
  tags: '',
};

const taskUpdated = {
  name: faker.lorem.word(),
  assignedToId: 1,
  statusId: 2,
  description: faker.lorem.words(),
  tags: 'a, b',
};

describe('Basic', () => {
  const server = app().listen();

  beforeAll(async () => {
    jasmine.addMatchers(matchers);
  });

  afterAll((done) => {
    server.close();
    done();
  });

  it('Homepage', async () => {
    const res = await request.agent(server).get('/');
    expect(res).toHaveHTTPStatus(200);
  });

  it('404', async () => {
    const res = await request.agent(server).get('/void');
    expect(res).toHaveHTTPStatus(404);
  });
});

describe('User session', () => {
  const server = app().listen();

  beforeAll(async () => {
    jasmine.addMatchers(matchers);
    await init();
  });

  afterAll((done) => {
    server.close();
    done();
  });

  it('Sign up', async () => {
    await request
      .agent(server)
      .get('/users/new')
      .expect(200);

    await request
      .agent(server)
      .post('/users')
      .send({ form: { ...user } })
      .expect(302);
  });

  it('Sign in', async () => {
    await request
      .agent(server)
      .get('/sessions/new')
      .expect(200);

    await request
      .agent(server)
      .post('/sessions')
      .send({ form: { ...user } })
      .expect(302);
  });

  it('Sign out', async () => {
    await request
      .agent(server)
      .post('/sessions')
      .send({ form: { ...user } })
      .expect(302);
    await request
      .agent(server)
      .delete('/sessions')
      .expect(302);
  });

  it('Sign in: error', async () => {
    await request
      .agent(server)
      .post('/sessions')
      .send({ form: { ...userUpdated } })
      .expect(422);
  });
});

describe('CRUD - Users', () => {
  const server = app().listen();

  beforeAll(async () => {
    jasmine.addMatchers(matchers);
    await init();
  });

  afterAll((done) => {
    server.close();
    done();
  });

  it('C: Create user', async () => {
    await request
      .agent(server)
      .get('/users/new')
      .expect(200);

    await request
      .agent(server)
      .post('/users')
      .send({ form: { ...user } })
      .expect(302);

    await request
      .agent(server)
      .post('/users')
      .send({ form: { ...userEmpty } })
      .expect(422);
  });

  it('R: Read user', async () => {
    await request
      .agent(server)
      .get('/users')
      .expect(200);

    await request
      .agent(server)
      .get('/users/1')
      .expect(200);

    await request
      .agent(server)
      .get('/users/1/edit')
      .expect(302);
  });

  it('U: Update user', async () => {
    await request
      .agent(server)
      .patch('/users/1')
      .send({ form: { ...userUpdated } })
      .expect(302);
  });

  it('D: Delete user', async () => {
    await request
      .agent(server)
      .delete('/users/1')
      .expect(302);

    await request
      .agent(server)
      .delete('/users/5')
      .expect(404);
  });
});

describe('CRUD - Tasks', () => {
  const server = app().listen();
  init();

  beforeAll(async () => {
    jasmine.addMatchers(matchers);
  });

  afterAll((done) => {
    server.close();
    done();
  });

  it('C: Create task', async () => {
    await request
      .agent(server)
      .post('/users')
      .send({ form: { ...user } });

    const auth = await request
      .agent(server)
      .post('/sessions')
      .send({ form: { ...user } });

    const cookies = auth.headers['set-cookie'][0]
      .split(',')
      .map(item => item.split(';')[0]);
    const cookie = cookies.join(';');

    await request
      .agent(server)
      .get('/tasks/new')
      .expect(302);

    await request
      .agent(server)
      .post('/tasks')
      .set('Cookie', cookie)
      .send({ form: { ...task } })
      .expect(302);

    await request
      .agent(server)
      .post('/tasks')
      .set('Cookie', cookie)
      .send({ form: { ...taskEmpty } })
      .expect(422);
  });

  it('R: Read task', async () => {
    await request
      .agent(server)
      .get('/tasks')
      .expect(200);

    await request
      .agent(server)
      .get('/tasks/1')
      .expect(200);

    await request
      .agent(server)
      .get('/tasks/1/edit')
      .expect(302);
  });

  it('U: Update task', async () => {
    await request
      .agent(server)
      .patch('/tasks/1')
      .send({ form: { ...taskUpdated } })
      .expect(302);
  });

  it('D: Delete task', async () => {
    await request
      .agent(server)
      .delete('/tasks/1')
      .expect(302);

    await request
      .agent(server)
      .delete('/tasks/5')
      .expect(404);
  });
});

