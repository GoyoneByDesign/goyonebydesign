importScripts('vendor/math/math.js','max-math-core.js');
const calculate=MAX_MATH_CORE(math.create(math.all));
onmessage=({data})=>{try{postMessage({result:calculate(data.expression,data.operation)});}catch(e){postMessage({error:e.message});}};
