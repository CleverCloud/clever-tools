'use strict';

const expect = require('chai').expect;

const notifications = require('../src/commands/notify-email.js');

describe('notifications.getEmailNotificationTargets', function () {

  it('handle default case', function () {
    const input = null;
    const output = notifications.getEmailNotificationTargets(input);
    const expected = [];
    expect(output).to.deep.equal(expected);
  });

  it('handle single user id', function () {
    const input = ['user_20ebac08-8531-4296-98c9-8dbc7abcd3f4'];
    const output = notifications.getEmailNotificationTargets(input);
    const expected = [{ type: 'userid', target: 'user_20ebac08-8531-4296-98c9-8dbc7abcd3f4' }];
    expect(output).to.deep.equal(expected);
  });

  it('handle single email address', function () {
    const input = ['test@example.org'];
    const output = notifications.getEmailNotificationTargets(input);
    const expected = [{ type: 'email', target: 'test@example.org' }];
    expect(output).to.deep.equal(expected);
  });

  it('handle single organisation token', function () {
    const input = ['organisation'];
    const output = notifications.getEmailNotificationTargets(input);
    const expected = [{ type: 'organisation' }];
    expect(output).to.deep.equal(expected);
  });

  it('handle mixed targets', function () {
    const input = ['organisation', 'test@example.org', 'user_20ebac08-8531-4296-98c9-8dbc7abcd3f4'];
    const output = notifications.getEmailNotificationTargets(input);
    const expected = [
      { type: 'organisation' },
      { type: 'email', target: 'test@example.org' },
      { type: 'userid', target: 'user_20ebac08-8531-4296-98c9-8dbc7abcd3f4' },
    ];
    expect(output).to.deep.equal(expected);
  });
});
