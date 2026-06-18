/**
 * ═══════════════════════════════════════════════════════════════════
 * PROGRESSION ENGINE — Neurovascular Dynamic Lab
 * ═══════════════════════════════════════════════════════════════════
 * Single source of truth for all XP, streak, deck, quiz, module,
 * certificate, and league logic.
 *
 * Import in any page:
 *   import { awardXP, updateStreak, completeDeck, ... } from './progressionEngine.js';
 *
 * RULES (never change these without updating the spec):
 *   +5  XP — Daily login (once per calendar day)
 *   +10 XP — Flashcard deck completed (once per deck)
 *   +10 XP — Mini quiz passed (once per module)
 *   +20 XP — Full module completed (notes + deck + quiz all done)
 *   +100 XP — Final exam passed ≥70% (once per course)
 *   ❌  No XP for: opening pages, flipping cards, re-completing items
 * ═══════════════════════════════════════════════════════════════════
 */

import {
  db,
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, query, where,
  increment, arrayUnion
} from './firebase-config.js';

// ── Internal cache (one per page session) ─────────────────────────
let _userCache = null;
let _cachedUserId = null;

// ═══════════════════════════════════════════════════════════════════
// SECTION 1: USER PROGRESS LOADING
// ═══════════════════════════════════════════════════════════════════

/**
 * Load (or return cached) user progress document.
 * Always call this before any other function if you need fresh data.
 */
export async function getUserProgress(userId, forceRefresh = false) {
  if (_cachedUserId === userId && _userCache && !forceRefresh) {
    return _userCache;
  }
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      _userCache = snap.data();
      _cachedUserId = userId;
      return _userCache;
    } else {
      // Document missing — create minimal profile (safety net)
      const minimal = buildEmptyProfile('', '');
      await setDoc(doc(db, 'users', userId), minimal);
      _userCache = minimal;
      _cachedUserId = userId;
      return minimal;
    }
  } catch (err) {
    console.error('[ProgressionEngine] getUserProgress error:', err);
    return _userCache || {};
  }
}

/**
 * Invalidate the in-memory cache (call after any write).
 */
export function invalidateCache() {
  _userCache = null;
  _cachedUserId = null;
}

/**
 * Build an empty user profile document (used at signup and as fallback).
 */
