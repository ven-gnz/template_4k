#pragma once

#include <Windows.h>
#include <gl/gl.h>
#include <math.h>
#include "gl_loader.h"

GLuint VAO;
GLuint VBO;
GLuint shaderProgram;


float vertices[] = {
	-0.5f, -0.5f, 0.0f,
	 0.5f, -0.5f, 0.0f,
	 0.0f,  0.5f, 0.0f
};

const char* vertexShaderSrc = R"(
        #version 130
        in vec3 position;
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    )";

const char* fragmentShaderSrc = R"(
        #version 130
        out vec4 fragColor;
        void main() {
            fragColor = vec4(1, 1, 1, 1); // white color
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
    GLuint vs = compileShader(GL_VERTEX_SHADER, vertexShaderSrc);
    GLuint fs = compileShader(GL_FRAGMENT_SHADER, fragmentShaderSrc);

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

    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);

    shaderProgram = createShaderProgram(vertexShaderSrc, fragmentShaderSrc);

}





void render(float t)
{
	float red = sin(static_cast<double>(t) * 3.14159265);


	glClearColor(red, 0.2f, 0.2f, 1.0f);
	glClear(GL_COLOR_BUFFER_BIT);

    glUseProgram(shaderProgram);
    glBindVertexArray(VAO);
    glDrawArrays(GL_TRIANGLES, 0, 3);

	
}