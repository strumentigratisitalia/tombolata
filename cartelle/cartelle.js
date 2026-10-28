(function () {
  function track(ev) { try { if (window.goatcounter && goatcounter.count) goatcounter.count({ path: ev, title: ev, event: true }); } catch (e) {} }
  var KEY = 'tombolata:cartelle';
  var $ = function (id) { return document.getElementById(id); };
  var state = load();
  var howMany = 2;
  var toastTimer;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function setup() {
    $('game').hidden = true;
    $('setup').hidden = false;
    var pick = $('pick'); pick.innerHTML = '';
    for (var i = 1; i <= 6; i++) (function (i) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = i;
      b.setAttribute('aria-pressed', i === howMany ? 'true' : 'false');
      b.onclick = function () {
        howMany = i;
        pick.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      };
      pick.append(b);
    })(i);
  }

  $('start').onclick = function () {
    var ids = [];
    while (ids.length < howMany) {
      var buf = new Uint32Array(1); crypto.getRandomValues(buf);
      var id = 1 + (buf[0] % 999999);
      if (ids.indexOf(id) < 0) ids.push(id);
    }
    state = { cards: ids.map(function (id) { return { id: id, on: [], best: 0 }; }) };
    save(); play();
    track('cartelle-' + howMany);
  };

  function play() {
    $('setup').hidden = true;
    $('game').hidden = false;
    var wrap = $('cards'); wrap.innerHTML = '';
    state.cards.forEach(function (c) {
      var card = Cartella.make(c.id);
      var box = document.createElement('div'); box.className = 'cartella';
      var label = document.createElement('div'); label.className = 'label';
      var l1 = document.createElement('span'); l1.textContent = 'Cartella n. ' + c.id;
      var l2 = document.createElement('span'); l2.className = 'res';
      label.append(l1, l2);
      var grid = document.createElement('div'); grid.className = 'grid';
      box.append(label, grid);
      wrap.append(box);
      var isOn = function (n) { return c.on.indexOf(n) >= 0; };
      var draw = function () {
        Cartella.render(grid, card, isOn, function (n) {
          var i = c.on.indexOf(n);
          if (i >= 0) c.on.splice(i, 1); else c.on.push(n);
          var b = Cartella.best(card, isOn);
          if (b > c.best && PREMI[b]) celebrate(b, c.id);
          c.best = Math.max(c.best, b);
          save(); draw();
        });
        var now = Cartella.best(card, isOn);
        l2.textContent = PREMI[now] || '';
        box.classList.toggle('win', now === 15);
      };
      draw();
    });
    status();
  }

  function status() {
    var n = state.cards.length;
    $('status').textContent = n + (n === 1 ? ' cartella' : ' cartelle');
  }

  function celebrate(k, id) {
    $('toastTitle').textContent = PREMI[k] + '!';
    $('toastText').textContent = k === 15 ? 'Gridalo forte. Cartella n. ' + id + '.' : 'Sulla cartella n. ' + id + '.';
    $('toast').classList.add('show');
    if (navigator.vibrate) navigator.vibrate(k === 15 ? [80, 60, 80, 60, 200] : 60);
    cardBlob = null;
    makeCard(k).then(function (b) { cardBlob = { k: k, b: b }; }, function () {});
    $('toastShare').onclick = function () { share(k); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $('toast').classList.remove('show'); }, k === 15 ? 9000 : 4000);
  }

  var cardBlob = null;
  function share(k) {
    track('condividi-premio');
    var site = location.origin + location.pathname.replace(/cartelle\/?(index\.html)?$/, '');
    var text = (k === 15 ? 'Ho fatto TOMBOLA! 🎉' : 'Ho fatto ' + PREMI[k].toLowerCase() + '!') + ' Gioca anche tu: ' + site;
    var wa = function () { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener'); };
    var file = cardBlob && cardBlob.k === k && new File([cardBlob.b], 'tombola.png', { type: 'image/png' });
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], text: text }).catch(function (e) { if (e && e.name !== 'AbortError') wa(); });
    else if (navigator.share) navigator.share({ text: text }).catch(function (e) { if (e && e.name !== 'AbortError') wa(); });
    else wa();
  }

  function makeCard(k) {
    var c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
    var x = c.getContext('2d');
    return document.fonts.ready.then(function () {
      x.fillStyle = '#7a1626'; x.fillRect(0, 0, 1080, 1920);
      x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 3;
      for (var i = -1920; i < 1080; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 1920, 1920); x.stroke(); }
      x.textAlign = 'center';
      x.fillStyle = '#f2c14e'; x.font = '200px "Alfa Slab One"';
      x.fillText(PREMI[k].toUpperCase() + '!', 540, 760, 980);
      x.fillStyle = '#fff6df'; x.font = '700 56px Karla';
      x.fillText(k === 15 ? 'Ho vinto la tombola di Natale' : 'Alla tombola di Natale', 540, 880);
      for (var b = 0; b < 9; b++) {
        x.save(); x.translate(260 + b * 70, 1120 + (b % 2) * 40); x.rotate(-0.4 + b * 0.1);
        x.fillStyle = '#8a4b23'; x.beginPath(); x.ellipse(0, 0, 34, 24, 0, 0, Math.PI * 2); x.fill(); x.restore();
      }
      x.fillStyle = '#fff6df'; x.font = '700 50px Karla';
      x.fillText('Gioca anche tu, gratis', 540, 1520);
      x.fillStyle = '#f2c14e'; x.font = '64px "Alfa Slab One"';
      x.fillText('Tombolata', 540, 1610);
      return new Promise(function (res) { c.toBlob(res, 'image/png'); });
    });
  }

  $('clear').onclick = function () {
    if (!confirm('Togliere tutti i fagioli dalle cartelle?')) return;
    state.cards.forEach(function (c) { c.on = []; c.best = 0; });
    save(); play();
  };
  $('new').onclick = function () {
    if (!confirm('Prendere cartelle nuove? Quelle di adesso spariscono.')) return;
    state = null; save(); setup();
  };

  if (state && state.cards && state.cards.length) play(); else setup();
})();
