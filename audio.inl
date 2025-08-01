#define SAMPLE_RATE 11025
#define BUF_SIZE (SAMPLE_RATE * 90)
static short audio[BUF_SIZE];

#include <stdlib.h>

static HWAVEOUT hWaveOut = NULL;
static WAVEHDR header = { 0 };

float bpm = 120.0f;
float beatDuration = 60.0f / bpm;

float fract(float x) { return x - floorf(x); }

float whiteNoise(float t) {
    return fract(sinf(t * 1234.567f) * 43758.5453f) * 2.0f - 1.0f;
}


float osc(float t, float f) {
    return sinf(6.2831f * f * t);
}

float pad(float t, float baseFreq) {

    float wobble = sinf(t * 2.0f * 3.14159f * 0.2f) * 0.05f + 1.0f;
    float f1 = baseFreq * wobble;
    float f2 = baseFreq * 1.5f * wobble;
    float f3 = baseFreq * 2.0f * wobble;

    return 0.25f * (
        osc(t, f1) +
        osc(t, f2) +
        osc(t, f3)
        );
}


float hiss(float t) {
    float freq = 4000.0f;
    float modFreq = 0.1f;          
    float noiseVal = whiteNoise(t * freq);
    float amp = (sinf(t * 6.2831f * modFreq) * 0.5f + 0.5f) * 0.3f;
    return noiseVal * amp;
}

float lerp(float a, float b, float t)
{
    return a + (b - a) * t;
}



float wind(float t) {

    float easywobble = sinf(t * 0.5f * 3.14159f * 0.1f) * 0.05f;
    float freq = 1000.0f;
    return osc(t, freq*easywobble);
    
}


void fillAudio() {
    for (int i = 0; i < BUF_SIZE; ++i) {
        float t = (float)i / SAMPLE_RATE;
        int currentBeat = (int)(t / beatDuration);
        float sample = 0.0f;
        float mixed = 0.0f;
        if (currentBeat < 90)
        {
            mixed += wind(t);
        }
        
        float basePadFreq = 30.0;

        //mid point of intro, display fogs
        if (currentBeat >= 28 && currentBeat < 36) {
            mixed += hiss(t);
        }

        //finale - lift magma and remove lot of attenuation
        if (currentBeat >= 90 && currentBeat <= 94)
        {
            mixed += pad(t, basePadFreq);
        }
        if (currentBeat > 94 && currentBeat < 104)
        {
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