#ifndef GL_EXT_LOADER_H
#define GL_EXT_LOADER_H

#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#endif

#include <GL/gl.h>
#include "glext.h"


#define NUM_GL_FUNCS 20

extern void* gl_ext_functions[NUM_GL_FUNCS];

bool LoadGLExtensions();

#define glCreateShader            ((PFNGLCREATESHADERPROC)gl_ext_functions[0])
#define glShaderSource            ((PFNGLSHADERSOURCEPROC)gl_ext_functions[1])
#define glCompileShader           ((PFNGLCOMPILESHADERPROC)gl_ext_functions[2])
#define glCreateProgram           ((PFNGLCREATEPROGRAMPROC)gl_ext_functions[3])
#define glAttachShader            ((PFNGLATTACHSHADERPROC)gl_ext_functions[4])
#define glLinkProgram             ((PFNGLLINKPROGRAMPROC)gl_ext_functions[5])
#define glUseProgram              ((PFNGLUSEPROGRAMPROC)gl_ext_functions[6])
#define glGenBuffers              ((PFNGLGENBUFFERSPROC)gl_ext_functions[7])
#define glBindBuffer              ((PFNGLBINDBUFFERPROC)gl_ext_functions[8])
#define glBufferData              ((PFNGLBUFFERDATAPROC)gl_ext_functions[9])
#define glVertexAttribPointer     ((PFNGLVERTEXATTRIBPOINTERPROC)gl_ext_functions[10])
#define glEnableVertexAttribArray ((PFNGLENABLEVERTEXATTRIBARRAYPROC)gl_ext_functions[11])
#define glDeleteShader            ((PFNGLDELETESHADERPROC)gl_ext_functions[12])
#define glGenVertexArrays         ((PFNGLGENVERTEXARRAYSPROC)gl_ext_functions[13])
#define glBindVertexArray         ((PFNGLBINDVERTEXARRAYPROC)gl_ext_functions[14])
#define glGetAttribLocation      ((PFNGLGETATTRIBLOCATIONPROC)gl_ext_functions[15])
#define glGetUniformLocation     ((PFNGLGETUNIFORMLOCATIONPROC)gl_ext_functions[16])
#define glUniform1f              ((PFNGLUNIFORM1FPROC)gl_ext_functions[17])
#define glUniform2f              ((PFNGLUNIFORM2FPROC)gl_ext_functions[18])
#define glGetProgramiv           ((PFNGLGETPROGRAMIVPROC)gl_ext_functions[19])

#endif


