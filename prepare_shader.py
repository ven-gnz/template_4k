import sys

def make_inl(shader_path, output_path):
    with open(shader_path, 'r') as f:
        lines = f.readlines()

    with open(output_path, 'w') as out:
        out.write('static const char* fragmentShader = \\\n')
        for line in lines:
            line = line.rstrip().replace('\\', '\\\\').replace('"', '\\"')
            out.write(f'"{line}\\n"\n')
        out.write(';\n')

if __name__ == "__main__":
    make_inl("shader.frag", "shader.inl")