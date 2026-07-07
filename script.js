(function () {
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  // ---------- Helper ----------
  function lerp(a, b, t) { return a + (b - a) * t; }
  // ---------- Static-ish field elements (grass blades, generated once) ----------
  const groundY = H * 0.72;
  const grassBlades = [];
  (function generateGrass() {
    for (let x = 0; x < W; x += 6) {
      const baseHeight = 14 + Math.random() * 16;
      const yOffset = groundY + Math.random() * (H - groundY - 10);
      grassBlades.push({
        x: x + Math.random() * 4,
        y: Math.min(yOffset, H - 6),
        h: baseHeight,
        sway: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 0.6,
        shade: Math.random()
      });
    }
  })();
  // small distant hills (drawn once into a pattern, but cheap enough to redraw)
  function drawHills() {
    ctx.save();
    // far hill
    ctx.fillStyle = '#9fc77c';
    ctx.beginPath();
    ctx.moveTo(0, groundY - 10);
    ctx.quadraticCurveTo(W * 0.25, groundY - 70, W * 0.55, groundY - 20);
    ctx.quadraticCurveTo(W * 0.8, groundY - 60, W, groundY - 15);
    ctx.lineTo(W, groundY + 40);
    ctx.lineTo(0, groundY + 40);
    ctx.closePath();
    ctx.fill();
    // near hill
    ctx.fillStyle = '#7fb463';
    ctx.beginPath();
    ctx.moveTo(0, groundY + 10);
    ctx.quadraticCurveTo(W * 0.2, groundY - 25, W * 0.45, groundY + 5);
    ctx.quadraticCurveTo(W * 0.75, groundY - 30, W, groundY + 0);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // ---------- Clouds ----------
  const clouds = [
    { x: 120, y: 90, scale: 1.0, speed: 6 },
    { x: 420, y: 60, scale: 0.7, speed: 4 },
    { x: 680, y: 120, scale: 1.3, speed: 8 },
    { x: 850, y: 70, scale: 0.6, speed: 5 }
  ];
  function drawCloud(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.scale, c.scale);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(26, -8, 22, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(-26, -4, 20, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(8, 6, 30, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // ---------- Birds (tiny ambient detail) ----------
  const birds = [
    { x: 200, y: 130, speed: 18, phase: 0 },
    { x: 260, y: 150, speed: 18, phase: 1.4 },
    { x: 600, y: 100, speed: -14, phase: 0.7 }
  ];
  function drawBird(b, t) {
    const flap = Math.sin(t * 6 + b.phase) * 8;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.strokeStyle = 'rgba(60,50,50,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.quadraticCurveTo(-4, -flap, 0, 0);
    ctx.quadraticCurveTo(4, -flap, 10, 0);
    ctx.stroke();
    ctx.restore();
  }
  // ---------- Windmill ----------
  const mill = {
    x: 680,
    y: groundY - 4,
    bodyWidth: 90,
    bodyHeight: 170,
    hubX: 0, // computed
    hubY: 0,
    bladeLength: 95,
    angle: 0,
    angularSpeed: 0.9 // radians per second
  };
  function drawWindmill(dt) {
    mill.angle += mill.angularSpeed * dt;
    const baseX = mill.x;
    const baseY = mill.y;
    const topY = baseY - mill.bodyHeight;
    const topWidth = mill.bodyWidth * 0.55;
    // shadow on ground
    ctx.save();
    ctx.fillStyle = 'rgba(40,40,20,0.18)';
    ctx.beginPath();
    ctx.ellipse(baseX, baseY + 6, mill.bodyWidth * 0.7, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // tower body (tapered trapezoid) with subtle shading via gradient
    const grad = ctx.createLinearGradient(baseX - mill.bodyWidth / 2, topY, baseX + mill.bodyWidth / 2, baseY);
    grad.addColorStop(0, '#f3ead9');
    grad.addColorStop(1, '#d8c7a8');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(baseX - mill.bodyWidth / 2, baseY);
    ctx.lineTo(baseX - topWidth / 2, topY);
    ctx.lineTo(baseX + topWidth / 2, topY);
    ctx.lineTo(baseX + mill.bodyWidth / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a98f63';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    // horizontal plank lines on tower
    ctx.save();
    ctx.strokeStyle = 'rgba(150,120,80,0.35)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const y = lerp(baseY, topY, t);
      const halfW = lerp(mill.bodyWidth / 2, topWidth / 2, t);
      ctx.beginPath();
      ctx.moveTo(baseX - halfW, y);
      ctx.lineTo(baseX + halfW, y);
      ctx.stroke();
    }
    ctx.restore();
    // conical roof
    ctx.save();
    ctx.fillStyle = '#7a4b3a';
    ctx.beginPath();
    ctx.moveTo(baseX - topWidth / 2 - 8, topY);
    ctx.lineTo(baseX + topWidth / 2 + 8, topY);
    ctx.lineTo(baseX, topY - 38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5e3a2c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    // door
    ctx.save();
    ctx.fillStyle = '#5e3a2c';
    const doorW = 22, doorH = 34;
    ctx.beginPath();
    ctx.moveTo(baseX - doorW / 2, baseY);
    ctx.lineTo(baseX - doorW / 2, baseY - doorH + 8);
    ctx.quadraticCurveTo(baseX, baseY - doorH - 4, baseX + doorW / 2, baseY - doorH + 8);
    ctx.lineTo(baseX + doorW / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // small window
    ctx.save();
    ctx.fillStyle = '#cfe6ea';
    ctx.strokeStyle = '#7a5c3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(baseX, topY + 45, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // hub position - slightly above the tower top, mounted to one side like real windmills
    const hubX = baseX;
    const hubY = topY - 6;
    mill.hubX = hubX;
    mill.hubY = hubY;
    // blade shaft cap (small circle behind blades)
    ctx.save();
    ctx.translate(hubX, hubY);
    // draw 4 blades, each offset by 90deg, rotating with mill.angle
    for (let i = 0; i < 4; i++) {
      const bladeAngle = mill.angle + (Math.PI / 2) * i;
      ctx.save();
      ctx.rotate(bladeAngle);
      // blade shaft (the long spar)
      ctx.strokeStyle = '#6b4a35';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -mill.bladeLength);
      ctx.stroke();
      // lattice sail (trapezoid fabric/wood blade)
      const sailGrad = ctx.createLinearGradient(0, -10, 0, -mill.bladeLength);
      sailGrad.addColorStop(0, '#f6efe1');
      sailGrad.addColorStop(1, '#e3d4b8');
      ctx.fillStyle = sailGrad;
      ctx.beginPath();
      ctx.moveTo(-6, -14);
      ctx.lineTo(6, -14);
      ctx.lineTo(16, -mill.bladeLength + 8);
      ctx.lineTo(-16, -mill.bladeLength + 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9b8160';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // lattice cross slats for windmill-sail look
      ctx.strokeStyle = 'rgba(120,95,60,0.5)';
      ctx.lineWidth = 1;
      const slats = 4;
      for (let s = 1; s <= slats; s++) {
        const t = s / (slats + 1);
        const yy = lerp(-14, -mill.bladeLength + 8, t);
        const halfW = lerp(6, 16, t);
        ctx.beginPath();
        ctx.moveTo(-halfW, yy);
        ctx.lineTo(halfW, yy);
        ctx.stroke();
      }
      ctx.restore();
    }
    // central hub cap on top of blades
    ctx.beginPath();
    ctx.fillStyle = '#4a3525';
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2c1f15';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore(); // un-translate hub
  }
  // ---------- Cart (wagon) ----------
  const cart = {
    x: -180,           // start off-screen left
    y: groundY + 6,
    speed: 42,         // px per second
    wheelRadius: 22,
    bodyWidth: 130,
    bodyHeight: 46,
    wheelAngle: 0
  };
  function drawWheel(cx, cy, r, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    // tire
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#3b2a1e';
    ctx.fill();
    // rim
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
    ctx.fillStyle = '#6b4a32';
    ctx.fill();
    ctx.strokeStyle = '#2c1f15';
    ctx.lineWidth = 2;
    ctx.stroke();
    // rotating spokes
    ctx.rotate(angle);
    ctx.strokeStyle = '#2c1f15';
    ctx.lineWidth = 3;
    const spokeCount = 6;
    for (let i = 0; i < spokeCount; i++) {
      const a = (Math.PI * 2 / spokeCount) * i;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62);
      ctx.stroke();
    }
    // hub cap
    ctx.beginPath();
    ctx.fillStyle = '#caa468';
    ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawCart(dt) {
    // move cart, wrap around when off right edge
    cart.x += cart.speed * dt;
    if (cart.x > W + 160) {
      cart.x = -180;
    }
    // wheel rotation tied to forward speed (rolling without slipping, scaled for visual clarity)
    cart.wheelAngle += (cart.speed / cart.wheelRadius) * dt;
    const cx = cart.x;
    const cy = cart.y;
    const wheelY = cy - cart.wheelRadius * 0.55;
    // shadow under cart
    ctx.save();
    ctx.fillStyle = 'rgba(40,40,20,0.18)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, cart.bodyWidth * 0.6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // back wheel (drawn first so body overlaps it slightly)
    drawWheel(cx - cart.bodyWidth * 0.3, wheelY, cart.wheelRadius, cart.wheelAngle);
    drawWheel(cx + cart.bodyWidth * 0.3, wheelY, cart.wheelRadius, cart.wheelAngle);
    // wagon body (wooden bed)
    ctx.save();
    const bodyTop = wheelY - cart.bodyHeight + 6;
    const bodyGrad = ctx.createLinearGradient(0, bodyTop, 0, wheelY);
    bodyGrad.addColorStop(0, '#a9713f');
    bodyGrad.addColorStop(1, '#8a5a30');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(cx - cart.bodyWidth / 2, wheelY);
    ctx.lineTo(cx - cart.bodyWidth / 2 - 6, bodyTop + 10);
    ctx.lineTo(cx - cart.bodyWidth / 2 + 8, bodyTop);
    ctx.lineTo(cx + cart.bodyWidth / 2 - 8, bodyTop);
    ctx.lineTo(cx + cart.bodyWidth / 2 + 6, bodyTop + 10);
    ctx.lineTo(cx + cart.bodyWidth / 2, wheelY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5c3a1d';
    ctx.lineWidth = 2;
    ctx.stroke();
    // plank lines
    ctx.strokeStyle = 'rgba(70,40,15,0.4)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const px = lerp(cx - cart.bodyWidth / 2 + 6, cx + cart.bodyWidth / 2 - 6, i / 4);
      ctx.beginPath();
      ctx.moveTo(px, bodyTop + 4);
      ctx.lineTo(px, wheelY - 2);
      ctx.stroke();
    }
    // hay/produce poking out of the cart for character
    ctx.fillStyle = '#e0b84a';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(cx + i * 16, bodyTop - 4, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#d6a93d';
    ctx.beginPath();
    ctx.ellipse(cx, bodyTop - 12, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // shaft / tongue extending forward (toward direction of travel)
    ctx.strokeStyle = '#6b4a32';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx + cart.bodyWidth / 2, wheelY - 6);
    ctx.lineTo(cx + cart.bodyWidth / 2 + 46, wheelY - 16);
    ctx.stroke();
    ctx.restore();
  }
  // ---------- Sun & sky ----------
  // The sun travels in an arc across the sky over a long cycle.
  const SUN_CYCLE_SECONDS = 60; // full sky traverse duration
  let sunT = 0.18; // start partway through morning for a nice initial composition
  function skyColorForT(t) {
    // t in [0,1], 0 = sunrise (left horizon), 1 = sunset (right horizon)
    // Sample a few key colors and blend.
    const stops = [
      { t: 0.0, top: [255, 200, 150], bottom: [255, 235, 205] },
      { t: 0.25, top: [140, 200, 235], bottom: [210, 235, 245] },
      { t: 0.5, top: [100, 180, 230], bottom: [195, 225, 240] },
      { t: 0.75, top: [150, 195, 230], bottom: [225, 220, 200] },
      { t: 1.0, top: [255, 180, 130], bottom: [255, 220, 180] }
    ];
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].t && t <= stops[i + 1].t) {
        a = stops[i];
        b = stops[i + 1];
        break;
      }
    }
    const span = (b.t - a.t) || 1;
    const localT = (t - a.t) / span;
    const top = a.top.map((c, i) => Math.round(lerp(c, b.top[i], localT)));
    const bottom = a.bottom.map((c, i) => Math.round(lerp(c, b.bottom[i], localT)));
    return {
      top: `rgb(${top[0]},${top[1]},${top[2]})`,
      bottom: `rgb(${bottom[0]},${bottom[1]},${bottom[2]})`
    };
  }
  function drawSky(t) {
    const colors = skyColorForT(t);
    const grad = ctx.createLinearGradient(0, 0, 0, groundY + 20);
    grad.addColorStop(0, colors.top);
    grad.addColorStop(1, colors.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
  function drawSun(t) {
    // Arc path: rises from left horizon, peaks in middle, sets on right horizon.
    const sunX = lerp(40, W - 40, t);
    const arcHeight = H * 0.55;
    const sunY = (groundY - 10) - Math.sin(t * Math.PI) * arcHeight;
    // glow
    const glowR = 70;
    const glowGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowR);
    glowGrad.addColorStop(0, 'rgba(255,244,200,0.55)');
    glowGrad.addColorStop(1, 'rgba(255,244,200,0)');
    ctx.save();
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // sun disk
    ctx.save();
    ctx.fillStyle = '#fff1b8';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,140,0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    return { x: sunX, y: sunY };
  }
  // ---------- Ground & grass ----------
  function drawGround() {
    ctx.save();
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0, '#7fb463');
    groundGrad.addColorStop(1, '#5d9148');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.restore();
  }
  function drawGrass(time) {
    ctx.save();
    for (const blade of grassBlades) {
      const sway = Math.sin(time * blade.speed + blade.sway) * 5;
      const shadeColor = blade.shade > 0.5 ? '#4f8a3c' : '#6aa84f';
      ctx.strokeStyle = shadeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(blade.x, blade.y);
      ctx.quadraticCurveTo(
        blade.x + sway, blade.y - blade.h * 0.6,
        blade.x + sway * 1.4, blade.y - blade.h
      );
      ctx.stroke();
    }
    ctx.restore();
  }
  // simple dirt path leading toward the windmill, so the cart has a "road"
  function drawPath() {
    ctx.save();
    ctx.fillStyle = 'rgba(180,150,100,0.55)';
    ctx.beginPath();
    ctx.moveTo(-20, groundY + 28);
    ctx.lineTo(W + 20, groundY + 18);
    ctx.lineTo(W + 20, groundY + 44);
    ctx.lineTo(-20, groundY + 54);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // ---------- Main animation loop ----------
  let lastTime = null;
  function frame(now) {
    if (lastTime === null) lastTime = now;
    const dt = Math.min((now - lastTime) / 1000, 0.05); // clamp for tab-switch hiccups
    lastTime = now;
    const t = (now / 1000);
    // advance sun position cycle
    sunT += dt / SUN_CYCLE_SECONDS;
    if (sunT > 1) sunT -= 1;
    // --- draw scene back to front ---
    drawSky(sunT);
    drawSun(sunT);
    for (const c of clouds) {
      c.x += c.speed * dt;
      if (c.x > W + 100) c.x = -100;
      drawCloud(c);
    }
    for (const b of birds) {
      b.x += b.speed * dt;
      if (b.speed > 0 && b.x > W + 20) b.x = -20;
      if (b.speed < 0 && b.x < -20) b.x = W + 20;
      drawBird(b, t);
    }
    drawHills();
    drawPath();
    drawGround();
    drawGrass(t);
    drawWindmill(dt);
    drawCart(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
