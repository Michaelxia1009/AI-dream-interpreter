export interface Style {
  id: string;
  name: string;
  vibe: string;                // 1-line description shown on style card
  imagePromptSuffix: string;   // appended to scene prompt for image/video gen
  narratorVoiceId: string;     // ElevenLabs voice id (replace with real ids post-casting)
  narratorPersona: string;     // shown on style card in video mode
  moodTags: string[];          // used for style-match heuristic
}

export const STYLES: Style[] = [
  {
    id: 'ghibli-dream',
    name: 'Studio Ghibli Dream',
    vibe: 'Whimsical anime in warm, painterly light',
    imagePromptSuffix: 'in the style of Studio Ghibli, hand-painted animation cel, warm cinematic color, soft volumetric lighting',
    narratorVoiceId: 'elv_rachel_warmstoryteller',
    narratorPersona: 'Warm Storyteller',
    moodTags: ['wonder', 'nature', 'flight', 'nostalgia', 'gentle'],
  },
  {
    id: 'watercolor-memory',
    name: 'Watercolor Memory',
    vibe: 'Soft, painterly, bleeding-ink nostalgia',
    imagePromptSuffix: 'loose watercolor painting, bleeding ink edges, cream paper texture, muted palette, analog imperfection',
    narratorVoiceId: 'elv_bella_asmr',
    narratorPersona: 'Soft Whisper',
    moodTags: ['nostalgia', 'childhood', 'family', 'reflective', 'melancholy'],
  },
  {
    id: 'noir-pulp',
    name: 'Noir Pulp',
    vibe: 'High-contrast B&W cinematic tension',
    imagePromptSuffix: 'film noir black and white, deep shadows, chiaroscuro, venetian-blind light, 1940s pulp aesthetic, 35mm grain',
    narratorVoiceId: 'elv_adam_detective',
    narratorPersona: 'Gravelly Detective',
    moodTags: ['mystery', 'chase', 'tension', 'urban', 'suspense'],
  },
  {
    id: 'vhs-horror',
    name: '80s VHS Horror',
    vibe: 'Analog grain, neon, creeping unease',
    imagePromptSuffix: '1980s VHS horror aesthetic, heavy analog grain, chromatic aberration, neon magenta rim light, CRT scanlines',
    narratorVoiceId: 'elv_antoni_deep',
    narratorPersona: 'Ominous Voice',
    moodTags: ['nightmare', 'creepy', 'uncanny', 'fear', 'dark'],
  },
  {
    id: 'renaissance',
    name: 'Renaissance Painting',
    vibe: 'Oil-painting drama, gold-leaf gravitas',
    imagePromptSuffix: 'Italian Renaissance oil painting, dramatic chiaroscuro lighting, gold leaf, classical composition, museum texture',
    narratorVoiceId: 'elv_arnold_classical',
    narratorPersona: 'Classical Orator',
    moodTags: ['grand', 'mythic', 'religious', 'epic', 'heroic'],
  },
  {
    id: 'claymation',
    name: 'Claymation',
    vibe: 'Aardman-style stop-motion whimsy',
    imagePromptSuffix: 'Aardman claymation stop-motion, visible fingerprints on clay, studio lighting, slightly asymmetric handmade charm',
    narratorVoiceId: 'elv_clyde_british',
    narratorPersona: 'Playful British Narrator',
    moodTags: ['absurd', 'playful', 'weird', 'humor', 'whimsical'],
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    vibe: 'Pastel synthwave, dreamy haze',
    imagePromptSuffix: 'vaporwave aesthetic, pastel pink and cyan, checkered floors, classical statues, dreamy haze, 90s web graphics',
    narratorVoiceId: 'elv_dorothy_ethereal',
    narratorPersona: 'Ethereal Voice',
    moodTags: ['euphoric', 'floating', 'surreal', 'dreamy', 'otherworldly'],
  },
  {
    id: 'pixar-render',
    name: 'Pixar Render',
    vibe: 'Polished 3D, golden-hour warmth',
    imagePromptSuffix: 'Pixar-style 3D render, subsurface scattering, golden-hour lighting, expressive character design, Disney-Pixar aesthetic',
    narratorVoiceId: 'elv_drew_vo',
    narratorPersona: 'Warm Voiceover',
    moodTags: ['family', 'joyful', 'heroic', 'hopeful', 'adventure'],
  },
  {
    id: 'lofi-sketch',
    name: 'Lo-fi Sketch',
    vibe: 'Casual pencil and ink, the everyday',
    imagePromptSuffix: 'loose pencil sketch with ink wash, visible hatching, white margins, zine aesthetic, casual linework',
    narratorVoiceId: 'elv_josh_casual',
    narratorPersona: 'Casual Narrator',
    moodTags: ['mundane', 'quiet', 'reflective', 'everyday', 'calm'],
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    vibe: 'Blade Runner rain, neon-drenched city',
    imagePromptSuffix: 'cyberpunk neon cityscape, Blade Runner aesthetic, holographic advertisements, rain-soaked streets, volumetric neon fog',
    narratorVoiceId: 'elv_ethan_synth',
    narratorPersona: 'Synthetic Voice',
    moodTags: ['urban', 'tech', 'dystopian', 'dark', 'future'],
  },
];

export const getStyleById = (id: string): Style | undefined =>
  STYLES.find(s => s.id === id);

export const listStyleIds = (): string[] => STYLES.map(s => s.id);
