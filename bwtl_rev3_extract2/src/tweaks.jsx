// Tweaks panel — exposes the most interesting design knobs the user might want
// to play with: layout, panel ordering, chat dock position, accent hue,
// AND a few NEW interesting variations (xlink style, etymology layout, fun-fact density).

function BwtlTweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection title="Layout">
        <TweakRadio
          tweak="density"
          label="Density"
          options={[
            ['compact', 'Compact'],
            ['regular', 'Regular'],
            ['comfy',   'Comfy'],
          ]}
          value={tweaks.density}
          onChange={(v) => setTweak('density', v)}
        />
        <TweakRadio
          tweak="railWidth"
          label="Right rail width"
          options={[
            ['narrow', 'Narrow'],
            ['standard', 'Standard'],
            ['wide', 'Wide'],
          ]}
          value={tweaks.railWidth}
          onChange={(v) => setTweak('railWidth', v)}
        />
        <TweakToggle
          tweak="railVisible"
          label="Show right rail"
          value={tweaks.railVisible}
          onChange={(v) => setTweak('railVisible', v)}
        />
      </TweakSection>

      <TweakSection title="Chat dock">
        <TweakRadio
          tweak="chatPosition"
          label="Chat dock position"
          options={[
            ['bottom-center', 'Bottom (center)'],
            ['bottom-right',  'Bottom-right'],
            ['side-right',    'Right side'],
          ]}
          value={tweaks.chatPosition}
          onChange={(v) => setTweak('chatPosition', v)}
        />
        <TweakToggle
          tweak="chatPersistThreads"
          label="Show thread rail when expanded"
          value={tweaks.chatPersistThreads}
          onChange={(v) => setTweak('chatPersistThreads', v)}
        />
      </TweakSection>

      <TweakSection title="Cross-app integration cues">
        <TweakRadio
          tweak="xlinkStyle"
          label="Drill-down link style"
          options={[
            ['tinted',     'Tinted bg'],
            ['underline',  'Underline only'],
            ['tag-pill',   'Source-tag pill'],
          ]}
          value={tweaks.xlinkStyle}
          onChange={(v) => setTweak('xlinkStyle', v)}
        />
        <TweakToggle
          tweak="panelGlow"
          label="Panel glow on drill-down"
          value={tweaks.panelGlow}
          onChange={(v) => setTweak('panelGlow', v)}
        />
        <TweakToggle
          tweak="showSourceTags"
          label="Source tags inside xlinks (PIE / EM / RAG …)"
          value={tweaks.showSourceTags}
          onChange={(v) => setTweak('showSourceTags', v)}
        />
      </TweakSection>

      <TweakSection title="Theme">
        <TweakColor
          tweak="accent"
          label="Primary accent"
          value={tweaks.accent}
          onChange={(v) => setTweak('accent', v)}
          options={[
            'oklch(70% 0.17 295)', // default purple
            'oklch(72% 0.16 230)', // blue
            'oklch(74% 0.15 65)',  // amber
            'oklch(74% 0.14 175)', // teal
            'oklch(72% 0.18 350)', // magenta
          ]}
        />
        <TweakRadio
          tweak="theme"
          label="Theme"
          options={[
            ['dark', 'Dark'],
            ['light', 'Light (preview)'],
          ]}
          value={tweaks.theme}
          onChange={(v) => setTweak('theme', v)}
        />
      </TweakSection>

      <TweakSection title="Word card variations">
        <TweakRadio
          tweak="etymologyLayout"
          label="Etymology rendering"
          options={[
            ['layered', 'Layered rows'],
            ['narrative', 'Narrative prose'],
            ['tree',     'Vertical tree'],
          ]}
          value={tweaks.etymologyLayout}
          onChange={(v) => setTweak('etymologyLayout', v)}
        />
        <TweakRadio
          tweak="funfactDensity"
          label="Fun-fact density"
          options={[
            ['stacked', 'Stacked cards'],
            ['carousel', 'Carousel'],
          ]}
          value={tweaks.funfactDensity}
          onChange={(v) => setTweak('funfactDensity', v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

window.BwtlTweaks = BwtlTweaks;
