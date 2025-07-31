#define WIN32_LEAN_AND_MEAN
#define WIN32_EXTRA_LEAN
#include <windows.h>
#include <mmsystem.h>
#include <GL/gl.h>
#include <math.h>
#include "glext.h"
#include "shader.inl"
#include "audio.inl"

#define XRES 1280
#define YRES 720
// 1920 1080 for RELEASE

// can also try : 2560x1440 OR 4830x2160

#pragma comment(lib, "opengl32.lib")
#pragma comment(lib, "winmm.lib")  

extern const char* shader_frag;


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

static DEVMODE screenSettings = { {0},
    #if _MSC_VER < 1400
    0,0,148,0,0x001c0000,{0},0,0,0,0,0,0,0,0,0,{0},0,32,XRES,YRES,0,0,      // Visual C++ 6.0
    #else
    0,0,156,0,0x001c0000,{0},0,0,0,0,0,{0},0,32,XRES,YRES,{0}, 0,           // Visual Studio 2005
    #endif
    #if(WINVER >= 0x0400)
    0,0,0,0,0,0,
    #if (WINVER >= 0x0500) || (_WIN32_WINNT >= 0x0400)
    0,0
    #endif
    #endif
};



extern "C" void entry(void)
{
    WNDCLASS wc = { CS_OWNDC, DefWindowProc, 0, 0, GetModuleHandle(0), 0, 0, 0, 0, "static" };
    RegisterClass(&wc);
    
    if (ChangeDisplaySettings(&screenSettings, CDS_FULLSCREEN) != DISP_CHANGE_SUCCESSFUL) return; ShowCursor(0);
    HWND hWnd = CreateWindow("static", 0, WS_POPUP | WS_VISIBLE, 0, 0, XRES, YRES, 0, 0, 0, 0);
    HDC hDC = GetDC(hWnd);
    SetPixelFormat(hDC, ChoosePixelFormat(hDC, &pfd), &pfd);
    wglMakeCurrent(hDC, wglCreateContext(hDC));

    //wglSwapLayerBuffers( hDC, WGL_SWAP_MAIN_PLANE ); //SwapBuffers( hDC );

    // init intro
    const unsigned int fsId = ((PFNGLCREATESHADERPROGRAMVPROC)wglGetProcAddress("glCreateShaderProgramv"))(GL_FRAGMENT_SHADER, 1, &shader_frag);
    ((PFNGLUSEPROGRAMPROC)wglGetProcAddress("glUseProgram"))(fsId);

	typedef GLint(APIENTRY* PFNGLGETUNIFORMLOCATIONPROC)(GLuint, const char*);
	typedef void  (APIENTRY* PFNGLUNIFORM1FPROC)(GLint, GLfloat);
	typedef void  (APIENTRY* PFNGLUNIFORM2FPROC)(GLint, GLfloat, GLfloat);

	auto glGetUniformLocation = (PFNGLGETUNIFORMLOCATIONPROC)wglGetProcAddress("glGetUniformLocation");
	auto glUniform1f = (PFNGLUNIFORM1FPROC)wglGetProcAddress("glUniform1f");
	auto glUniform2f = (PFNGLUNIFORM2FPROC)wglGetProcAddress("glUniform2f");

	GLint iTimeLoc = glGetUniformLocation(fsId, VAR_iTime);
	GLint iResolutionLoc = glGetUniformLocation(fsId, VAR_iResolution);
	glUniform2f(iResolutionLoc, (float)XRES, (float)YRES);

    MSG msg;
	long startTime = timeGetTime();
	
	float iTime;
	const int frameTargetMS = 3;
	const DWORD introEnd = 90000;

	fillAudio();
	playAudio();

	do {

		PeekMessage(&msg, hWnd, 0, 0, PM_REMOVE);

		iTime = (timeGetTime() - startTime) * 0.001f;
		glUniform1f(iTimeLoc, iTime);

		glRects(-1, -1, 1, 1);
		SwapBuffers(hDC);

		Sleep(frameTargetMS); // 


	} while (!(msg.message == WM_KEYDOWN && msg.wParam == VK_ESCAPE) && iTime < introEnd);

	stopAudio();
    ChangeDisplaySettings(0, 0);
    ShowCursor(1);
    ExitProcess(0);
}