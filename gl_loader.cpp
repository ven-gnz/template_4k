#include "gl_loader.h"

void* gl_ext_functions[NUM_GL_FUNCS] = { 0 };

static const char* gl_function_names[NUM_GL_FUNCS] = {
    "glCreateShader",
    "glShaderSource",
    "glCompileShader",
    "glCreateProgram",
    "glAttachShader",
    "glLinkProgram",
    "glUseProgram",
    "glGenBuffers",
    "glBindBuffer",
    "glBufferData",
    "glVertexAttribPointer",
    "glEnableVertexAttribArray",
    "glDeleteShader",
    "glGenVertexArrays",
    "glBindVertexArray"
};

bool LoadGLExtensions() {
    for (int i = 0; i < NUM_GL_FUNCS; ++i) {
        gl_ext_functions[i] = (void*)wglGetProcAddress(gl_function_names[i]);
        if (!gl_ext_functions[i]) {
            return false; // fail early
        }
    }
    return true;
}