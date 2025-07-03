#pragma once

#include <cmath>
#include <windows.h>
#include <wingdi.h>
#include <winuser.h>
#include <mmsystem.h>
#include <gl/gl.h>
#include <gl/GLU.h>

#pragma comment(lib, "opengl32.lib")
#pragma comment(lib, "winmm.lib")
#pragma comment(linker, "/ENTRY:entry")
#pragma comment(linker, "/SUBSYSTEM:WINDOWS")


#define WIN_STYLE_FULLSCREEN (WS_POPUP | WS_VISIBLE)
#define WIN_STYLE_WINDOWED   (WS_OVERLAPPEDWINDOW | WS_VISIBLE)

#ifdef DEBUG_BUILD
	#define SCREENXRES 1024
	#define SCREENYRES 768
	#define WIN_STYLE WIN_STYLE_WINDOWED
#else
	#define SCREENXRES 3840
	#define SCREENYRES 2160
	#define WIN_STYLE WIN_STYLE_FULLSCREEN
#endif


#ifndef DEBUG_BUILD
void SetFullScreenMode()
{
	DEVMODE dev_mode = {0};
	dev_mode.dmSize = sizeof(dev_mode);
	dev_mode.dmPelsHeight = SCREENXRES;
	dev_mode.dmPelsHeight = SCREENYRES;
	dev_mode.dmBitsPerPel = 32;
	dev_mode.dmFields = DM_PELSWIDTH | DM_PELSHEIGHT | DM_BITSPERPEL;
	ChangeDisplaySettings(&dev_mode, CDS_FULLSCREEN);
}
#endif


float vertices[] = {
	-0.5f, -0.5f, 0.0f,
	 0.5f, -0.5f, 0.0f,
	 0.0f,  0.5f, 0.0f
};


static const PIXELFORMATDESCRIPTOR pfd =
{
	sizeof(PIXELFORMATDESCRIPTOR),
	1, // Version
	PFD_DRAW_TO_WINDOW | PFD_SUPPORT_OPENGL | PFD_DOUBLEBUFFER, //Flags
	PFD_TYPE_RGBA,
	32,
	0, 0, //redbits, redshift
	0, 0, //greenbits, greenshift
	0, 0, //bluebites, blueshift
	8, 0, //alpha, alphashift
	0, // bitplanes in accumulation buffer
	0, 0, 0, 0, // accumulated red green blue alpha - planes
	32, //depthBits
	0, //Auxilary buffer
	PFD_MAIN_PLANE, //ilayer type
	0, //byte-reserved
	0, //dwLayerMask
	0, //dwVisiblemask
	0, //dwDamageMask

};



extern "C" void entry() {

	WNDCLASSA wc = { 0 };
	wc.lpfnWndProc = DefWindowProc;
	wc.hInstance = GetModuleHandle(0);
	wc.lpszClassName = "a";

	RegisterClassA(&wc);
	#ifndef DEBUG_BUILD
		SetFullScreenMode();
	#endif

	HWND hwnd = CreateWindowExA(0, "a", 0, WIN_STYLE, 0, 0, SCREENXRES, SCREENYRES, 0, 0, wc.hInstance, 0);
	HDC dc = GetDC(hwnd);

	int fmt = ChoosePixelFormat(dc, &pfd);
	SetPixelFormat(dc, fmt, &pfd);

	HGLRC rc = wglCreateContext(dc);
	wglMakeCurrent(dc, rc);

	long startTime = timeGetTime();
	long currentTime;
	long introEnd = 10000;
	float t;

	do {
		currentTime = timeGetTime() - startTime;
		t = currentTime / 1000.0f;
		float red = sinf(t * 3.14159265);
		glClearColor(red, 0.2f, 0.2f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);
		SwapBuffers(dc);


		Sleep(10);
	}while (!(GetAsyncKeyState(VK_ESCAPE) & 0x8000) && currentTime < introEnd);





	#ifndef DEBUG_BUILD
		ChangeDisplaySettingsA(NULL, 0);
	#endif

	ExitProcess(0);

}
