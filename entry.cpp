#pragma once

#include <windows.h>
#include <wingdi.h>
#include <winuser.h>

#pragma comment(lib, "opengl32.lib")
#pragma comment(linker, "/ENTRY:entry")
#pragma comment(linker, "/SUBSYSTEM:WINDOWS")
#include <gl/gl.h>
#include <gl/GLU.h>

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

	for (int i = 0; i < 300; i++) {

		glClearColor(0.0f, 0.2f, 0.2f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);
		SwapBuffers(dc);
	}

	#ifndef DEBUG_BUILD
		ChangeDisplaySettingsA(NULL, 0);
	#endif

	ExitProcess(0);

}
