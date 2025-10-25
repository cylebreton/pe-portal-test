/**
 * Morpion (Tic-Tac-Toe) Plugin
 * - Page de jeu Morpion
 * - Widget de score pour le dashboard
 */

const { ref, computed, onMounted, onUnmounted } = window.Vue || {};

let context;
try {
  const usePluginContext = window.usePluginContext;
  if (usePluginContext) {
    context = usePluginContext('morpion-plugin');
  } else {
    console.warn('Plugin context not available - using mock');
    context = {
      showSuccess: console.log,
      showInfo: console.log,
      showWarning: console.log,
      showError: console.error,
      getPluginData: () => null,
      setPluginData: () => {},
      emitEvent: () => {},
      onEvent: () => () => {},
      currentUser: { value: { firstName: 'User' } },
      isAuthenticated: { value: true }
    };
  }
} catch (e) {
  console.error('Failed to get plugin context:', e);
}

// ============================================================================
// PAGE: Morpion (route: /plugins/morpion)
// ============================================================================

const MorpionPlugin = {
  name: 'MorpionPlugin',
  setup() {
    const winningCombos = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    const board = ref(Array(9).fill(''));
    const currentPlayer = ref('X');
    const gameOver = ref(false);
    const winner = ref(null);
    const moves = ref(0);

    const message = computed(() => {
      if (gameOver.value) {
        return winner.value ? `Gagnant: ${winner.value}` : 'Match nul';
      }
      return `Au tour de ${currentPlayer.value}`;
    });

    const readScores = () => {
      return (
        context.getPluginData('scores') || { X: 0, O: 0, draws: 0 }
      );
    };

    const writeScores = (scores) => {
      context.setPluginData('scores', scores);
      if (context.emitEvent) {
        context.emitEvent('morpion:score-updated', { scores });
      }
    };

    const updateScores = (winnerSymbol) => {
      const scores = readScores();
      if (winnerSymbol === 'X') scores.X += 1;
      else if (winnerSymbol === 'O') scores.O += 1;
      else scores.draws += 1;
      writeScores(scores);
    };

    const checkWin = () => {
      for (const [a,b,c] of winningCombos) {
        if (board.value[a] && board.value[a] === board.value[b] && board.value[a] === board.value[c]) {
          return board.value[a];
        }
      }
      return null;
    };

    const play = (idx) => {
      if (gameOver.value || board.value[idx]) return;
      board.value[idx] = currentPlayer.value;
      moves.value += 1;
      const w = checkWin();
      if (w) {
        winner.value = w;
        gameOver.value = true;
        updateScores(w);
        context.showSuccess?.('Partie terminée', `Gagnant: ${w}`);
        return;
      }
      if (moves.value === 9) {
        gameOver.value = true;
        updateScores(null);
        context.showInfo?.('Match nul', 'Aucun gagnant cette fois.');
        return;
      }
      currentPlayer.value = currentPlayer.value === 'X' ? 'O' : 'X';
    };

    const reset = () => {
      board.value = Array(9).fill('');
      gameOver.value = false;
      winner.value = null;
      moves.value = 0;
      // Optionnel: alterner le joueur de départ
      const start = context.getPluginData('settings')?.startingPlayer || 'X';
      currentPlayer.value = start === 'O' ? 'O' : 'X';
    };

    onMounted(() => {
      // Init joueur de départ
      const start = context.getPluginData('settings')?.startingPlayer || 'X';
      currentPlayer.value = start === 'O' ? 'O' : 'X';
    });

    return { board, currentPlayer, gameOver, winner, message, play, reset };
  },

  template: `
    <div class="space-y-6">
      <div class="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-lg shadow-lg text-white p-6">
        <h1 class="text-2xl font-bold">Morpion</h1>
        <p class="text-blue-100">{{ message }}</p>
      </div>

      <div class="grid grid-cols-3 gap-2 w-72 select-none">
        <button
          v-for="(cell, i) in board"
          :key="i"
          @click="play(i)"
          class="h-20 text-3xl font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 focus:outline-none"
        >{{ cell }}</button>
      </div>

      <div class="flex items-center space-x-3">
        <button @click="reset" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Nouvelle partie
        </button>
      </div>
    </div>
  `
};

// ============================================================================
// WIDGET: Scoreboard
// ============================================================================

const ScoreboardWidget = {
  name: 'ScoreboardWidget',
  setup() {
    const scores = ref({ X: 0, O: 0, draws: 0 });
    let off;

    const refresh = () => {
      const s = context.getPluginData('scores');
      scores.value = s || { X: 0, O: 0, draws: 0 };
    };

    const resetScores = () => {
      const zero = { X: 0, O: 0, draws: 0 };
      context.setPluginData('scores', zero);
      if (context.emitEvent) {
        context.emitEvent('morpion:score-updated', { scores: zero });
      }
      context.showInfo?.('Scores réinitialisés', 'Le tableau des scores a été remis à zéro.');
      refresh();
    };

    onMounted(() => {
      refresh();
      if (context.onEvent) {
        off = context.onEvent('morpion:score-updated', refresh);
      }
    });
    onUnmounted(() => { if (off) off(); });

    return { scores, resetScores };
  },
  template: `
    <div class="bg-white rounded-lg shadow-lg border border-gray-100 p-5">
      <h2 class="text-lg font-semibold mb-3 flex items-center">
        <i class="pi pi-chart-bar mr-2 text-indigo-600"></i>
        Score Morpion
      </h2>
      <div class="grid grid-cols-3 text-center">
        <div>
          <div class="text-sm text-gray-500">X</div>
          <div class="text-2xl font-bold">{{ scores.X }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">O</div>
          <div class="text-2xl font-bold">{{ scores.O }}</div>
        </div>
        <div>
          <div class="text-sm text-gray-500">Nuls</div>
          <div class="text-2xl font-bold">{{ scores.draws }}</div>
        </div>
      </div>
      <button @click="resetScores" class="mt-4 w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700">
        Réinitialiser le score
      </button>
    </div>
  `
};
