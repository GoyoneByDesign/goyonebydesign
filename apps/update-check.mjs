/** Integration foundation only. No shipped app imports this module yet.
 * Hosts pin a release public key and persist an explicit user opt-in.
 * This module checks metadata; it never installs, executes, or sends messages.
 */
const MAX_METADATA = 64000;
const encoder = new TextEncoder();
const fail = message => { throw new Error(message); };
function httpsURL(value, origins) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search
      || !origins.includes(url.origin)) fail('Untrusted release location.');
  return url.href;
}
function decode(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) fail('Invalid release signature.');
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
async function boundedText(response, signal) {
  if (!response.ok || response.redirected) fail('Release check unavailable.');
  if (!response.body?.getReader) fail('Bounded release reading unavailable.');
  const reader = response.body.getReader();
  let count = 0;
  const chunks = [];
  try {
    for (;;) {
      if (signal.aborted) fail('Release check cancelled.');
      const {done, value} = await reader.read();
      if (done) break;
      count += value.byteLength;
      if (count > MAX_METADATA) fail('Release information too large.');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(count);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder('utf-8', {fatal:true}).decode(bytes);
}

export async function verifyRelease(envelope, {publicKey, identity, origins, now=Date.now(), crypto=globalThis.crypto}) {
  if (!identity || !/^[a-z][a-z0-9-]{0,63}$/.test(identity.app || '')
      || !['android','ios','windows','macos','web','server'].includes(identity.platform)
      || !/^[a-z][a-z0-9-]{0,31}$/.test(identity.channel || '')
      || typeof identity.signingIdentity !== 'string' || !identity.signingIdentity.trim()) fail('Installed app identity is not configured.');
  if (!publicKey || publicKey.kty !== 'EC' || publicKey.crv !== 'P-256' || publicKey.d
      || !crypto?.subtle) fail('Release trust is not configured.');
  if (!envelope || envelope.schema !== 1 || typeof envelope.payload !== 'string'
      || encoder.encode(envelope.payload).byteLength > 32000) fail('Invalid release envelope.');
  const key = await crypto.subtle.importKey('jwk', publicKey, {name:'ECDSA', namedCurve:'P-256'}, false, ['verify']);
  const signature = decode(envelope.signature);
  if (signature.length !== 64 || !await crypto.subtle.verify({name:'ECDSA', hash:'SHA-256'}, key, signature, encoder.encode(envelope.payload)))
    fail('Release authenticity check failed.');
  const value = JSON.parse(envelope.payload);
  if (value.schema !== 1 || value.app !== identity.app || value.platform !== identity.platform
      || value.channel !== identity.channel || value.signingIdentity !== identity.signingIdentity)
    fail('This release does not match the installed app.');
  if (!Number.isSafeInteger(value.build) || value.build < 1 || typeof value.version !== 'string'
      || !/^[0-9][A-Za-z0-9.+-]{0,63}$/.test(value.version)) fail('Invalid release version.');
  if (!Number.isSafeInteger(value.issuedAt) || !Number.isSafeInteger(value.expiresAt)
      || value.issuedAt > now + 300000 || value.expiresAt <= now || value.expiresAt <= value.issuedAt
      || value.expiresAt - value.issuedAt > 31 * 86400000) fail('Release information expired or clock is incorrect.');
  if (typeof value.notes !== 'string' || value.notes.length > 8000 || !value.notes.trim()) fail('Release notes required.');
  if (!Number.isSafeInteger(value.bytes) || value.bytes < 1 || value.bytes > 200000000
      || !/^[a-f0-9]{64}$/.test(value.sha256 || '')) fail('Invalid package integrity metadata.');
  const url = httpsURL(value.url, origins);
  // Authentic signed metadata is not evidence of OS signing compatibility.
  // The native installer must still verify its package identity/certificate.
  return Object.freeze({version:value.version, build:value.build, notes:value.notes,
    url, bytes:value.bytes, sha256:value.sha256, signingIdentity:value.signingIdentity});
}

export function createUpdateChecker({endpoint, publicKey, identity, origins=[], online=()=>true,
  busy=()=>false, fetcher=globalThis.fetch?.bind(globalThis), now=Date.now, timeoutMs=12000}={}) {
  let enabled = false, generation = 0, pending, controller;
  const result = phase => ({phase});
  function setEnabled(value) {
    enabled = value === true;
    generation++;
    controller?.abort();
  }
  async function check() {
    if (!enabled) return result('disabled');
    if (!online()) return result('offline');
    if (busy()) return result('deferred');
    if (!endpoint || !publicKey || !identity?.signingIdentity || !Number.isSafeInteger(identity?.build)
        || identity.build < 1 || !origins.length) return result('unconfigured');
    if (pending) return pending;
    const revision = generation;
    controller = new AbortController();
    const signal = controller.signal;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    pending = Promise.resolve().then(async () => {
      try {
        const url = httpsURL(endpoint, origins);
        const response = await fetcher(url, {cache:'no-store', credentials:'omit', redirect:'error',
          referrerPolicy:'no-referrer', signal});
        const envelope = JSON.parse(await boundedText(response, signal));
        const release = await verifyRelease(envelope, {publicKey, identity, origins, now:now()});
        if (generation !== revision || signal.aborted || !enabled) return result('cancelled');
        if (!online()) return result('offline');
        if (busy()) return result('deferred');
        if (release.build < identity.build) return result('rollback-rejected');
        if (release.build === identity.build) return result('current');
        return {phase:'available', release};
      } catch { return result(generation !== revision || !enabled ? 'cancelled' : 'error'); }
      finally { clearTimeout(timer); pending = null; controller = null; }
    });
    return pending;
  }
  return {setEnabled, check};
}

/** Only call on bounded, explicitly downloaded package bytes. No execution. */
export async function verifyPackageBytes(bytes, release, crypto=globalThis.crypto) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength !== release.bytes
      || bytes.byteLength > 200000000 || !/^[a-f0-9]{64}$/.test(release.sha256 || '')) return false;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('') === release.sha256;
}

export function wifiCommunicationStatus({online=false}={}) {
  return {phase:online ? 'unconfigured' : 'offline', canSend:false, canCall:false,
    message:online ? 'Internet SMS and phone calls need an approved provider and verified delivery service. Phone and message drafts use your device and carrier settings.'
      : 'You are offline. Check-ins and saved contacts remain available. No message or call was sent.'};
}
