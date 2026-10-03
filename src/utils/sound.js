// Sound is deliberately opt-in. Add audio assets here later without changing UI code.
const enabled = false
const play = () => { if (!enabled) return }
export const playHoverSound = play
export const playClickSound = play
export const playPortalSound = play
export const playSpellSound = play
