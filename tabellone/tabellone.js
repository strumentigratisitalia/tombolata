(function () {
  function track(ev) { try { if (window.goatcounter && goatcounter.count) goatcounter.count({ path: ev, title: ev, event: true }); } catch (e) {} }
  var KEY = 'tombolata:tabellone';
  var $ = function (id) { return document.getElementById(id); };
  var state = load() || { drawn: [], prizes: {} };
  var board = $('board');
  var PRIZE_ORDER = [2, 3, 4, 5, 15];

  for (var n = 1; n <= 90; n++) {
    var s = document.createElement('span');
    s.textContent = n;
    s.id = 'n' + n;
    board.append(s);
  }

  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function paint(animate) {
    for (var n = 1; n <= 90; n++) $('n' + n).className = '';
    state.drawn.forEach(function (n) { $('n' + n).className = 'out'; });
    var last = state.drawn[state.drawn.length - 1];
    if (last) $('n' + last).className = 'just';
    $('ball').textContent = last || '?';
    if (animate) { $('ball').classList.remove('spin'); void $('ball').offsetWidth; $('ball').classList.add('spin'); }
    var sm = $('smorfia');
    if (!last) sm.textContent = 'Premi Estrai per il primo numero.';
    else if ($('napo').checked) {
      sm.innerHTML = '';
      var b = document.createElement('strong'); b.textContent = SMORFIA[last][0];
      sm.append(b, document.createTextNode(SMORFIA[last][1]));
    } else sm.textContent = '';
    var lastEl = $('last'); lastEl.innerHTML = '';
    state.drawn.slice(-6, -1).reverse().forEach(function (n) {
      var x = document.createElement('span'); x.textContent = n; lastEl.append(x);
    });
    $('count').textContent = state.drawn.length + (state.drawn.length === 1 ? ' numero uscito' : ' numeri usciti') + ' su 90';
    $('draw').disabled = state.drawn.length >= 90;
    $('draw').textContent = state.drawn.length >= 90 ? 'Finiti i numeri' : 'Estrai';
    paintPrizes();
  }

  function paintPrizes() {
    var el = $('prizes'); el.innerHTML = '';
    PRIZE_ORDER.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'prize' + (state.prizes[k] ? ' done' : '');
      b.textContent = PREMI[k] + (state.prizes[k] ? ': ' + state.prizes[k] : '');
      b.onclick = function () {
        if (state.prizes[k]) { if (confirm('Rimettere in palio ' + PREMI[k] + '?')) delete state.prizes[k]; }
        else {
          var who = prompt('Chi ha fatto ' + PREMI[k].toLowerCase() + '?');
          if (!who) return;
          state.prizes[k] = who.trim().slice(0, 24);
        }
        save(); paintPrizes();
      };
      el.append(b);
    });
  }

  function speak(n) {
    if (!$('voice').checked || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    var text = String(n) + ($('napo').checked ? '. ' + SMORFIA[n][1] : '');
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'it-IT';
    var v = speechSynthesis.getVoices().filter(function (v) { return /^it/i.test(v.lang); })[0];
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  function draw() {
    if (state.drawn.length >= 90) return;
    var left = [];
    for (var n = 1; n <= 90; n++) if (state.drawn.indexOf(n) < 0) left.push(n);
    var buf = new Uint32Array(1); crypto.getRandomValues(buf);
    var pick = left[buf[0] % left.length];
    state.drawn.push(pick);
    if (state.drawn.length === 1) track('tombola-partita');
    save(); paint(true); speak(pick);
  }

  $('draw').onclick = draw;
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); draw(); }
  });
  $('undo').onclick = function () {
    if (!state.drawn.length) return;
    if (!confirm('Rimettere nel sacchetto il ' + state.drawn[state.drawn.length - 1] + '?')) return;
    state.drawn.pop(); save(); paint(false);
  };
  $('reset').onclick = function () {
    if (!confirm('Iniziare una nuova partita? Il tabellone si svuota.')) return;
    state = { drawn: [], prizes: {} }; save(); paint(false);
  };
  $('napo').onchange = function () { paint(false); };

  var playersUrl = location.href.replace(/tabellone\/?(index\.html)?([#?].*)?$/, 'cartelle/');
  try {
    var qr = qrcode(0, 'M'); qr.addData(playersUrl); qr.make();
    $('qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  } catch (e) { $('qr').hidden = true; }
  $('shareLink').onclick = function () {
    var text = 'Si gioca a tombola! 🎄 Prendi le tue cartelle qui: ' + playersUrl;
    if (navigator.share) navigator.share({ text: text }).catch(function () {});
    else window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  };

  $('check').onsubmit = function (e) {
    e.preventDefault();
    var id = parseInt($('checkNum').value, 10);
    var out = $('checkOut'); out.innerHTML = '';
    if (!id || id < 1 || id > 999999) { out.textContent = 'Scrivi il numero che compare in alto sulla cartella.'; return; }
    var card = Cartella.make(id);
    var isOut = function (n) { return state.drawn.indexOf(n) >= 0; };
    var wrap = document.createElement('div'); wrap.className = 'cartella';
    var grid = document.createElement('div'); grid.className = 'grid';
    wrap.append(grid);
    Cartella.render(grid, card, isOut);
    var res = Cartella.best(card, isOut);
    var p = document.createElement('p');
    p.style.fontWeight = '800';
    p.textContent = 'Cartella n. ' + id + ': ' + (res >= 2 ? PREMI[res] + ' valida con i numeri usciti.' : 'nessun premio con i numeri usciti finora.');
    out.append(p, wrap);
  };

  paint(false);
})();
