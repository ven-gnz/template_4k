#define SAMPLE_RATE 11025
#define BUF_SIZE (SAMPLE_RATE * 32)
static short audio[BUF_SIZE];

#include <stdlib.h>

static HWAVEOUT hWaveOut = NULL;
static WAVEHDR header = { 0 };

float bpm = 120.0f;
float beatDuration = 60.0f / bpm;

float fract(float x) { return x - floorf(x); }

float noise(float t) {
    return fract(sinf(t * 1234.567f) * 43758.5453f) * 2.0f - 1.0f;
}


float osc(float t, float f) {
    return sinf(6.2831f * f * t);
}

float pad(float t, float baseFreq) {
    return 0.25f * (
        osc(t, baseFreq) +
        osc(t, baseFreq * 1.5f) +
        osc(t, baseFreq * 2.0f)
        );
}

float hiss(float t) {

    float freq = 4000.0f;          // lower frequency hiss
    float modFreq = 0.2f;          // very slow amplitude modulation (5 sec period)
    float noiseVal = noise(t * freq);
    float amp = (sinf(t * 6.2831f * modFreq) * 0.5f + 0.5f) * 0.3f;
    return noiseVal * amp;
}


void fillAudio() {
    for (int i = 0; i < BUF_SIZE; ++i) {
        float t = (float)i / SAMPLE_RATE;
        int currentBeat = (int)(t / beatDuration);

        float baseFreq = 55.0f;
        float sample = pad(t, baseFreq);
        float mixed = sample;
        if (currentBeat >= 20 && currentBeat <= 28) {
            mixed += hiss(t);
        }
        
        if (mixed > 1.0f) mixed = 1.0f;
        if (mixed < -1.0f) mixed = -1.0f;

        short s = (short)(mixed * 32767.0f);
        audio[i] = s;
    }
}


void playAudio() {
    WAVEFORMATEX format = { 0 };
    format.wFormatTag = WAVE_FORMAT_PCM;
    format.nChannels = 1;
    format.nSamplesPerSec = SAMPLE_RATE;
    format.wBitsPerSample = 16;
    format.nBlockAlign = 2;
    format.nAvgBytesPerSec = SAMPLE_RATE * 2;

    waveOutOpen(&hWaveOut, WAVE_MAPPER, &format, 0, 0, CALLBACK_NULL);

    header.lpData = (LPSTR)audio;
    header.dwBufferLength = sizeof(audio);
    header.dwFlags = 0;

    waveOutPrepareHeader(hWaveOut, &header, sizeof(header));
    waveOutWrite(hWaveOut, &header, sizeof(header));
}



void stopAudio()
{
    if (hWaveOut) {
        waveOutReset(hWaveOut);                  // Stop playback
        waveOutUnprepareHeader(hWaveOut, &header, sizeof(header));
        waveOutClose(hWaveOut);                  
        hWaveOut = NULL;
    }

}