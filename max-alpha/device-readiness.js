/** Read-only feature detection. No permissions, network, storage or model loads. */
export function deviceReadiness({environment=globalThis,companion=false}={}) {
  const secure=environment.isSecureContext===true;
  const row=(name,available,detail)=>({name,status:available?'Browser support detected':'Setup needed',detail});
  return [
    row('Local AI',secure&&Boolean(environment.navigator?.gpu),
      'Requires HTTPS or localhost, WebGPU, a compatible GPU and a downloaded model. Model execution has not been tested by this check.'),
    row('Voice input',secure&&Boolean(environment.SpeechRecognition||environment.webkitSpeechRecognition),
      'Requires microphone permission and browser speech recognition. Recognition may use an online browser service.'),
    row('Spoken replies',Boolean(environment.speechSynthesis),
      'Available voices depend on your browser and device. Some voices need an internet connection.'),
    row('Selected files',typeof environment.File==='function'&&typeof environment.Blob?.prototype?.arrayBuffer==='function',
      'Only files you choose can be attached. PDF, Office and image extraction requires the installed Mac companion.'),
    {name:'Local extensions',status:companion?'Companion mode detected':'Mac companion required',
      detail:'Exact math, document extraction, searchable knowledge and local code checks require the installed companion. Open its tool list below to verify installed tools.'},
    {name:'Cloud AI and account connectors',status:'Separate setup required',
      detail:'Browser feature support does not verify AI service access or connect accounts. Provider keys belong in a protected backend; review the existing connection and connector status.'}
  ];
}
