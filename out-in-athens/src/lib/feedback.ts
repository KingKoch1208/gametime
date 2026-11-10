// Haptics + the card-shuffle sound. Every call is fire-and-forget and safe to
// call on simulators / web where the native module may be missing.
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

let soundsOn = true;
export function setSoundsEnabled(v: boolean) {
  soundsOn = v;
}

export const haptic = {
  tap: () => Haptics.selectionAsync().catch(() => {}),
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  stamp: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};

let shufflePlayer: AudioPlayer | null = null;
let stampPlayer: AudioPlayer | null = null;

function play(which: 'shuffle' | 'stamp') {
  if (!soundsOn) return;
  try {
    if (which === 'shuffle') {
      shufflePlayer ??= createAudioPlayer(require('../../assets/sounds/shuffle.wav'));
      shufflePlayer.seekTo(0);
      shufflePlayer.play();
    } else {
      stampPlayer ??= createAudioPlayer(require('../../assets/sounds/stamp.wav'));
      stampPlayer.seekTo(0);
      stampPlayer.play();
    }
  } catch {
    // Audio is a nice-to-have.
  }
}

export const sound = {
  shuffle: () => play('shuffle'),
  stamp: () => play('stamp'),
};
