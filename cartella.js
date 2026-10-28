// Cartelle da tombola: 3 righe x 9 colonne, 5 numeri per riga, ogni colonna
// con la sua decina (1-9, 10-19, ..., 80-90) e almeno un numero.
(function (global) {
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pickDistinct(r, from, to, k) {
    var pool = [];
    for (var n = from; n <= to; n++) pool.push(n);
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var x = pool[i]; pool[i] = pool[j]; pool[j] = x;
    }
    return pool.slice(0, k).sort(function (a, b) { return a - b; });
  }

  function make(seed) {
    var r = rng(seed);
    var rows;
    for (;;) {
      rows = [];
      var colCount = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (var y = 0; y < 3; y++) {
        var cols = pickDistinct(r, 0, 8, 5);
        rows.push(cols);
        cols.forEach(function (c) { colCount[c]++; });
      }
      if (colCount.every(function (c) { return c > 0; })) break;
    }
    var grid = [[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0]];
    for (var c = 0; c < 9; c++) {
      var ys = [0, 1, 2].filter(function (y) { return rows[y].indexOf(c) >= 0; });
      var from = c === 0 ? 1 : c * 10;
      var to = c === 8 ? 90 : c * 10 + 9;
      var nums = pickDistinct(r, from, to, ys.length);
      ys.forEach(function (y, i) { grid[y][c] = nums[i]; });
    }
    return { seed: seed, grid: grid };
  }

  function render(container, card, isOn, onTap) {
    container.innerHTML = '';
    card.grid.forEach(function (row) {
      row.forEach(function (n) {
        var cell;
        if (!n) {
          cell = document.createElement('span');
          cell.className = 'cell empty';
        } else if (onTap) {
          cell = document.createElement('button');
          cell.type = 'button';
          cell.className = 'cell' + (isOn(n) ? ' on' : '');
          cell.textContent = n;
          cell.setAttribute('aria-pressed', isOn(n) ? 'true' : 'false');
          cell.setAttribute('aria-label', 'Numero ' + n);
          cell.onclick = function () { onTap(n, cell); };
        } else {
          cell = document.createElement('span');
          cell.className = 'cell' + (isOn(n) ? ' on' : '');
          cell.textContent = n;
        }
        container.append(cell);
      });
    });
  }

  // Miglior risultato raggiunto: 2 ambo ... 5 cinquina, 15 tombola.
  function best(card, isOn) {
    var total = 0, bestRow = 0;
    card.grid.forEach(function (row) {
      var k = row.filter(function (n) { return n && isOn(n); }).length;
      total += k;
      if (k > bestRow) bestRow = k;
    });
    return total === 15 ? 15 : bestRow;
  }

  global.Cartella = { make: make, render: render, best: best, rng: rng };
  global.PREMI = { 2: 'Ambo', 3: 'Terno', 4: 'Quaterna', 5: 'Cinquina', 15: 'Tombola' };
})(window);
