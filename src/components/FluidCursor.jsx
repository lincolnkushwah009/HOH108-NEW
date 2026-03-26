/**
 * WebGL Fluid Cursor Effect
 * Pulled from GIK-website — full fluid simulation with curl, vorticity, pressure solver
 */
import { useEffect, useRef } from 'react'

export default function FluidCursor() {
  const canvasRef = useRef(null)

  // Disable on mobile/tablet — save performance, touch doesn't benefit
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  useEffect(() => {
    if (isMobile) return
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    const config = {
      TEXTURE_DOWNSAMPLE: 1,
      DENSITY_DISSIPATION: 0.89,
      VELOCITY_DISSIPATION: 0.99,
      PRESSURE_DISSIPATION: 0,
      PRESSURE_ITERATIONS: 25,
      CURL: 2,
      SPLAT_RADIUS: 0.001,
      SPLAT_FORCE: 10,
      TRANSPARENT: true,
    }

    const pointers = []
    const splatStack = []

    function createPointer() {
      return { id: -1, x: 0, y: 0, dx: 0, dy: 0, down: false, moved: false, color: [30, 0, 300] }
    }
    pointers.push(createPointer())

    const params = { alpha: true, depth: false, stencil: false, antialias: true }
    let gl = canvas.getContext('webgl2', params)
    const isWebGL2 = !!gl
    if (!isWebGL2) {
      gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params)
    }
    if (!gl) return

    const glCtx = gl

    let halfFloat = null
    let supportLinearFiltering = null
    if (isWebGL2) {
      glCtx.getExtension('EXT_color_buffer_float')
      supportLinearFiltering = glCtx.getExtension('OES_texture_float_linear')
    } else {
      halfFloat = glCtx.getExtension('OES_texture_half_float')
      supportLinearFiltering = glCtx.getExtension('OES_texture_half_float_linear')
    }

    glCtx.clearColor(0.0, 0.0, 0.0, 0.0)

    const halfFloatTexType = isWebGL2 ? glCtx.HALF_FLOAT : halfFloat?.HALF_FLOAT_OES
    if (!halfFloatTexType) return

    function supportRenderTextureFormat(internalFormat, format, type) {
      const texture = glCtx.createTexture()
      glCtx.bindTexture(glCtx.TEXTURE_2D, texture)
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.NEAREST)
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.NEAREST)
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_S, glCtx.CLAMP_TO_EDGE)
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_T, glCtx.CLAMP_TO_EDGE)
      glCtx.texImage2D(glCtx.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null)
      const fbo = glCtx.createFramebuffer()
      glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, fbo)
      glCtx.framebufferTexture2D(glCtx.FRAMEBUFFER, glCtx.COLOR_ATTACHMENT0, glCtx.TEXTURE_2D, texture, 0)
      return glCtx.checkFramebufferStatus(glCtx.FRAMEBUFFER) === glCtx.FRAMEBUFFER_COMPLETE
    }

    function getSupportedFormat(internalFormat, format, type) {
      if (!supportRenderTextureFormat(internalFormat, format, type)) {
        switch (internalFormat) {
          case glCtx.R16F: return getSupportedFormat(glCtx.RG16F, glCtx.RG, type)
          case glCtx.RG16F: return getSupportedFormat(glCtx.RGBA16F, glCtx.RGBA, type)
          default: return null
        }
      }
      return { internalFormat, format }
    }

    let formatRGBA, formatRG, formatR
    if (isWebGL2) {
      formatRGBA = getSupportedFormat(glCtx.RGBA16F, glCtx.RGBA, halfFloatTexType)
      formatRG = getSupportedFormat(glCtx.RG16F, glCtx.RG, halfFloatTexType)
      formatR = getSupportedFormat(glCtx.R16F, glCtx.RED, halfFloatTexType)
    } else {
      formatRGBA = getSupportedFormat(glCtx.RGBA, glCtx.RGBA, halfFloatTexType)
      formatRG = getSupportedFormat(glCtx.RGBA, glCtx.RGBA, halfFloatTexType)
      formatR = getSupportedFormat(glCtx.RGBA, glCtx.RGBA, halfFloatTexType)
    }
    if (!formatRGBA || !formatRG || !formatR) return

    function compileShader(type, source) {
      const shader = glCtx.createShader(type)
      glCtx.shaderSource(shader, source)
      glCtx.compileShader(shader)
      return shader
    }

    class GLProgram {
      constructor(vertexShader, fragmentShader) {
        this.uniforms = {}
        this.program = glCtx.createProgram()
        glCtx.attachShader(this.program, vertexShader)
        glCtx.attachShader(this.program, fragmentShader)
        glCtx.linkProgram(this.program)
        const uniformCount = glCtx.getProgramParameter(this.program, glCtx.ACTIVE_UNIFORMS)
        for (let i = 0; i < uniformCount; i++) {
          const uniformName = glCtx.getActiveUniform(this.program, i).name
          this.uniforms[uniformName] = glCtx.getUniformLocation(this.program, uniformName)
        }
      }
      bind() { glCtx.useProgram(this.program) }
    }

    const baseVS = compileShader(glCtx.VERTEX_SHADER, `precision highp float;precision mediump sampler2D;attribute vec2 aPosition;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform vec2 texelSize;void main(){vUv=aPosition*0.5+0.5;vL=vUv-vec2(texelSize.x,0.0);vR=vUv+vec2(texelSize.x,0.0);vT=vUv+vec2(0.0,texelSize.y);vB=vUv-vec2(0.0,texelSize.y);gl_Position=vec4(aPosition,0.0,1.0);}`)
    const clearFS = compileShader(glCtx.FRAGMENT_SHADER, `precision highp float;precision mediump sampler2D;varying vec2 vUv;uniform sampler2D uTexture;uniform float value;void main(){gl_FragColor=value*texture2D(uTexture,vUv);}`)
    const displayFS = compileShader(glCtx.FRAGMENT_SHADER, `precision highp float;precision mediump sampler2D;varying vec2 vUv;uniform sampler2D uTexture;void main(){gl_FragColor=texture2D(uTexture,vUv);}`)
    const splatFS = compileShader(glCtx.FRAGMENT_SHADER, `precision highp float;precision mediump sampler2D;varying vec2 vUv;uniform sampler2D uTarget;uniform float aspectRatio;uniform vec3 color;uniform vec2 point;uniform float radius;void main(){vec2 p=vUv-point.xy;p.x*=aspectRatio;vec3 splat=exp(-dot(p,p)/radius)*color;vec3 base=texture2D(uTarget,vUv).xyz;gl_FragColor=vec4(base+splat,1.0);}`)
    const advFS = compileShader(glCtx.FRAGMENT_SHADER, supportLinearFiltering
      ? `precision highp float;precision mediump sampler2D;varying vec2 vUv;uniform sampler2D uVelocity;uniform sampler2D uSource;uniform vec2 texelSize;uniform float dt;uniform float dissipation;void main(){vec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;gl_FragColor=dissipation*texture2D(uSource,coord);gl_FragColor.a=1.0;}`
      : `precision highp float;precision mediump sampler2D;varying vec2 vUv;uniform sampler2D uVelocity;uniform sampler2D uSource;uniform vec2 texelSize;uniform float dt;uniform float dissipation;vec4 bilerp(in sampler2D sam,in vec2 p){vec4 st;st.xy=floor(p-0.5)+0.5;st.zw=st.xy+1.0;vec4 uv=st*texelSize.xyxy;vec4 a=texture2D(sam,uv.xy);vec4 b=texture2D(sam,uv.zy);vec4 c=texture2D(sam,uv.xw);vec4 d=texture2D(sam,uv.zw);vec2 f=p-st.xy;return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}void main(){vec2 coord=gl_FragCoord.xy-dt*texture2D(uVelocity,vUv).xy;gl_FragColor=dissipation*bilerp(uSource,coord);gl_FragColor.a=1.0;}`)
    const divFS = compileShader(glCtx.FRAGMENT_SHADER, `precision highp float;precision mediump sampler2D;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uVelocity;vec2 sampleVelocity(in vec2 uv){vec2 m=vec2(1.0);if(uv.x<0.0){uv.x=0.0;m.x=-1.0;}if(uv.x>1.0){uv.x=1.0;m.x=-1.0;}if(uv.y<0.0){uv.y=0.0;m.y=-1.0;}if(uv.y>1.0){uv.y=1.0;m.y=-1.0;}return m*texture2D(uVelocity,uv).xy;}void main(){float L=sampleVelocity(vL).x;float R=sampleVelocity(vR).x;float T=sampleVelocity(vT).y;float B=sampleVelocity(vB).y;float div=0.5*(R-L+T-B);gl_FragColor=vec4(div,0.0,0.0,1.0);}`)
    const curlFS = compileShader(glCtx.FRAGMENT_SHADER, `precision highp float;precision mediump sampler2D;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uVelocity;void main(){float L=texture2D(uVelocity,vL).y;float R=texture2D(uVelocity,vR).y;float T=texture2D(uVelocity,vT).x;float B=texture2D(uVelocity,vB).x;float v=R-L-T+B;gl_FragColor=vec4(v,0.0,0.0,1.0);}`)
    const vortFS = compileShader(glCtx.FRAGMENT_SHADER, `precision highp float;precision mediump sampler2D;varying vec2 vUv;varying vec2 vT;varying vec2 vB;uniform sampler2D uVelocity;uniform sampler2D uCurl;uniform float curl;uniform float dt;void main(){float T=texture2D(uCurl,vT).x;float B=texture2D(uCurl,vB).x;float C=texture2D(uCurl,vUv).x;vec2 force=vec2(abs(T)-abs(B),0.0);force*=1.0/length(force+0.00001)*curl*C;vec2 vel=texture2D(uVelocity,vUv).xy;gl_FragColor=vec4(vel+force*dt,0.0,1.0);}`)
    const pressFS = compileShader(glCtx.FRAGMENT_SHADER, `precision highp float;precision mediump sampler2D;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uPressure;uniform sampler2D uDivergence;vec2 boundary(in vec2 uv){return min(max(uv,0.0),1.0);}void main(){float L=texture2D(uPressure,boundary(vL)).x;float R=texture2D(uPressure,boundary(vR)).x;float T=texture2D(uPressure,boundary(vT)).x;float B=texture2D(uPressure,boundary(vB)).x;float C=texture2D(uPressure,vUv).x;float d=texture2D(uDivergence,vUv).x;float p=(L+R+B+T-d)*0.25;gl_FragColor=vec4(p,0.0,0.0,1.0);}`)
    const gradFS = compileShader(glCtx.FRAGMENT_SHADER, `precision highp float;precision mediump sampler2D;varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uPressure;uniform sampler2D uVelocity;vec2 boundary(in vec2 uv){return min(max(uv,0.0),1.0);}void main(){float L=texture2D(uPressure,boundary(vL)).x;float R=texture2D(uPressure,boundary(vR)).x;float T=texture2D(uPressure,boundary(vT)).x;float B=texture2D(uPressure,boundary(vB)).x;vec2 v=texture2D(uVelocity,vUv).xy;v.xy-=vec2(R-L,T-B);gl_FragColor=vec4(v,0.0,1.0);}`)

    let textureWidth, textureHeight, density, velocity, pressure, divergenceFBO, curlFBO

    function createFBO(texId, w, h, intFmt, fmt, type, param) {
      glCtx.activeTexture(glCtx.TEXTURE0 + texId)
      const t = glCtx.createTexture()
      glCtx.bindTexture(glCtx.TEXTURE_2D, t)
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, param)
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, param)
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_S, glCtx.CLAMP_TO_EDGE)
      glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_T, glCtx.CLAMP_TO_EDGE)
      glCtx.texImage2D(glCtx.TEXTURE_2D, 0, intFmt, w, h, 0, fmt, type, null)
      const f = glCtx.createFramebuffer()
      glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, f)
      glCtx.framebufferTexture2D(glCtx.FRAMEBUFFER, glCtx.COLOR_ATTACHMENT0, glCtx.TEXTURE_2D, t, 0)
      glCtx.viewport(0, 0, w, h)
      glCtx.clear(glCtx.COLOR_BUFFER_BIT)
      return [t, f, texId]
    }

    function createDoubleFBO(texId, w, h, intFmt, fmt, type, param) {
      let fbo1 = createFBO(texId, w, h, intFmt, fmt, type, param)
      let fbo2 = createFBO(texId + 1, w, h, intFmt, fmt, type, param)
      return { get read() { return fbo1 }, get write() { return fbo2 }, swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t } }
    }

    function initFramebuffers() {
      textureWidth = glCtx.drawingBufferWidth >> config.TEXTURE_DOWNSAMPLE
      textureHeight = glCtx.drawingBufferHeight >> config.TEXTURE_DOWNSAMPLE
      const texType = halfFloatTexType
      const lin = supportLinearFiltering ? glCtx.LINEAR : glCtx.NEAREST
      density = createDoubleFBO(2, textureWidth, textureHeight, formatRGBA.internalFormat, formatRGBA.format, texType, lin)
      velocity = createDoubleFBO(0, textureWidth, textureHeight, formatRG.internalFormat, formatRG.format, texType, lin)
      divergenceFBO = createFBO(4, textureWidth, textureHeight, formatR.internalFormat, formatR.format, texType, glCtx.NEAREST)
      curlFBO = createFBO(5, textureWidth, textureHeight, formatR.internalFormat, formatR.format, texType, glCtx.NEAREST)
      pressure = createDoubleFBO(6, textureWidth, textureHeight, formatR.internalFormat, formatR.format, texType, glCtx.NEAREST)
    }
    initFramebuffers()

    const clearProg = new GLProgram(baseVS, clearFS)
    const displayProg = new GLProgram(baseVS, displayFS)
    const splatProg = new GLProgram(baseVS, splatFS)
    const advProg = new GLProgram(baseVS, advFS)
    const divProg = new GLProgram(baseVS, divFS)
    const curlProg = new GLProgram(baseVS, curlFS)
    const vortProg = new GLProgram(baseVS, vortFS)
    const pressProg = new GLProgram(baseVS, pressFS)
    const gradProg = new GLProgram(baseVS, gradFS)

    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, glCtx.createBuffer())
    glCtx.bufferData(glCtx.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), glCtx.STATIC_DRAW)
    glCtx.bindBuffer(glCtx.ELEMENT_ARRAY_BUFFER, glCtx.createBuffer())
    glCtx.bufferData(glCtx.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), glCtx.STATIC_DRAW)
    glCtx.vertexAttribPointer(0, 2, glCtx.FLOAT, false, 0, 0)
    glCtx.enableVertexAttribArray(0)

    function blit(dest) {
      glCtx.bindFramebuffer(glCtx.FRAMEBUFFER, dest)
      glCtx.drawElements(glCtx.TRIANGLES, 6, glCtx.UNSIGNED_SHORT, 0)
    }

    function splat(x, y, dx, dy, color) {
      splatProg.bind()
      glCtx.uniform1i(splatProg.uniforms.uTarget, velocity.read[2])
      glCtx.uniform1f(splatProg.uniforms.aspectRatio, canvas.width / canvas.height)
      glCtx.uniform2f(splatProg.uniforms.point, x / canvas.width, 1.0 - y / canvas.height)
      glCtx.uniform3f(splatProg.uniforms.color, dx, -dy, 1.0)
      glCtx.uniform1f(splatProg.uniforms.radius, config.SPLAT_RADIUS)
      blit(velocity.write[1])
      velocity.swap()
      glCtx.uniform1i(splatProg.uniforms.uTarget, density.read[2])
      glCtx.uniform3f(splatProg.uniforms.color, color[0] * 0.3, color[1] * 0.3, color[2] * 0.3)
      blit(density.write[1])
      density.swap()
    }

    function multipleSplats(amount) {
      for (let i = 0; i < amount; i++) {
        const color = [Math.random() * 10, Math.random() * 10, Math.random() * 10]
        splat(canvas.width * Math.random(), canvas.height * Math.random(), 1000 * (Math.random() - 0.5), 1000 * (Math.random() - 0.5), color)
      }
    }

    function resizeCanvas() {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        initFramebuffers()
      }
    }

    let lastTime = Date.now()
    let animId

    function update() {
      resizeCanvas()
      const dt = Math.min((Date.now() - lastTime) / 1000, 0.016)
      lastTime = Date.now()

      glCtx.viewport(0, 0, textureWidth, textureHeight)
      if (splatStack.length > 0) multipleSplats(splatStack.pop())

      advProg.bind()
      glCtx.uniform2f(advProg.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight)
      glCtx.uniform1i(advProg.uniforms.uVelocity, velocity.read[2])
      glCtx.uniform1i(advProg.uniforms.uSource, velocity.read[2])
      glCtx.uniform1f(advProg.uniforms.dt, dt)
      glCtx.uniform1f(advProg.uniforms.dissipation, config.VELOCITY_DISSIPATION)
      blit(velocity.write[1]); velocity.swap()

      glCtx.uniform1i(advProg.uniforms.uVelocity, velocity.read[2])
      glCtx.uniform1i(advProg.uniforms.uSource, density.read[2])
      glCtx.uniform1f(advProg.uniforms.dissipation, config.DENSITY_DISSIPATION)
      blit(density.write[1]); density.swap()

      for (let i = 0; i < pointers.length; i++) {
        const p = pointers[i]
        if (p.moved) { splat(p.x, p.y, p.dx, p.dy, p.color); p.moved = false }
      }

      curlProg.bind()
      glCtx.uniform2f(curlProg.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight)
      glCtx.uniform1i(curlProg.uniforms.uVelocity, velocity.read[2])
      blit(curlFBO[1])

      vortProg.bind()
      glCtx.uniform2f(vortProg.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight)
      glCtx.uniform1i(vortProg.uniforms.uVelocity, velocity.read[2])
      glCtx.uniform1i(vortProg.uniforms.uCurl, curlFBO[2])
      glCtx.uniform1f(vortProg.uniforms.curl, config.CURL)
      glCtx.uniform1f(vortProg.uniforms.dt, dt)
      blit(velocity.write[1]); velocity.swap()

      divProg.bind()
      glCtx.uniform2f(divProg.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight)
      glCtx.uniform1i(divProg.uniforms.uVelocity, velocity.read[2])
      blit(divergenceFBO[1])

      clearProg.bind()
      let pTexId = pressure.read[2]
      glCtx.activeTexture(glCtx.TEXTURE0 + pTexId)
      glCtx.bindTexture(glCtx.TEXTURE_2D, pressure.read[0])
      glCtx.uniform1i(clearProg.uniforms.uTexture, pTexId)
      glCtx.uniform1f(clearProg.uniforms.value, config.PRESSURE_DISSIPATION)
      blit(pressure.write[1]); pressure.swap()

      pressProg.bind()
      glCtx.uniform2f(pressProg.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight)
      glCtx.uniform1i(pressProg.uniforms.uDivergence, divergenceFBO[2])
      pTexId = pressure.read[2]
      glCtx.uniform1i(pressProg.uniforms.uPressure, pTexId)
      glCtx.activeTexture(glCtx.TEXTURE0 + pTexId)
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        glCtx.bindTexture(glCtx.TEXTURE_2D, pressure.read[0])
        blit(pressure.write[1]); pressure.swap()
      }

      gradProg.bind()
      glCtx.uniform2f(gradProg.uniforms.texelSize, 1.0 / textureWidth, 1.0 / textureHeight)
      glCtx.uniform1i(gradProg.uniforms.uPressure, pressure.read[2])
      glCtx.uniform1i(gradProg.uniforms.uVelocity, velocity.read[2])
      blit(velocity.write[1]); velocity.swap()

      glCtx.viewport(0, 0, glCtx.drawingBufferWidth, glCtx.drawingBufferHeight)
      displayProg.bind()
      glCtx.uniform1i(displayProg.uniforms.uTexture, density.read[2])
      blit(null)

      animId = requestAnimationFrame(update)
    }

    const onMouseMove = (e) => {
      pointers[0].moved = pointers[0].down
      pointers[0].dx = (e.clientX - pointers[0].x) * 10.0
      pointers[0].dy = (e.clientY - pointers[0].y) * 10.0
      pointers[0].x = e.clientX
      pointers[0].y = e.clientY
    }
    const onMouseOver = () => {
      pointers[0].down = true
      pointers[0].color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2]
    }
    const onMouseLeave = () => { pointers[0].down = false }
    const onTouchStart = (e) => {
      const touches = e.targetTouches
      for (let i = 0; i < touches.length; i++) {
        if (i >= pointers.length) pointers.push(createPointer())
        pointers[i].id = touches[i].identifier
        pointers[i].down = true
        pointers[i].x = touches[i].pageX
        pointers[i].y = touches[i].pageY
        pointers[i].color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2]
      }
    }
    const onTouchMove = (e) => {
      const touches = e.targetTouches
      for (let i = 0; i < touches.length; i++) {
        const p = pointers[i]
        if (!p) continue
        p.moved = p.down
        p.dx = (touches[i].pageX - p.x) * 10.0
        p.dy = (touches[i].pageY - p.y) * 10.0
        p.x = touches[i].pageX
        p.y = touches[i].pageY
      }
    }
    const onTouchEnd = (e) => {
      const touches = e.changedTouches
      for (let i = 0; i < touches.length; i++) {
        for (let j = 0; j < pointers.length; j++) {
          if (touches[i].identifier === pointers[j].id) pointers[j].down = false
        }
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousemove', onMouseOver)
    window.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    update()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousemove', onMouseOver)
      window.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  if (isMobile) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: 1,
        mixBlendMode: 'screen',
      }}
    />
  )
}
