import { Mp3Encoder } from '@breezystack/lamejs';

export interface WavInfo {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
  dataOffset: number;
  dataLength: number;
}

/**
 * Parses a standard RIFF/WAV buffer
 */
export function parseWavHeader(buffer: Buffer | Uint8Array): WavInfo {
  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength
  );

  // Check 'RIFF'
  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  if (riff !== 'RIFF') {
    throw new Error('Not a valid RIFF/WAV file format');
  }

  const numChannels = view.getUint16(22, true);
  const sampleRate = view.getUint32(24, true);
  const bitsPerSample = view.getUint16(34, true);

  // Find 'data' subchunk
  let offset = 12;
  let dataOffset = 44;
  let dataLength = buffer.byteLength - 44;

  while (offset < buffer.byteLength - 8) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataLength = chunkSize;
      break;
    }
    offset += 8 + chunkSize;
  }

  return {
    numChannels: numChannels || 1,
    sampleRate: sampleRate || 24000,
    bitsPerSample: bitsPerSample || 16,
    dataOffset,
    dataLength,
  };
}

/**
 * Encodes 16-bit PCM WAV to MP3 Buffer
 */
export function convertWavToMp3(wavBuffer: Buffer | Uint8Array, kbps = 128): Buffer {
  const header = parseWavHeader(wavBuffer);
  const sampleRate = header.sampleRate;
  const numChannels = header.numChannels;

  // Extract 16-bit samples
  const pcmRaw = wavBuffer.subarray(header.dataOffset, header.dataOffset + header.dataLength);
  const totalSamples = Math.floor(pcmRaw.byteLength / 2);
  const samples = new Int16Array(
    pcmRaw.buffer,
    pcmRaw.byteOffset,
    totalSamples
  );

  const encoder = new Mp3Encoder(numChannels, sampleRate, kbps);
  const mp3Data: Buffer[] = [];

  const sampleBlockSize = 1152;
  if (numChannels === 1) {
    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const sampleChunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(Buffer.from(mp3buf));
      }
    }
  } else {
    // Stereo: de-interleave
    const left = new Int16Array(samples.length / 2);
    const right = new Int16Array(samples.length / 2);
    for (let i = 0, j = 0; i < samples.length; i += 2, j++) {
      left[j] = samples[i];
      right[j] = samples[i + 1];
    }
    for (let i = 0; i < left.length; i += sampleBlockSize) {
      const leftChunk = left.subarray(i, i + sampleBlockSize);
      const rightChunk = right.subarray(i, i + sampleBlockSize);
      const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(Buffer.from(mp3buf));
      }
    }
  }

  const flushBuf = encoder.flush();
  if (flushBuf.length > 0) {
    mp3Data.push(Buffer.from(flushBuf));
  }

  return Buffer.concat(mp3Data);
}
