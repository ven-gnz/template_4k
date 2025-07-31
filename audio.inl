#define SAMPLE_RATE 11025
#define BUF_SIZE (SAMPLE_RATE * 32)
static short audio[BUF_SIZE];

#include <stdlib.h>

static HWAVEOUT hWaveOut = NULL;
static WAVEHDR header = { 0 };


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

float hihat(float t, float startTime) {
    float dt = t - startTime;
    if (dt < 0 || dt > 0.02f) return 0.0f;

    float noise = ((float)rand() / (float)RAND_MAX) * 2.0f - 1.0f;
    float envelope = expf(-60.0f * dt);
    return noise * envelope * 0.2f;
}

void fillAudio() {
    for (int i = 0; i < BUF_SIZE; ++i) {
        float t = (float)i / SAMPLE_RATE;
        int beat = (int)(t * 2.0f);
        int bar = beat / 4;
        int beatInBar = beat % 4;

        float baseFreq = 55.0f;
        float sample = pad(t, baseFreq);

        float hat = 0.0f;

        if (bar < 4) {
            if (beatInBar == 0 && fmodf(t, 2.0f) < 0.01f)
                hat = hihat(t, floorf(t / 2.0f) * 2.0f);
        }

        else if (bar < 8) {
            if (fmodf(t, 0.5f) < 0.01f)
                hat = hihat(t, floorf(t / 0.5f) * 0.5f);
        }

        else if (bar < 10) {
            if (fmodf(t, 0.25f) < 0.005f)
                hat = hihat(t, floorf(t / 0.25f) * 0.25f);
        }

        float mixed = sample + hat;
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
        waveOutClose(hWaveOut);                  // Close device
        hWaveOut = NULL;
    }

}