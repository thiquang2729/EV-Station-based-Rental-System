const app = require('./ev-rental/services/rental-svc/src/app');
function listRoutes(layer, prefix=''){
  if (!layer) return;
  if (layer.route && layer.route.path){
    const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
    console.log(`${methods} ${prefix}${layer.route.path}`);
  } else if (layer.name === 'router' && layer.handle.stack){
    const newPrefix = prefix + (layer.regexp && layer.regexp.fast_slash ? '' : (layer.regexp && layer.regexp.toString().includes('^\\/api\\/v1\\/bookings\\/?$') ? '/api/v1/bookings' : layer.regexp.toString()));
    layer.handle.stack.forEach(l => listRoutes(l, prefix));
  }
}
app._router.stack.forEach(layer => {
  if(layer.name === 'router' && layer.regexp){
    // extract mount path from regexp (best-effort)
    const m = layer.regexp.toString();
    let mount = '';
    if (m.includes('api\\/v1\\/bookings')) mount = '/api/v1/bookings';
    else if (m.includes('api\\/v1\\/stations')) mount = '/api/v1/stations';
    else if (m.includes('api\\/v1\\/vehicles')) mount = '/api/v1/vehicles';
    layer.handle.stack.forEach(l => {
      if (l.route && l.route.path){
        const methods = Object.keys(l.route.methods).join(',').toUpperCase();
        console.log(`${methods} ${mount}${l.route.path}`)
      }
    })
  } else if (layer.route){
    const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
    console.log(`${methods} ${layer.route.path}`)
  }
});
