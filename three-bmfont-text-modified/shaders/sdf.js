var assign = require('object-assign')

module.exports = function createSDFShader (opt) {
  opt = opt || {}
  var opacity = typeof opt.opacity === 'number' ? opt.opacity : 1
  var alphaTest = typeof opt.alphaTest === 'number' ? opt.alphaTest : 0.0001
  var precision = opt.precision || 'highp'
  var color = opt.color
  var map = opt.map

  // remove to satisfy r73
  delete opt.map
  delete opt.color
  delete opt.precision
  delete opt.opacity

  return assign({
    uniforms: {
      opacity: { type: 'f', value: opacity },
      map: { type: 't', value: map || new THREE.Texture() },
      color: { type: 'c', value: new THREE.Color(color) }
    },
    vertexShader: [
      'attribute vec2 uv;',
      'attribute vec4 position;',
      'uniform mat4 projectionMatrix;',
      'uniform mat4 modelViewMatrix;',
      'varying vec2 vUv;',
      'varying float alpha;',
      'void main() {',
      'vUv = uv;',
      'alpha = position.a;',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1);',
      '}'
    ].join('\n'),
    fragmentShader: [
      '#ifdef GL_OES_standard_derivatives',
      '#extension GL_OES_standard_derivatives : enable',
      '#endif',
      'precision ' + precision + ' float;',
      'uniform float opacity;',
      'uniform vec3 color;',
      'uniform sampler2D map;',
      'varying float alpha;',
      'varying vec2 vUv;',

      'float aastep(float value) {',
      '  #ifdef GL_OES_standard_derivatives',
      '    float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;',
      '  #else',
      '    float afwidth = (1.0 / 32.0) * (1.4142135623730951 / (2.0 * gl_FragCoord.w));',
      '  #endif',
      '  return smoothstep(0.5 - afwidth, 0.5 + afwidth, value);',
      '}',

      'void main() {',
      '  vec4 texColor = texture2D(map, vUv, -100.0);',
      '  float valpha = 0.25*aastep(texColor.a*alpha);',

      '  texColor = texture2D(map, vUv+0.5*vec2(dFdx(vUv.x), dFdy(vUv.y)), -100.0);',
      '  valpha += 0.25*aastep(texColor.a*alpha);',
      '  texColor = texture2D(map, vUv+0.5*vec2(dFdx(vUv.x), 0.0), -100.0);',
      '  valpha += 0.25*aastep(texColor.a*alpha);',
      '  texColor = texture2D(map, vUv+0.5*vec2(0.0, dFdy(vUv.y)), -100.0);',
      '  valpha += 0.25*aastep(texColor.a*alpha);',

      '  gl_FragColor = vec4(color, opacity * valpha);',
      alphaTest === 0
        ? ''
        : '  if (gl_FragColor.a < ' + alphaTest + ') discard;',
      '}'
    ].join('\n')
  }, opt)
}