export function buildEmptyProfile(email, displayName) {
  return {
    email,
    displayName: displayName || '',
    createdAt: new Date().toISOString(),
    xp_total: 0,
    xp_cycle: 0,
    streak: 0,
    lastActiveDate: null,
    league: 'Bronze',
    leaguePromotionDate: null,
    current_course: null,
    current_module: null,
    completedModules: [],
    completedDecks: {},
    completedNotes: {},
    moduleQuizScores: {},
    examScores: {},
    certificates: [],
    learnedCardIds: [],
    quizScores: [],
    lastQuizScore: null,
    lastQuizDate: null
  };
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 2: STREAK SYSTEM
// ═══════════════════════════════════════════════════════════════════

/**
 * Update the user's streak. Must be called any time a learning
 * action is completed (deck, quiz, module, daily login).
 * Only updates once per calendar day.
 */
export async function updateStreak(userId) {
  const data = await getUserProgress(userId);
  const today = _todayStr();
  const yesterday = _yesterdayStr();

  if (data.lastActiveDate === today) return; // Already counted today

  const newStreak = data.lastActiveDate === yesterday
    ? (data.streak || 0) + 1
    : 1; // Streak broken — restart at 1

  await updateDoc(doc(db, 'users', userId), {
    streak: newStreak,
    lastActiveDate: today
  });

  // Update cache
  if (_userCache) {
    _userCache.streak = newStreak;
    _userCache.lastActiveDate = today;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 3: XP SYSTEM
// ═══════════════════════════════════════════════════════════════════

/**
 * Award XP to a user. Both xp_total and xp_cycle increase.
 * Always call updateStreak separately.
 * @param {string} userId
 * @param {number} amount  — must be positive integer
 * @param {string} reason  — shown in toast notification
 */
export async function awardXP(userId, amount, reason) {
  if (!amount || amount <= 0) return;
  try {
    await updateDoc(doc(db, 'users', userId), {
      xp_total: increment(amount),
      xp_cycle: increment(amount)
    });
    // Update cache
    if (_userCache) {
      _userCache.xp_total = (_userCache.xp_total || 0) + amount;
      _userCache.xp_cycle = (_userCache.xp_cycle || 0) + amount;
    }
    showXPToast(`+${amount} XP — ${reason}`);
  } catch (err) {
    console.error('[ProgressionEngine] awardXP error:', err);
  }
}

/**
 * Check and award the daily login bonus (+5 XP).
 * Call once on index.html / learn.html page load.
 */
export async function checkDailyLogin(userId) {
  const data = await getUserProgress(userId);
  const today = _todayStr();
  if (data.lastActiveDate === today) return false; // Already done today
  await awardXP(userId, 5, 'Daily Login');
  await updateStreak(userId);
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 4: NOTES COMPLETION
// ═══════════════════════════════════════════════════════════════════

/**
 * Mark the notes for a module as read.
 * No XP awarded for reading notes — it's a prerequisite step only.
 * @returns {boolean} true if this was the first time
 */
export async function markNotesRead(userId, moduleId) {
  const data = await getUserProgress(userId);
  if (data.completedNotes?.[moduleId]) return false; // Already done

  await updateDoc(doc(db, 'users', userId), {
    [`completedNotes.${moduleId}`]: { completedAt: new Date().toISOString() }
  });
  if (_userCache) {
    _userCache.completedNotes = _userCache.completedNotes || {};
    _userCache.completedNotes[moduleId] = { completedAt: new Date().toISOString() };
  }
  return true;
}

/**
 * Check if notes are marked read for a module.
 */
export function hasNotesRead(userId, moduleId) {
  return !!_userCache?.completedNotes?.[moduleId];
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 5: FLASHCARD DECK COMPLETION
// ═══════════════════════════════════════════════════════════════════

/**
 * Mark a flashcard deck as completed and award +10 XP.
 * XP is only awarded ONCE per deck, ever.
 * @param {string} userId
 * @param {string} deckId   — flashcardDecks document ID
 * @param {string} moduleId — the minorSegment this deck belongs to
 * @returns {boolean} true if this was the first completion (XP awarded)
 */
export async function completeDeck(userId, deckId, moduleId) {
  const data = await getUserProgress(userId);
  if (data.completedDecks?.[deckId]) return false; // Already completed — no XP

  await updateDoc(doc(db, 'users', userId), {
    [`completedDecks.${deckId}`]: {
      completedAt: new Date().toISOString(),
      moduleId,
      xpAwarded: true
    },
    xp_total: increment(10),
    xp_cycle: increment(10)
  });
  await updateStreak(userId);

  if (_userCache) {
    _userCache.completedDecks = _userCache.completedDecks || {};
    _userCache.completedDecks[deckId] = { completedAt: new Date().toISOString(), moduleId, xpAwarded: true };
    _userCache.xp_total = (_userCache.xp_total || 0) + 10;
    _userCache.xp_cycle = (_userCache.xp_cycle || 0) + 10;
  }

  showXPToast('+10 XP — Flashcard Deck Complete! 🃏');
  return true;
}

/**
 * Check if a deck has been completed by this user.
 */
export function hasDeckCompleted(deckId) {
  return !!_userCache?.completedDecks?.[deckId];
}

/**
 * Check if ANY deck linked to a module has been completed.
 */
export function hasModuleDeckCompleted(moduleId) {
  const decks = _userCache?.completedDecks || {};
  return Object.values(decks).some(d => d.moduleId === moduleId);
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 6: MINI QUIZ COMPLETION
// ═══════════════════════════════════════════════════════════════════

/**
 * Record a mini quiz result and award +10 XP on first pass.
 * @param {string} userId
 * @param {string} moduleId
 * @param {number} score       — percentage 0–100
 * @param {boolean} passed     — typically score >= 60
 * @returns {boolean} true if XP was awarded (first pass)
 */
export async function completeMiniQuiz(userId, moduleId, score, passed = true) {
  const data = await getUserProgress(userId);
  const alreadyPassed = data.moduleQuizScores?.[moduleId]?.passed;
  if (alreadyPassed) return false; // XP already given

  const updates = {
    [`moduleQuizScores.${moduleId}`]: {
      score,
      passed,
      completedAt: new Date().toISOString()
    }
  };

  if (passed) {
    updates.xp_total = increment(10);
    updates.xp_cycle = increment(10);
  }

  await updateDoc(doc(db, 'users', userId), updates);

  if (passed) {
    await updateStreak(userId);
    if (_userCache) {
      _userCache.xp_total = (_userCache.xp_total || 0) + 10;
      _userCache.xp_cycle = (_userCache.xp_cycle || 0) + 10;
    }
    showXPToast('+10 XP — Mini Quiz Passed! 🎯');
  }

  if (_userCache) {
    _userCache.moduleQuizScores = _userCache.moduleQuizScores || {};
    _userCache.moduleQuizScores[moduleId] = { score, passed, completedAt: new Date().toISOString() };
  }

  return passed;
}

/**
 * Check if the mini quiz for a module has been passed.
 */
export function hasQuizPassed(moduleId) {
  return !!_userCache?.moduleQuizScores?.[moduleId]?.passed;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 7: MODULE COMPLETION
// ═══════════════════════════════════════════════════════════════════

/**
 * Check all 3 prerequisites and complete a module if ready.
 * Called automatically after each step completes.
 *
 * Prerequisites:
 *   1. Notes marked as read
 *   2. At least one deck for this module completed
 *   3. Mini quiz passed
 *
 * On completion: +20 XP, next module unlocked, current_module updated.
 *
 * @param {string} userId
 * @param {string} courseId   — majorSegment ID
 * @param {string} moduleId   — minorSegment ID
 * @param {string|null} nextModuleId — ID of next module (null if last)
 * @returns {boolean} true if module was just completed
 */
export async function checkAndCompleteModule(userId, courseId, moduleId, nextModuleId) {
  const data = await getUserProgress(userId);

  // Check: already complete?
  const alreadyDone = (data.completedModules || []).some(m => m.moduleId === moduleId);
  if (alreadyDone) return false;

  // Check all 3 gates
  const notesOK = !!data.completedNotes?.[moduleId];
  const deckOK  = Object.values(data.completedDecks || {}).some(d => d.moduleId === moduleId);
  const quizOK  = !!data.moduleQuizScores?.[moduleId]?.passed;

  if (!notesOK || !deckOK || !quizOK) return false; // Not ready yet

  // All gates passed — complete the module
  const completionRecord = {
    courseId,
    moduleId,
    completedAt: new Date().toISOString()
  };

  const updates = {
    completedModules: arrayUnion(completionRecord),
    xp_total: increment(20),
    xp_cycle: increment(20),
    current_module: nextModuleId || null
  };

  await updateDoc(doc(db, 'users', userId), updates);
  await updateStreak(userId);

  if (_userCache) {
    _userCache.completedModules = [...(data.completedModules || []), completionRecord];
    _userCache.xp_total = (_userCache.xp_total || 0) + 20;
    _userCache.xp_cycle = (_userCache.xp_cycle || 0) + 20;
    _userCache.current_module = nextModuleId || null;
  }

  const msg = nextModuleId
    ? '+20 XP — Module Complete! Next module unlocked 🔓'
    : '+20 XP — Module Complete! Course exam unlocked 🏆';
  showXPToast(msg);
  return true;
}

/**
 * Check if a specific module has been completed.
 */
export function isModuleComplete(moduleId) {
  return (_userCache?.completedModules || []).some(m => m.moduleId === moduleId);
}

/**
 * Determine if a module should be unlocked for a user.
 * Module is unlocked if:
 *   - It's the first module (order === 1), OR
 *   - The previous module (order - 1) in the same course is complete
 *
 * @param {number} moduleOrder      — the module's order field
 * @param {string} courseId         — majorSegment ID
 * @param {object[]} allMinors      — all minorSegments for this course [{id, order}]
 */
export function isModuleUnlocked(moduleOrder, courseId, allMinors) {
  if (moduleOrder <= 1) return true; // First module always open

  const completedIds = (_userCache?.completedModules || [])
    .filter(m => m.courseId === courseId)
    .map(m => m.moduleId);

  // Find the module with order === moduleOrder - 1
  const prevModule = allMinors.find(m => m.order === moduleOrder - 1);
  if (!prevModule) return true; // No predecessor found — unlock it

  return completedIds.includes(prevModule.id);
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 8: FINAL EXAM + CERTIFICATE
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if a user has completed all modules in a course.
 * Used to determine if the final exam should be unlocked.
 *
 * @param {string} courseId
 * @param {string[]} allModuleIds   — all minorSegment IDs for this course
 */
export function isCourseExamUnlocked(courseId, allModuleIds) {
  const completedIds = (_userCache?.completedModules || [])
    .filter(m => m.courseId === courseId)
    .map(m => m.moduleId);
  return allModuleIds.every(id => completedIds.includes(id));
}

/**
 * Submit a final exam result. Awards +100 XP and issues a certificate
 * if score >= passThreshold (default 70%).
 *
 * @param {string} userId
 * @param {string} courseId
 * @param {string} courseName
 * @param {number} score           — percentage 0–100
 * @param {number} passThreshold   — default 70
 * @returns {{ passed: boolean, certId: string|null }}
 */
export async function submitFinalExam(userId, courseId, courseName, score, passThreshold = 70) {
  const data = await getUserProgress(userId);

  // Already passed — don't re-award
  if (data.examScores?.[courseId]?.passed) {
    return { passed: true, certId: data.examScores[courseId].certId || null };
  }

  const passed = score >= passThreshold;

  if (!passed) {
    // Record the attempt but don't award XP or certificate
    await updateDoc(doc(db, 'users', userId), {
      [`examScores.${courseId}`]: {
        score,
        passed: false,
        lastAttempt: new Date().toISOString()
      }
    });
    return { passed: false, certId: null };
  }

  // PASSED — award XP + certificate
  const certId = _generateId();
  const cert = {
    userId,
    courseId,
    courseName,
    score,
    date: new Date().toISOString(),
    certId
  };

  // Write certificate document
  await setDoc(doc(db, 'certificates', certId), cert);

  // Update user document
  await updateDoc(doc(db, 'users', userId), {
    certificates: arrayUnion(cert),
    [`examScores.${courseId}`]: {
      score,
      passed: true,
      certId,
      completedAt: cert.date
    },
    xp_total: increment(100),
    xp_cycle: increment(100)
  });
  await updateStreak(userId);

  if (_userCache) {
    _userCache.certificates = [...(data.certificates || []), cert];
    _userCache.examScores = { ...data.examScores, [courseId]: { score, passed: true, certId, completedAt: cert.date } };
    _userCache.xp_total = (_userCache.xp_total || 0) + 100;
    _userCache.xp_cycle = (_userCache.xp_cycle || 0) + 100;
  }

  showXPToast('+100 XP — Course Complete! Certificate Issued! 🏆🎓');
  return { passed: true, certId };
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 9: LEAGUE UTILITIES
// ═══════════════════════════════════════════════════════════════════

const LEAGUE_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const LEAGUE_BADGES = {
  'Bronze':   '🥉 Bronze',
  'Silver':   '🥈 Silver',
  'Gold':     '🥇 Gold',
  'Platinum': '💎 Platinum',
  'Diamond':  '💠 Diamond'
};

export function getLeagueBadge(league) {
  return LEAGUE_BADGES[league] || '🥉 Bronze';
}

export function getLeagueColor(league) {
  const colors = {
    'Bronze': '#CD7F32', 'Silver': '#C0C0C0',
    'Gold': '#FFD700', 'Platinum': '#22D3EE', 'Diamond': '#8B5CF6'
  };
  return colors[league] || '#CD7F32';
}

/**
 * Promote or demote a league tier by delta steps.
 * @param {string} currentLeague
 * @param {number} delta  — positive = promote, negative = demote
 */
export function adjustLeague(currentLeague, delta) {
  const idx = LEAGUE_ORDER.indexOf(currentLeague);
  if (idx < 0) return 'Bronze';
  const newIdx = Math.max(0, Math.min(LEAGUE_ORDER.length - 1, idx + delta));
  return LEAGUE_ORDER[newIdx];
}

/**
 * Admin-callable: evaluate league cycle.
 * Reads all users, sorts by xp_cycle, promotes/demotes, resets xp_cycle.
 * Returns a summary for display.
 *
 * @param {object[]} users — [{userId, xp_cycle, league, email}]
 * @returns {object} evaluation result
 */
export function evaluateLeagueCycle(users) {
  if (!users.length) return { promoted: [], stayed: [], demoted: [] };

  const sorted = [...users].sort((a, b) => (b.xp_cycle || 0) - (a.xp_cycle || 0));
  const total = sorted.length;

  const promoteCount = Math.max(1, Math.floor(total * 0.10)); // Top 10%
  const demoteCount  = Math.max(1, Math.floor(total * 0.25)); // Bottom 25%

  const promoted = [];
  const demoted  = [];
  const stayed   = [];

  sorted.forEach((user, idx) => {
    if (idx < promoteCount) {
      promoted.push({ ...user, newLeague: adjustLeague(user.league, +1) });
    } else if (idx >= total - demoteCount) {
      demoted.push({ ...user, newLeague: adjustLeague(user.league, -1) });
    } else {
      stayed.push({ ...user, newLeague: user.league });
    }
  });

  return { promoted, stayed, demoted };
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 10: PROGRESS SUMMARY (for dashboard display)
// ═══════════════════════════════════════════════════════════════════

/**
 * Get a summary of user's progress for dashboard display.
 * @returns {object} — all stats ready for UI injection
 */
export function getProgressSummary() {
  const d = _userCache || {};
  return {
    xpTotal:          d.xp_total || 0,
    xpCycle:          d.xp_cycle || 0,
    streak:           d.streak || 0,
    league:           d.league || 'Bronze',
    leagueBadge:      getLeagueBadge(d.league || 'Bronze'),
    leagueColor:      getLeagueColor(d.league || 'Bronze'),
    completedModules: (d.completedModules || []).length,
    completedDecks:   Object.keys(d.completedDecks || {}).length,
    certificates:     (d.certificates || []).length,
    currentCourse:    d.current_course || null,
    currentModule:    d.current_module || null,
    cardsLearned:     (d.learnedCardIds || []).length,
    lastQuizScore:    d.lastQuizScore || null
  };
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 11: MODULE STEP STATUS (for learn.html UI)
// ═══════════════════════════════════════════════════════════════════

/**
 * Get the completion status of all 3 steps for a module.
 * Used to render the step indicators in learn.html.
 *
 * @param {string} moduleId
 * @returns {{ notes: boolean, deck: boolean, quiz: boolean, allDone: boolean }}
 */
export function getModuleStepStatus(moduleId) {
  const d = _userCache || {};
  const notes = !!d.completedNotes?.[moduleId];
  const deck  = Object.values(d.completedDecks || {}).some(dd => dd.moduleId === moduleId);
  const quiz  = !!d.moduleQuizScores?.[moduleId]?.passed;
  const full  = (_userCache?.completedModules || []).some(m => m.moduleId === moduleId);
  return { notes, deck, quiz, allDone: full };
}

// ═══════════════════════════════════════════════════════════════════
// PRIVATE HELPERS
// ═══════════════════════════════════════════════════════════════════

function _todayStr() {
  return new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
}

function _yesterdayStr() {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0];
}

function _generateId() {
  // Use crypto.randomUUID if available (modern browsers), else fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ── XP Toast UI helper ─────────────────────────────────────────────
function showXPToast(message) {
  // Remove any existing toast first
  const existing = document.getElementById('xp-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'xp-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 99999;
    background: linear-gradient(135deg, #10B981, #059669);
    color: white;
    padding: 14px 22px;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 0.92rem;
    box-shadow: 0 8px 30px rgba(16, 185, 129, 0.45);
    transform: translateX(110%);
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    max-width: 280px;
    line-height: 1.4;
    pointer-events: none;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });
  });

  // Animate out then remove
  setTimeout(() => {
    toast.style.transform = 'translateX(110%)';
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}
