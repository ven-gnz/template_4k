import sys
from pathlib import Path

input_path = Path("shader.frag")
output_path = Path("shader_src.h")

shader_source = input_path.read_text(encoding="utf-8")

header_code = f"""#pragma once

const char* fragmentShaderSrc = R"GLSL(
{shader_source}
)GLSL";
"""

output_path.write_text(header_code, encoding="utf-8")