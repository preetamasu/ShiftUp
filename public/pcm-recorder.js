// Runs on the audio thread: passes each block of microphone samples to the page.
class PcmRecorder extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0]
    if (channel) this.port.postMessage(channel.slice(0))
    return true
  }
}
registerProcessor("pcm-recorder", PcmRecorder)
