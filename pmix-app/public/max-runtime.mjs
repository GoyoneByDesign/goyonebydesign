// Browser capability detection is not proof that a usable GPU exists.
export async function loadLocalGenerator(pipeline, navigator, progress) {
  const load = device => pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {
    dtype: 'q4', device, progress_callback: progress
  });
  let adapter = null;
  try { adapter = await navigator?.gpu?.requestAdapter(); } catch {}
  if (adapter) {
    try { return await load('webgpu'); }
    catch { progress({status: 'fallback'}); }
  }
  return load('wasm');
}
