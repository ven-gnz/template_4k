#pragma once

#include <Windows.h>
#include <gl/gl.h>
#include <math.h>
#include "gl_loader.h"
#include "shader_src.h"
#include "entry.cpp"

GLuint VAO;
GLuint VBO;
GLuint shaderProgram;
GLint iTime, iResolution;


float vertices[] = {
    -1.0f, -1.0f,
     3.0f, -1.0f,
    -1.0f,  3.0f
};

const char* vertexShaderSrc = R"(
        #version 130
        in vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    )";


GLuint compileShader(GLenum type, const char* source)
{
    GLuint shader = glCreateShader(type);
    glShaderSource(shader, 1, &source, nullptr);
    glCompileShader(shader);
    return shader;
}


GLuint createShaderProgram(const char* vertexSource, const char* shaderSource)
{
    
    GLuint vs = compileShader(GL_VERTEX_SHADER, vertexSource);
    GLuint fs = compileShader(GL_FRAGMENT_SHADER, shaderSource);

    GLuint shaderProgram = glCreateProgram();
    glAttachShader(shaderProgram, vs);
    glAttachShader(shaderProgram, fs);
    glLinkProgram(shaderProgram);

    glDeleteShader(vs);
    glDeleteShader(fs);
    return shaderProgram;

}

void setupScene()
{
    glGenVertexArrays(1, &VAO);
    glBindVertexArray(VAO);

    glGenBuffers(1, &VBO);
    glBindBuffer(GL_ARRAY_BUFFER,VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

    shaderProgram = createShaderProgram(vertexShaderSrc, fragmentShaderSrc);

    GLint posAttrib = glGetAttribLocation(shaderProgram, "position");
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);

    iTime = glGetUniformLocation(shaderProgram, "iTime");
    iResolution = glGetUniformLocation(shaderProgram, "iResolution");

}





void render(float t)
{

	glClear(GL_COLOR_BUFFER_BIT);
    glUseProgram(shaderProgram);

    glUniform1f(iTime, t);
    glUniform2f(iResolution, (float)SCREENXRES, (float)SCREENYRES);

    glBindVertexArray(VAO);
    glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);

	
}