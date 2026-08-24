// Placeholder for auth.uid() until real auth is wired in. Every row still
// carries this so turning on Supabase Auth later is a config change, not a
// schema change (spec Section 1: "solo-first, scale-ready").
export const LOCAL_USER_ID = 'local-user';
