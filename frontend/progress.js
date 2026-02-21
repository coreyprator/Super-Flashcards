// progress.js — Sprint 9 (SF-007): Progress Dashboard
// Fetches stats from /api/study/stats and /api/study/progress, renders them.

(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────
  window.initProgressDashboard = async function () {
    const container = document.getElementById('progress-mode');
    if (!container) return;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center gap-3 mb-6">
          <span class="text-3xl">📊</span>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Learning Progress</h2>
            <p class="text-sm text-gray-500">Your spaced repetition stats</p>
          </div>
        </div>

        <div id="progress-loading" class="text-center py-12 text-gray-400">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p>Loading your stats...</p>
        </div>

        <div id="progress-content" class="hidden">
          <!-- Summary Cards Row -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" id="stat-cards"></div>

          <!-- Mastery + Streak row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <!-- Mastery distribution -->
            <div class="bg-white rounded-xl shadow-sm border p-5">
              <h3 class="font-semibold text-gray-700 mb-3">Mastery Distribution</h3>
              <div id="mastery-bars" class="space-y-2"></div>
            </div>
            <!-- Streak & misc -->
            <div class="bg-white rounded-xl shadow-sm border p-5">
              <h3 class="font-semibold text-gray-700 mb-3">Activity Highlights</h3>
              <div id="activity-highlights" class="space-y-3"></div>
            </div>
          </div>

          <!-- Reviews per day bar chart -->
          <div class="bg-white rounded-xl shadow-sm border p-5 mb-6">
            <h3 class="font-semibold text-gray-700 mb-3">Reviews (Last 30 Days)</h3>
            <div id="reviews-chart" class="overflow-x-auto"></div>
          </div>

          <!-- By language table -->
          <div class="bg-white rounded-xl shadow-sm border p-5 mb-4">
            <h3 class="font-semibold text-gray-700 mb-3">By Language</h3>
            <div id="language-breakdown"></div>
          </div>

          <p class="text-xs text-gray-400 text-center pb-4">
            Stats update after each study session · Streak resets if you miss a day
          </p>
        </div>

        <div id="progress-error" class="hidden text-center py-10 text-red-500">
          <p class="text-lg">⚠️ Could not load progress data.</p>
          <p class="text-sm mt-1">Make sure you're connected and try again.</p>
        </div>
      </div>
    `;

    await loadProgressData();
  };

  // ─────────────────────────────────────────────
  // Load data
  // ─────────────────────────────────────────────
  async function loadProgressData() {
    try {
      const [stats, progress] = await Promise.all([
        fetch('/api/study/stats').then(r => r.json()),
        fetch('/api/study/progress').then(r => r.json()),
      ]);

      document.getElementById('progress-loading').classList.add('hidden');
      document.getElementById('progress-content').classList.remove('hidden');

      renderStatCards(stats);
      renderMasteryBars(stats);
      renderActivityHighlights(stats);
      renderReviewsChart(progress.reviews_last_30_days || []);
      renderLanguageBreakdown(stats.by_language || []);
    } catch (err) {
      console.error('[Progress] Failed to load:', err);
      document.getElementById('progress-loading').classList.add('hidden');
      document.getElementById('progress-error').classList.remove('hidden');
    }
  }

  // ─────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────
  function renderStatCards(stats) {
    const cards = [
      { label: 'Total Cards', value: stats.total_cards || 0, icon: '🃏', color: 'indigo' },
      { label: 'Due Today', value: stats.due_today || 0, icon: '📅', color: stats.due_today > 0 ? 'orange' : 'green' },
      { label: 'Mastered', value: stats.mastered || 0, icon: '⭐', color: 'green' },
      { label: 'Streak', value: (stats.streak_days || 0) + (stats.streak_days === 1 ? ' day' : ' days'), icon: '🔥', color: 'red' },
    ];
    document.getElementById('stat-cards').innerHTML = cards.map(c => `
      <div class="bg-white rounded-xl shadow-sm border p-4 text-center">
        <div class="text-2xl mb-1">${c.icon}</div>
        <div class="text-2xl font-bold text-${c.color}-600">${c.value}</div>
        <div class="text-xs text-gray-500 mt-1">${c.label}</div>
      </div>
    `).join('');
  }

  function renderMasteryBars(stats) {
    const total = stats.total_cards || 1;
    const levels = [
      { label: 'New', count: stats.new_cards || 0, color: 'bg-gray-300' },
      { label: 'Learning (1-3)', count: stats.learning || 0, color: 'bg-yellow-400' },
      { label: 'Familiar (4-10)', count: stats.familiar || 0, color: 'bg-blue-400' },
      { label: 'Mastered (10+)', count: stats.mastered || 0, color: 'bg-green-500' },
    ];
    document.getElementById('mastery-bars').innerHTML = levels.map(l => {
      const pct = Math.round((l.count / total) * 100);
      return `
        <div>
          <div class="flex justify-between text-xs text-gray-600 mb-1">
            <span>${l.label}</span>
            <span>${l.count} (${pct}%)</span>
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="${l.color} h-full rounded-full transition-all" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderActivityHighlights(stats) {
    const ef = stats.avg_ease_factor ? stats.avg_ease_factor.toFixed(2) : '—';
    const items = [
      { icon: '📖', label: 'Total review sessions', value: stats.total_sessions || 0 },
      { icon: '🧠', label: 'Average ease factor', value: ef },
      { icon: '⏰', label: 'Overdue cards', value: stats.overdue || 0 },
    ];
    document.getElementById('activity-highlights').innerHTML = items.map(i => `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span class="text-sm text-gray-600">${i.icon} ${i.label}</span>
        <span class="font-semibold text-gray-900">${i.value}</span>
      </div>
    `).join('');
  }

  function renderReviewsChart(reviews) {
    if (!reviews || reviews.length === 0) {
      document.getElementById('reviews-chart').innerHTML = `
        <p class="text-sm text-gray-400 text-center py-4">No reviews yet — go study some cards! 📚</p>
      `;
      return;
    }

    const maxCount = Math.max(...reviews.map(r => r.count), 1);
    const bars = reviews.map(r => {
      const h = Math.max(4, Math.round((r.count / maxCount) * 80));
      const label = r.date.slice(5); // MM-DD
      return `
        <div class="flex flex-col items-center group" title="${r.date}: ${r.count} reviews">
          <div class="text-xs text-gray-400 mb-1 opacity-0 group-hover:opacity-100 transition">${r.count}</div>
          <div class="w-5 bg-indigo-400 hover:bg-indigo-600 rounded-sm transition-colors cursor-default"
               style="height:${h}px"></div>
          <div class="text-xs text-gray-300 mt-1 rotate-45 origin-left" style="font-size:9px">${label}</div>
        </div>
      `;
    }).join('');

    document.getElementById('reviews-chart').innerHTML = `
      <div class="flex items-end gap-1 min-h-[100px] px-2 pb-6">${bars}</div>
    `;
  }

  function renderLanguageBreakdown(langs) {
    if (!langs || langs.length === 0) {
      document.getElementById('language-breakdown').innerHTML = `<p class="text-sm text-gray-400">No data yet.</p>`;
      return;
    }
    const rows = langs.map(l => {
      const pct = l.total > 0 ? Math.round((l.mastered / l.total) * 100) : 0;
      return `
        <tr class="border-b last:border-0">
          <td class="py-2 font-medium text-gray-700">${l.language}</td>
          <td class="py-2 text-gray-500 text-center">${l.total}</td>
          <td class="py-2 text-green-600 text-center font-medium">${l.mastered}</td>
          <td class="py-2 w-32">
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div class="bg-green-400 h-full rounded-full" style="width:${pct}%"></div>
            </div>
          </td>
          <td class="py-2 text-xs text-gray-400 text-right">${pct}%</td>
        </tr>
      `;
    }).join('');

    document.getElementById('language-breakdown').innerHTML = `
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b text-xs text-gray-400 uppercase">
            <th class="py-2 text-left">Language</th>
            <th class="py-2 text-center">Total</th>
            <th class="py-2 text-center">Mastered</th>
            <th class="py-2 text-left pl-2">Progress</th>
            <th class="py-2 text-right"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

})();
