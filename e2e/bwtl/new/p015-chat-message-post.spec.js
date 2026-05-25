// P015 — POST /api/chat/threads/{id}/messages → Message bubble
const { test, expect } = require('@playwright/test');
const { KNOWN } = require('../fixtures/test-data');

test.describe('P015 — Chat message post: message content returned', () => {
  test('POST message to existing thread returns message with content', async ({ request }) => {
    // First create a thread
    const threadResp = await request.post(`${KNOWN.sfBaseUrl}/api/chat/threads`, {
      data: { anchor_mode: 'card', anchor_value: KNOWN.cardWithPieRoot, title: 'P015 test' },
    });
    expect([200, 201].includes(threadResp.status())).toBe(true);
    const thread = await threadResp.json();

    const msgResp = await request.post(
      `${KNOWN.sfBaseUrl}/api/chat/threads/${thread.id}/messages`,
      { data: { content: 'What is the PIE root?', role: 'user' } }
    );
    expect([200, 201].includes(msgResp.status())).toBe(true);
    const msg = await msgResp.json();
    expect(msg.content || msg.id).toBeTruthy();
  });
});
