import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { io } from "socket.io-client";
import { unlink, rmdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

for (const line of (await readFile(new URL("../.env", import.meta.url), "utf8")).split(/\r?\n/)) {
  const match = line.match(/^\s*([^#=]+)=(.*)$/);
  if (match && !process.env[match[1].trim()]) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
}
const base = "http://127.0.0.1:4000";
const prisma = new PrismaClient();
const suffix = Date.now().toString(36);
const userIds = [];
const conversationIds = [];
const sockets = [];
const imagePaths = [];
const storageRoot = path.resolve(fileURLToPath(new URL("../storage-data/", import.meta.url)));
const password = `Test-${suffix}-password`;
const recoveryEmail = `recovery-${suffix}@example.test`;

if (process.argv.includes("--cleanup-abandoned")) {
  const candidates = await prisma.user.findMany({ where: {
    username: { startsWith: "author_" }, email: { endsWith: "@example.test" },
    profile: { fullName: "Kiểm thử author" }, createdAt: { gte: new Date("2026-10-06T09:00:00Z") },
    posts: { none: {} }, comments: { none: {} }, messages: { none: {} },
    requestedConnections: { none: {} }, addressedConnections: { none: {} }
  }, select: { id: true, username: true, email: true } });
  const fixtures = candidates.filter(u => /^author_[a-z0-9]+$/.test(u.username ?? "") && u.email === `author-${u.username.slice(7)}@example.test`);
  for (const fixture of fixtures) await prisma.user.delete({ where: { id: fixture.id } });
  await prisma.$disconnect();
  console.log(`Removed ${fixtures.length} abandoned test fixture(s)`);
  process.exit(0);
}

async function request(path, token, body, method = body ? "POST" : "GET") {
  const res = await fetch(`${base}/api/v1${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json();
  return { status: res.status, data };
}
async function ok(path, token, body, method) {
  const res = await request(path, token, body, method);
  assert.ok(res.status < 300, `${path}: ${res.status} ${JSON.stringify(res.data)}`);
  return res.data;
}
async function register(name) {
  const email = `${name}-${suffix}@example.test`;
  const username = `${name}_${suffix}`;
  const tokens = await ok("/auth/register", null, { email, username, password, phone: "0901234567", fullName: `Kiểm thử ${name}` });
  const { user } = await ok("/auth/me", tokens.accessToken);
  userIds.push(user.id);
  const stored = await prisma.user.findUnique({ where: { id: user.id } });
  assert.equal(stored.username, username);
  assert.equal(stored.phone, "0901234567");
  return { id: user.id, token: tokens.accessToken };
}
async function connectSocket(token) {
  const socket = io(`${base}/messages`, { auth: { token }, transports: ["websocket"], reconnection: false });
  sockets.push(socket);
  await new Promise((resolve, reject) => { socket.once("connect", resolve); socket.once("connect_error", reject); setTimeout(() => reject(new Error("Socket connect timeout")), 5000).unref(); });
  return socket;
}
async function join(socket, conversationId) {
  return new Promise((resolve, reject) => socket.timeout(5000).emit("join_conversation", { conversationId }, (error, result) => error ? reject(error) : resolve(result)));
}

try {
  const author = await register("author");
  const friend = await register("friend");
  const outsider = await register("outsider");
  const admin = await prisma.user.create({ data: { email: `admin-${suffix}@example.test`, passwordHash: await bcrypt.hash(password, 10), role: "ADMIN", profile: { create: { fullName: "Kiểm thử quản trị" } } } });
  userIds.push(admin.id);
  const adminToken = (await ok("/auth/login", null, { email: admin.email, password })).accessToken;
  assert.equal((await request("/auth/register", null, { email: `invalid-${suffix}@example.test`, username: `invalid_${suffix}`, password, phone: "0901234567", fullName: "Invalid", role: "ADMIN" })).status, 400);
  await prisma.connection.create({ data: { requesterId: author.id, addresseeId: friend.id, status: "ACCEPTED" } });
  const posts = {};
  for (const visibility of ["PUBLIC", "CONNECTIONS", "PRIVATE"]) posts[visibility] = await ok("/social/posts", author.token, { content: `Test ${suffix} ${visibility}`, visibility });
  async function visible(token) { return (await ok(`/feed?authorId=${author.id}`, token)).map(p => p.id); }
  assert.deepEqual(new Set(await visible(author.token)), new Set(Object.values(posts).map(p => p.id)));
  assert.deepEqual(new Set(await visible(friend.token)), new Set([posts.PUBLIC.id, posts.CONNECTIONS.id]));
  assert.deepEqual(await visible(outsider.token), [posts.PUBLIC.id]);
  assert.deepEqual(await visible(null), [posts.PUBLIC.id]);
  const forged = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: author.id, email: "forged@example.test", role: "ADMIN" })).toString("base64url")}.invalid`;
  assert.deepEqual(await visible(forged), [posts.PUBLIC.id]);
  assert.equal((await request("/moderation/reports", forged)).status, 401);
  assert.equal((await request(`/social/posts/${posts.PRIVATE.id}/comments`, outsider.token, { content: "Forbidden" })).status, 404);
  assert.equal((await request(`/social/posts/${posts.PRIVATE.id}/reactions`, friend.token, { reactionType: "LIKE" })).status, 404);
  console.log("PASS: registration, public/friends/private access and forged-token rejection");

  const comment = await ok(`/social/posts/${posts.PUBLIC.id}/comments`, friend.token, { content: "Bình luận gốc" });
  const reply = await ok(`/social/posts/${posts.PUBLIC.id}/comments`, author.token, { content: "Trả lời", parentId: comment.id });
  assert.equal(reply.parentId, comment.id);
  assert.equal((await ok(`/social/comments/${comment.id}/reactions`, author.token, { reactionType: "LOVE" })).userReaction, "LOVE");
  assert.equal((await ok(`/social/posts/${posts.PUBLIC.id}/reactions`, author.token, { reactionType: "WOW" })).userReaction, "WOW");
  let feed = await ok(`/feed?authorId=${author.id}`, author.token);
  let publicPost = feed.find(p => p.id === posts.PUBLIC.id);
  assert.equal(publicPost.userReaction, "WOW");
  assert.equal(publicPost.comments.find(c => c.id === comment.id).userReaction, "LOVE");
  assert.ok(!("passwordHash" in publicPost.author));
  const otherComment = await ok(`/social/posts/${posts.PRIVATE.id}/comments`, author.token, { content: "Riêng tư" });
  assert.equal((await request(`/social/posts/${posts.PUBLIC.id}/comments`, friend.token, { content: "Cross post", parentId: otherComment.id })).status, 400);
  assert.equal((await ok(`/social/users/${author.id}/follow`, outsider.token, {})).following, true);
  assert.equal((await ok(`/social/users/${author.id}/follow`, outsider.token)).following, true);
  assert.equal((await ok(`/social/users/${author.id}/follow`, outsider.token, undefined, "DELETE")).following, false);
  console.log("PASS: threaded comments, persisted reactions and follow/unfollow");

  const conversation = await prisma.conversation.create({ data: { participants: { create: [{ userId: author.id }, { userId: friend.id }] } } });
  conversationIds.push(conversation.id);
  await prisma.message.createMany({ data: Array.from({ length: 105 }, (_, i) => ({ conversationId: conversation.id, senderId: author.id, content: `Cũ ${i}`, sentAt: new Date(Date.now() - 1000000 + i * 1000) })) });
  const latest = await ok(`/messages/conversations/${conversation.id}`, friend.token);
  assert.equal(latest.length, 100); assert.equal(latest[0].content, "Cũ 5");
  const older = await ok(`/messages/conversations/${conversation.id}?before=${latest[0].id}`, friend.token);
  assert.equal(older.length, 5); assert.equal(older[0].content, "Cũ 0");
  const receiver = await connectSocket(friend.token);
  assert.equal((await join(receiver, conversation.id)).ok, true);
  const unauthorized = await connectSocket(outsider.token);
  assert.equal((await join(unauthorized, conversation.id)).ok, false);
  const realtime = new Promise((resolve, reject) => { receiver.once("new_message", resolve); setTimeout(() => reject(new Error("Message not delivered in real time")), 5000).unref(); });
  const message = await ok("/messages", author.token, { conversationId: conversation.id, content: "Tìm việc realtime" });
  assert.equal((await realtime).messageId, message.id);
  const matches = await ok(`/messages/conversations/${conversation.id}?q=${encodeURIComponent("tìm việc")}`, friend.token);
  assert.deepEqual(matches.map(m => m.id), [message.id]);
  assert.equal((await request(`/messages/conversations/${conversation.id}`, outsider.token)).status, 403);
  assert.equal((await request("/moderation/reports", outsider.token, { contentType: "MESSAGE", targetId: message.id, reason: "Forbidden" })).status, 404);
  console.log("PASS: recent messages, older history, search, real-time delivery and room access");

  const report = await ok("/moderation/reports", friend.token, { contentType: "MESSAGE", targetId: message.id, reason: "Kiểm thử báo cáo" });
  const reportedPost = await ok("/moderation/reports", friend.token, { contentType: "POST", targetId: posts.PUBLIC.id, reason: "Kiểm thử báo cáo" });
  assert.equal((await request("/moderation/reports", friend.token)).status, 403);
  const reports = await ok("/moderation/reports", adminToken);
  assert.equal(reports.find(r => r.id === report.id).target.content, message.content);
  await ok(`/moderation/reports/${reportedPost.id}`, adminToken, { action: "KEEP" }, "PATCH");
  assert.ok((await visible(friend.token)).includes(posts.PUBLIC.id));
  await ok(`/moderation/reports/${reportedPost.id}`, adminToken, { action: "DELETE" }, "PATCH");
  assert.ok(!(await visible(friend.token)).includes(posts.PUBLIC.id));
  await ok("/auth/forgot-password", null, { email: recoveryEmail, phone: "0901234567" });
  const requests = await ok("/moderation/recovery-requests", adminToken);
  const recovery = requests.find(r => r.email === recoveryEmail);
  assert.ok(recovery); assert.equal(recovery.phone, "0901234567");
  await ok(`/moderation/recovery-requests/${recovery.id}`, adminToken, undefined, "PATCH");
  assert.equal((await prisma.passwordRecoveryRequest.findUnique({ where: { id: recovery.id } })).status, "RESOLVED");
  console.log("PASS: admin review/keep/hide and recovery request queue");

  for (const kind of ["avatar", "cover"]) {
    const form = new FormData();
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=", "base64");
    form.append("file", new Blob([png], { type: "image/png" }), `test-${suffix}`);
    const res = await fetch(`${base}/api/v1/users/me/${kind}`, { method: "POST", headers: { Authorization: `Bearer ${author.token}` }, body: form });
    assert.ok(res.ok, `${kind} upload failed ${res.status}`);
    const payload = await res.json();
    const imageUrl = new URL(payload[`${kind}Url`]);
    if (["localhost", "127.0.0.1"].includes(imageUrl.hostname) && imageUrl.pathname.startsWith("/api/v1/files/")) {
      const imagePath = path.resolve(storageRoot, imageUrl.pathname.slice("/api/v1/files/".length));
      if (imagePath.startsWith(storageRoot + path.sep)) imagePaths.push(imagePath);
    }
    const imageRes = await fetch(payload[`${kind}Url`]);
    assert.ok(imageRes.ok, `${kind} URL failed`); assert.equal(imageRes.headers.get("content-type").split(";")[0], "image/png");
  }
  const profile = await ok(`/public/users/${author.id}`);
  assert.equal(profile.userId, author.id); assert.ok(profile.avatarUrl && profile.coverUrl);
  console.log("PASS: avatar/cover upload, readable image URLs and public profile");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  sockets.forEach(s => s.disconnect());
  for (const imagePath of imagePaths) { await unlink(imagePath).catch(() => {}); await rmdir(path.dirname(imagePath)).catch(() => {}); }
  await prisma.passwordRecoveryRequest.deleteMany({ where: { email: recoveryEmail } });
  await prisma.moderationReport.deleteMany({ where: { reporterId: { in: userIds.filter(Boolean) } } });
  await prisma.conversation.deleteMany({ where: { id: { in: conversationIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
}
