<template>
  <div class="max-w-md mx-auto px-4 py-6">
    <h1 class="text-2xl font-bold mb-6">Create Pattern</h1>

    <form @submit.prevent="handleSave" class="space-y-5">
      <div>
        <label class="block text-sm opacity-60 mb-1.5">Pattern Name</label>
        <input
          v-model="form.name"
          type="text"
          required
          maxlength="100"
          class="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-breath-primary focus:outline-none"
          placeholder="e.g. My Custom Pattern"
        />
      </div>

      <SliderField v-model="form.inhale" label="Inhale" :min="1" :max="15" unit="s" />
      <SliderField v-model="form.hold" label="Hold" :min="0" :max="15" unit="s" />
      <SliderField v-model="form.exhale" label="Exhale" :min="1" :max="15" unit="s" />
      <SliderField v-model="form.holdAfterExhale" label="Hold After Exhale" :min="0" :max="15" unit="s" />

      <div>
        <label class="block text-sm opacity-60 mb-1.5">Description</label>
        <textarea
          v-model="form.description"
          rows="2"
          maxlength="500"
          class="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-breath-primary focus:outline-none resize-none"
          placeholder="Optional description..."
        />
      </div>

      <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>

      <div class="flex gap-3 pt-2">
        <button
          type="button"
          @click="preview"
          class="flex-1 py-2.5 rounded-lg border border-white/15 hover:bg-white/5 transition-colors"
        >
          Preview
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="flex-1 py-2.5 rounded-lg bg-breath-primary text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {{ saving ? "Saving..." : "Save" }}
        </button>
      </div>
    </form>
  </div>

  <!-- Preview modal -->
  <div
    v-if="showPreview"
    class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    @click.self="showPreview = false"
  >
    <div class="text-center">
      <BreathCircle
        :phase="previewEngine?.phase.value ?? 'idle'"
        :phase-progress="previewEngine?.phaseProgress.value ?? 0"
        :phase-label="previewEngine?.phaseLabel.value ?? ''"
        :time-remaining="previewEngine?.phaseTimeRemaining.value ?? 0"
      />
      <button
        @click="showPreview = false"
        class="mt-8 px-6 py-2 rounded-full border border-white/15 hover:bg-white/5 transition-colors"
      >
        Close Preview
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { usePatternsStore } from "../stores/patterns.js";
import { useBreathingEngine } from "../composables/useBreathingEngine.js";
import SliderField from "../components/SliderField.vue";
import BreathCircle from "../components/BreathCircle.vue";
import type { CreatePatternInput, BreathingPattern } from "@breath/types";

const router = useRouter();
const patternsStore = usePatternsStore();

const form = ref<CreatePatternInput>({
  name: "",
  description: "",
  inhale: 4,
  hold: 4,
  exhale: 4,
  holdAfterExhale: 0,
});

const saving = ref(false);
const error = ref("");
const showPreview = ref(false);
const previewEngine = ref<ReturnType<typeof useBreathingEngine> | null>(null);

async function handleSave() {
  saving.value = true;
  error.value = "";

  try {
    await patternsStore.createPattern(form.value);
    router.push("/patterns");
  } catch (e: any) {
    error.value = e.message ?? "Failed to save pattern";
  } finally {
    saving.value = false;
  }
}

function preview() {
  const previewPattern: BreathingPattern = {
    id: "preview",
    userId: null,
    createdAt: new Date().toISOString(),
    ...form.value,
  };

  previewEngine.value?.stop();
  previewEngine.value = useBreathingEngine(previewPattern);
  showPreview.value = true;
  previewEngine.value.start();

  // Auto-stop after one full cycle
  const cycleDuration =
    previewPattern.inhale +
    previewPattern.hold +
    previewPattern.exhale +
    previewPattern.holdAfterExhale;

  setTimeout(() => {
    previewEngine.value?.stop();
  }, cycleDuration * 1000 + 100);
}
</script>
