import assert from 'node:assert';
import test from 'node:test';

test('dummy backend test - environment loads', async () => {
  assert.ok(process.env);
});
