/**
 * The fixtures are a fixed scene, not a live feed. Every relative label in the app
 * ("Tonight", "4m", "In 2 days") is computed against this instant instead of `Date.now()`.
 *
 * Why: the reference screens specify copy like "Tonight 7:00 PM" and "NEO-SOUL SESSION · FRI".
 * Anchoring to a real clock would make that copy drift and would desync server and client
 * rendering. When a backend lands, this is the one constant to replace with `Date.now()`.
 *
 * 2026-08-28 is a Friday. 15:00 in America/New_York — an afternoon, with tonight's jam ahead.
 */
export const NOW = '2026-08-28T15:00:00-04:00'
