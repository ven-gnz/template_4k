# Template

A single fragment shader 4k intro template. Work in progress, first release will be on assembly summer 2025.

Takes serious inspiration from Inigo Quilez's templates with a few modernizing features, in that 99% of the setup code is his(in main.cpp)
https://madethisthing.com/iq/Demo-Framework-4k

Links with crinkler:
https://github.com/runestubbe/Crinkler

Minifies the shader with the shader minifier:
https://github.com/laurentlb/shader-minifier

The makefile is minimal, but then again so is the code.

## Using this as a template

If you want to use this template, get a crinkler and shader minifier, place them on your repo,
and update the makefile to point to a compiler. I used the Microsoft Visual Studio compiler, which I run
from the "visual studio developer command prompt". That way the "cl" in the makefile might point to their compiler.