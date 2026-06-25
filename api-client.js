(function(){
  function apiBases(){
    const bases = [''];
    if(location.hostname && location.port !== '5000' && location.protocol === 'http:'){
      bases.push(`${location.protocol}//${location.hostname}:5000`);
    }
    return [...new Set(bases)];
  }

  window.buttonApiFetch = async function buttonApiFetch(path, options){
    let lastError = null;
    for(const base of apiBases()){
      try{
        const res = await fetch(base + path, Object.assign({cache:'no-store'}, options || {}));
        const contentType = res.headers.get('content-type') || '';
        if(res.ok && (!path.startsWith('/api/') || contentType.includes('application/json'))){
          return res;
        }
        if(res.ok){
          lastError = new Error(`${path} returned non-JSON response`);
          continue;
        }
        if(![404, 502, 503, 504].includes(res.status)){
          return res;
        }
        lastError = new Error(`${path} returned ${res.status}`);
      }catch(error){
        lastError = error;
      }
    }
    throw lastError || new Error(`${path} unavailable`);
  };
})();
