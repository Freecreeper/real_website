(function(){
  function apiBases(){
    const bases = [''];
    if(location.hostname && location.port !== '5000'){
      bases.push(`${location.protocol}//${location.hostname}:5000`);
    }
    return [...new Set(bases)];
  }

  window.buttonApiFetch = async function buttonApiFetch(path, options){
    let lastError = null;
    for(const base of apiBases()){
      try{
        const res = await fetch(base + path, Object.assign({cache:'no-store'}, options || {}));
        if(res.ok || ![404, 502, 503, 504].includes(res.status)){
          return res;
        }
        lastError = new Error(`${path} returned 404`);
      }catch(error){
        lastError = error;
      }
    }
    throw lastError || new Error(`${path} unavailable`);
  };
})();
