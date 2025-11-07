/*
 * FC Manager 26
 *
 * This script powers the static website for managing a football team in
 * Career Manager FC26 mode. It handles loading the players database,
 * managing team composition and formation, tracking the budget and
 * transactions, and providing a simple transfer market.
 */

/* eslint-disable no-unused-vars */

(function() {
  // Define formations and their position slots
  const FORMATIONS = {
    '4-3-3': ['GK', 'RB', 'CB1', 'CB2', 'LB', 'CM1', 'CM2', 'CM3', 'RW', 'ST', 'LW'],
    '4-4-2': ['GK', 'RB', 'CB1', 'CB2', 'LB', 'RM', 'CM1', 'CM2', 'LM', 'ST1', 'ST2'],
    '3-5-2': ['GK', 'CB1', 'CB2', 'CB3', 'RM', 'CM1', 'CM2', 'CM3', 'LM', 'ST1', 'ST2'],
    '5-3-2': ['GK', 'RWB', 'CB1', 'CB2', 'CB3', 'LWB', 'CM1', 'CM2', 'CM3', 'ST1', 'ST2'],
  };

  // Determine recommended role based on position
  function getRecommendedRole(position) {
    position = position.toUpperCase();
    if (position === 'GK') return 'Gardien de but';
    if (position.startsWith('CB')) return 'Défenseur central';
    if (['RB', 'LB', 'RWB', 'LWB'].includes(position)) return 'Latéral';
    if (['CDM', 'RDM', 'LDM'].includes(position)) return 'Milieu défensif';
    if (['CM', 'CM1', 'CM2', 'CM3', 'RCM', 'LCM'].includes(position)) return 'Milieu central';
    if (['CAM', 'LAM', 'RAM'].includes(position)) return 'Milieu offensif';
    if (['RM', 'LM', 'RW', 'LW', 'RWB', 'LWB'].includes(position)) return 'Ailier';
    if (position.startsWith('ST') || ['CF', 'LS', 'RS'].includes(position)) return 'Attaquant';
    return 'Joueur';
  }

  // Utility: read from localStorage (JSON)
  function getLocal(key, defaultValue) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  // Utility: write to localStorage (JSON)
  function setLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Static players database.
  // In a file-based environment the fetch API cannot read local files via "file://".
  // To keep the site self-contained, the players list is embedded directly.
  const PLAYERS = [
    {
      player_id: 231747,
      name: 'Kylian Mbappé',
      positions: 'ST,LW,LM',
      overall: 91,
      potential: 94,
      value: 173500000,
      club: 'Real Madrid',
      country: 'France'
    },
    {
      player_id: 209331,
      name: 'Mohamed Salah',
      positions: 'RM,RW',
      overall: 91,
      potential: 91,
      value: 82000000,
      club: 'Liverpool',
      country: 'Egypt'
    },
    {
      player_id: 252371,
      name: 'Jude Bellingham',
      positions: 'CAM,CM',
      overall: 90,
      potential: 94,
      value: 174500000,
      club: 'Real Madrid',
      country: 'England'
    },
    {
      player_id: 239085,
      name: 'Erling Haaland',
      positions: 'ST',
      overall: 90,
      potential: 92,
      value: 157000000,
      club: 'Manchester City',
      country: 'Norway'
    },
    {
      player_id: 231866,
      name: 'Rodri',
      positions: 'CDM,CM',
      overall: 90,
      potential: 90,
      value: 102000000,
      club: 'Manchester City',
      country: 'Spain'
    },
    {
      player_id: 231443,
      name: 'Ousmane Dembélé',
      positions: 'ST,RW,CAM',
      overall: 90,
      potential: 90,
      value: 122500000,
      club: 'Paris Saint‑Germain',
      country: 'France'
    },
    {
      player_id: 203376,
      name: 'Virgil van Dijk',
      positions: 'CB',
      overall: 90,
      potential: 90,
      value: 57000000,
      club: 'Liverpool',
      country: 'Netherlands'
    },
    {
      player_id: 277643,
      name: 'Lamine Yamal',
      positions: 'RM,RW',
      overall: 89,
      potential: 95,
      value: 147000000,
      club: 'FC Barcelona',
      country: 'Spain'
    },
    {
      player_id: 256630,
      name: 'Florian Wirtz',
      positions: 'CAM,ST,CM',
      overall: 89,
      potential: 93,
      value: 150500000,
      club: 'Liverpool',
      country: 'Germany'
    },
    {
      player_id: 255253,
      name: 'Vitinha',
      positions: 'CM,CDM,CAM',
      overall: 89,
      potential: 91,
      value: 128500000,
      club: 'Paris Saint‑Germain',
      country: 'Portugal'
    },
    {
      player_id: 251854,
      name: 'Pedri',
      positions: 'CM,CDM,CAM',
      overall: 89,
      potential: 93,
      value: 149500000,
      club: 'FC Barcelona',
      country: 'Spain'
    },
    {
      player_id: 235212,
      name: 'Achraf Hakimi',
      positions: 'RB,RM',
      overall: 89,
      potential: 90,
      value: 111000000,
      club: 'Paris Saint‑Germain',
      country: 'Morocco'
    }
  ];

  // Preprocess players to add positions_list field
  PLAYERS.forEach(pl => {
    pl.positions_list = pl.positions.split(',').map(s => s.trim());
  });

  // Returns a promise that resolves with the players list
  function loadPlayers() {
    return Promise.resolve(PLAYERS);
  }

  // Render functions for each page
  function renderTeamPage(players) {
    const formationSelect = document.getElementById('formation-select');
    const tableBody = document.getElementById('team-table-body');

    // Initialise saved team state or set defaults
    let savedTeam = getLocal('team', { formation: '4-3-3', players: {} });

    // Populate formations dropdown
    Object.keys(FORMATIONS).forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      if (f === savedTeam.formation) opt.selected = true;
      formationSelect.appendChild(opt);
    });

    // Render the table based on current formation
    function renderTable() {
      tableBody.innerHTML = '';
      const positions = FORMATIONS[savedTeam.formation];
      positions.forEach(pos => {
        const tr = document.createElement('tr');
        const posTd = document.createElement('td');
        posTd.textContent = pos;
        tr.appendChild(posTd);
        const selectTd = document.createElement('td');
        const select = document.createElement('select');
        select.name = 'player-' + pos;
        select.className = 'player-select';
        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '-- Choisir --';
        select.appendChild(emptyOpt);
        // Filter players that can play this role
        let eligible = players.filter(pl => pl.positions_list.some(p => pos.replace(/\d/g,'') === p));
        if (eligible.length === 0) {
          eligible = players;
        }
        eligible.sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));
        eligible.forEach(pl => {
          const opt = document.createElement('option');
          opt.value = pl.player_id;
          opt.textContent = `${pl.name} (${pl.positions}) - ${pl.overall}`;
          if (savedTeam.players[pos] === pl.player_id) {
            opt.selected = true;
          }
          select.appendChild(opt);
        });
        // Handle selection change
        select.addEventListener('change', () => {
          if (select.value) {
            savedTeam.players[pos] = parseInt(select.value);
          } else {
            delete savedTeam.players[pos];
          }
          setLocal('team', savedTeam);
        });
        selectTd.appendChild(select);
        tr.appendChild(selectTd);
        const roleTd = document.createElement('td');
        roleTd.textContent = getRecommendedRole(pos);
        tr.appendChild(roleTd);
        tableBody.appendChild(tr);
      });
    }

    // On formation change
    formationSelect.addEventListener('change', () => {
      savedTeam.formation = formationSelect.value;
      // Reset players assignments
      savedTeam.players = {};
      setLocal('team', savedTeam);
      renderTable();
    });

    // Initial render
    renderTable();
  }

  function renderBudgetPage(players) {
    const initialInput = document.getElementById('initial-budget');
    const setBudgetBtn = document.getElementById('set-budget-btn');
    const transactionForm = document.getElementById('transaction-form');
    const budgetDisplay = document.getElementById('budget-display');
    const transactionTableBody = document.getElementById('transaction-table-body');
    const playerSelect = document.getElementById('transaction-player');

    // Populate player select list
    players.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.player_id;
      opt.textContent = `${p.name} (${p.club})`;
      playerSelect.appendChild(opt);
    });

    let initialBudget = getLocal('initialBudget', 0);
    let transactions = getLocal('transactions', []);

    function computeBudget() {
      let total = initialBudget;
      transactions.forEach(tr => {
        if (tr.type === 'purchase') total -= tr.price;
        else total += tr.price;
      });
      return total;
    }

    function renderTransactions() {
      transactionTableBody.innerHTML = '';
      if (transactions.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.textContent = 'Aucune transaction enregistrée.';
        tr.appendChild(td);
        transactionTableBody.appendChild(tr);
        return;
      }
      transactions.forEach((tr, index) => {
        const row = document.createElement('tr');
        const tdIndex = document.createElement('td');
        tdIndex.textContent = index + 1;
        const tdName = document.createElement('td');
        tdName.textContent = tr.player_name;
        const tdType = document.createElement('td');
        tdType.textContent = tr.type === 'purchase' ? 'Achat' : 'Vente';
        const tdPrice = document.createElement('td');
        tdPrice.textContent = tr.price.toLocaleString('fr-FR');
        row.appendChild(tdIndex);
        row.appendChild(tdName);
        row.appendChild(tdType);
        row.appendChild(tdPrice);
        transactionTableBody.appendChild(row);
      });
    }

    function updateBudgetDisplay() {
      budgetDisplay.textContent = computeBudget().toLocaleString('fr-FR');
    }

    // Set initial budget event
    setBudgetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const value = parseInt(initialInput.value || '0');
      if (!isNaN(value)) {
        initialBudget = value;
        setLocal('initialBudget', initialBudget);
        updateBudgetDisplay();
        initialInput.value = '';
      }
    });

    // Add transaction event
    transactionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pid = parseInt(transactionForm.player.value);
      const type = transactionForm.type.value;
      const price = parseInt(transactionForm.price.value);
      if (isNaN(pid) || isNaN(price)) return;
      const player = players.find(pl => pl.player_id === pid);
      const tr = {
        player_id: pid,
        player_name: player ? player.name : 'Inconnu',
        type: type,
        price: price,
      };
      transactions.push(tr);
      setLocal('transactions', transactions);
      renderTransactions();
      updateBudgetDisplay();
      transactionForm.reset();
    });

    // Initial rendering
    updateBudgetDisplay();
    renderTransactions();
  }

  function renderTransfersPage(players) {
    const searchInput = document.getElementById('search-input');
    const posSelect = document.getElementById('search-pos');
    const playersBody = document.getElementById('players-table-body');

    // Fill position filter with unique positions
    const posSet = new Set();
    players.forEach(p => p.positions_list.forEach(pos => posSet.add(pos)));
    Array.from(posSet).sort().forEach(pos => {
      const opt = document.createElement('option');
      opt.value = pos;
      opt.textContent = pos;
      posSelect.appendChild(opt);
    });

    let transactions = getLocal('transactions', []);
    let initialBudget = getLocal('initialBudget', 0);

    // Render list based on search criteria
    function renderList() {
      const q = searchInput.value.trim().toLowerCase();
      const pos = posSelect.value;
      let filtered = players;
      if (q) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q));
      }
      if (pos) {
        filtered = filtered.filter(p => p.positions_list.includes(pos));
      }
      // Sort by overall desc
      filtered.sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));
      playersBody.innerHTML = '';
      if (filtered.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 7;
        td.textContent = 'Aucun joueur correspondant.';
        tr.appendChild(td);
        playersBody.appendChild(tr);
        return;
      }
      filtered.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${p.name}</td>
                         <td>${p.positions}</td>
                         <td>${p.overall}</td>
                         <td>${p.potential}</td>
                         <td>${p.club}</td>
                         <td>${p.value.toLocaleString('fr-FR')}</td>`;
        const actionTd = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'btn btn-success btn-sm';
        btn.textContent = 'Acheter';
        btn.addEventListener('click', () => {
          // Add purchase transaction at player's value
          const tr = {
            player_id: p.player_id,
            player_name: p.name,
            type: 'purchase',
            price: p.value,
          };
          transactions.push(tr);
          setLocal('transactions', transactions);
          alert(`Vous avez acheté ${p.name} pour ${p.value.toLocaleString('fr-FR')} €.`);
        });
        actionTd.appendChild(btn);
        row.appendChild(actionTd);
        playersBody.appendChild(row);
      });
    }

    searchInput.addEventListener('input', renderList);
    posSelect.addEventListener('change', renderList);

    // Initial render
    renderList();
  }

  // When DOM is loaded, determine which page to initialise
  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    loadPlayers().then(players => {
      if (page === 'team') {
        renderTeamPage(players);
      } else if (page === 'budget') {
        renderBudgetPage(players);
      } else if (page === 'transfers') {
        renderTransfersPage(players);
      }
    });
  });
})();